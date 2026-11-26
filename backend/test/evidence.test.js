import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceChunks, splitText } from "../services/compliance/evidence.js";
import { product } from "./helpers.js";

test("profile chunk comes first and includes regulatory details", () => {
  const chunks = buildEvidenceChunks(product());
  assert.equal(chunks[0].id, "profile");
  assert.match(chunks[0].text, /Product: CardioScan/);
  assert.match(chunks[0].text, /Markets: United States/);
  assert.match(chunks[0].text, /Intended use: Detect arrhythmia/);
  assert.equal(chunks[1].source, "Validation report");
});

test("empty profile fields are left out", () => {
  const [profile] = buildEvidenceChunks({ productName: "X", regulatory: { market: [] } });
  assert.equal(profile.text, "Product: X");
});

test("long evidence is split into pieces no longer than the limit", () => {
  const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} about testing.`).join(" ");
  const pieces = splitText(long, 200);
  assert.ok(pieces.length > 1);
  assert.ok(pieces.every((p) => p.length <= 200));
  assert.equal(pieces.join(" ").replace(/\s+/g, " "), long);
});

test("evidence without a title gets a numbered source", () => {
  const chunks = buildEvidenceChunks(product({ evidence: [{ content: "Some text." }] }));
  assert.equal(chunks[1].source, "Evidence 1");
  assert.equal(chunks[1].id, "evidence-1.1");
});
