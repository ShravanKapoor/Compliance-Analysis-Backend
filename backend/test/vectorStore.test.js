import { test } from "node:test";
import assert from "node:assert/strict";
import { getControlVectors, indexFramework, pointId } from "../services/vectorStore.js";
import { fakeEmbed, framework } from "./helpers.js";

const fakeQdrant = () => {
  const points = new Map();
  const calls = { upsert: 0, delete: 0 };
  return {
    points, calls,
    collectionExists: async () => ({ exists: true }),
    delete: async (_c, { filter }) => {
      calls.delete++;
      const id = filter.must[0].match.value;
      for (const [k, p] of points) if (p.payload.frameworkId === id) points.delete(k);
    },
    upsert: async (_c, { points: ps }) => { calls.upsert++; ps.forEach((p) => points.set(p.id, p)); },
    scroll: async (_c, { filter }) => ({
      points: [...points.values()].filter((p) => p.payload.frameworkId === filter.must[0].match.value),
      next_page_offset: null,
    }),
  };
};

test("pointId is a stable UUID", () => {
  const id = pointId("abc", "k1");
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(id, pointId("abc", "k1"));
  assert.notEqual(id, pointId("abc", "k2"));
});

test("first use indexes; later uses read from Qdrant without re-embedding", async () => {
  const qdrant = fakeQdrant();
  const fw = framework();
  let embedded = 0;
  const embedTexts = async (t) => { embedded += t.length; return fakeEmbed(t); };

  const first = await getControlVectors(fw, { embedTexts, qdrant });
  assert.equal(first.reindexed, true);
  assert.equal(qdrant.points.size, 3);
  assert.equal(embedded, 3);

  const second = await getControlVectors(fw, { embedTexts, qdrant });
  assert.equal(second.reindexed, false);
  assert.equal(embedded, 3);
  assert.deepEqual(second.entries.map((e) => e.vector), first.entries.map((e) => e.vector));
});

test("editing or removing a control triggers a re-index", async () => {
  const qdrant = fakeQdrant();
  const fw = framework();
  await indexFramework(fw, { embedTexts: fakeEmbed, qdrant });

  fw.controls[0].requirementText = "Changed requirement";
  assert.equal((await getControlVectors(fw, { embedTexts: fakeEmbed, qdrant })).reindexed, true);

  fw.controls.pop();
  assert.equal((await getControlVectors(fw, { embedTexts: fakeEmbed, qdrant })).reindexed, true);
  assert.equal(qdrant.points.size, 2); // the removed control's point is gone
});

test("without Qdrant, controls are embedded directly", async () => {
  const out = await getControlVectors(framework(), { embedTexts: fakeEmbed, qdrant: null });
  assert.equal(out.entries.length, 3);
});
