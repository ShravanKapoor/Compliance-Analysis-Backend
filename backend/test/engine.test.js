import { test } from "node:test";
import assert from "node:assert/strict";
import { runComplianceAnalysis } from "../services/compliance/engine.js";
import { createSimilarityAssessor } from "../services/compliance/assessors/similarity.js";
import { getControlVectors } from "../services/vectorStore.js";
import { fakeEmbed, framework, product } from "./helpers.js";

const run = (p, fws, assessor = createSimilarityAssessor()) =>
  runComplianceAnalysis({
    product: p,
    frameworks: fws,
    embedTexts: fakeEmbed,
    getControlVectors: (fw) => getControlVectors(fw, { embedTexts: fakeEmbed, qdrant: null }),
    assessor,
  });

test("similarity run: matching evidence is found, missing evidence becomes a gap", async () => {
  const report = await run(product(), [framework()]);
  assert.equal(report.method, "similarity");
  assert.equal(report.status, "under_review");
  const [fw] = report.frameworks;
  const byId = Object.fromEntries(fw.controls.map((c) => [c.controlId, c]));
  assert.equal(byId["MDS-1"].status, "met"); // validation report matches
  assert.equal(byId["MDS-1"].evidence[0].source, "Validation report");
  assert.equal(byId["MDS-2"].status, "not_met"); // no cybersecurity evidence
  assert.ok(report.gaps.some((g) => g.controlId === "MDS-2"));
  assert.equal(report.overallScore, fw.score);
  assert.deepEqual(Object.values(fw.counts).reduce((a, b) => a + b, 0), 3);
});

test("adding evidence raises the score", async () => {
  const before = await run(product(), [framework()]);
  const after = await run(
    product({
      evidence: [
        ...product().evidence,
        { title: "Security", content: "A cybersecurity threat model was produced and penetration testing completed." },
      ],
    }),
    [framework()],
  );
  assert.ok(after.overallScore > before.overallScore, `${after.overallScore} > ${before.overallScore}`);
});

test("a product without evidence gets a note", async () => {
  const report = await run(product({ evidence: [] }), [framework()]);
  assert.match(report.notes[0], /no evidence/);
});

test("assessor results drive status and score (claude-style assessor)", async () => {
  const assessor = {
    method: "claude",
    model: "test-model",
    assess: async ({ controls }) => ({
      results: controls.map((c) => ({
        controlKey: c.controlKey,
        status: c.controlId === "MDS-3" ? "not_applicable" : "met",
        rationale: "r",
        remediation: "",
        evidenceIds: ["evidence-1.1"],
      })),
      notes: ["n"],
    }),
  };
  const report = await run(product(), [framework()], assessor);
  assert.equal(report.status, "compliant");
  assert.equal(report.overallScore, 100);
  assert.equal(report.model, "test-model");
  assert.deepEqual(report.notes, ["n"]);
  assert.equal(report.frameworks[0].counts.not_applicable, 1);
});
