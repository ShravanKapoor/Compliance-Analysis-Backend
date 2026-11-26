import { test } from "node:test";
import assert from "node:assert/strict";
import { collectGaps, deriveStatus, scoreControls } from "../services/compliance/scoring.js";
import { cosine, matchControls } from "../services/compliance/matching.js";

test("score is risk-weighted and ignores not_applicable", () => {
  const controls = [
    { status: "met", riskLevel: "high" }, // 3/3
    { status: "partial", riskLevel: "medium" }, // 1/2
    { status: "not_met", riskLevel: "low" }, // 0/1
    { status: "not_applicable", riskLevel: "high" },
  ];
  assert.equal(scoreControls(controls), Math.round((100 * 4) / 6));
  assert.equal(scoreControls([{ status: "not_applicable" }]), null);
});

test("status: similarity is always under_review; a mandatory gap blocks compliant", () => {
  const met = [{ status: "met", mandatory: true }];
  assert.equal(deriveStatus({ method: "similarity", score: 100, controls: met }), "under_review");
  assert.equal(deriveStatus({ method: "claude", score: 100, controls: met }), "compliant");
  const gap = [...Array(9).fill({ status: "met", mandatory: false }), { status: "not_met", mandatory: true }];
  assert.equal(deriveStatus({ method: "claude", score: 90, controls: gap }), "non_compliant");
  assert.equal(deriveStatus({ method: "claude", score: 79, controls: met }), "non_compliant");
});

test("gaps list mandatory, high-risk items first", () => {
  const gaps = collectGaps([
    {
      shortCode: "X",
      controls: [
        { controlKey: "a", status: "not_met", riskLevel: "low", mandatory: false },
        { controlKey: "b", status: "partial", riskLevel: "high", mandatory: true },
        { controlKey: "c", status: "met", riskLevel: "high", mandatory: true },
        { controlKey: "d", status: "not_met", riskLevel: "high", mandatory: true },
      ],
    },
  ]);
  assert.deepEqual(gaps.map((g) => g.controlKey), ["d", "b", "a"]);
});

test("cosine and matching rank the closest evidence first", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  const m = matchControls(
    [{ controlKey: "k", vector: [1, 0] }],
    [
      { id: "far", source: "s", text: "t", vector: [0, 1] },
      { id: "near", source: "s", text: "t", vector: [0.9, 0.1] },
    ],
  );
  assert.equal(m.get("k")[0].chunkId, "near");
});
