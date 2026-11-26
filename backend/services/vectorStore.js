import { createHash } from "node:crypto";
import { chunkFramework } from "../utils/chunking.js";
import {
  FRAMEWORK_COLLECTION,
  ensureFrameworkCollection,
  getQdrantClient,
  isQdrantConfigured,
} from "../config/qdrant.js";

const sha1 = (s) => createHash("sha1").update(s).digest("hex");

/**
 * Qdrant point ids must be integers or UUIDs. Derive a stable UUID from the
 * framework and control so re-indexing overwrites the same points.
 */
export const pointId = (frameworkId, controlKey) => {
  const h = sha1(`${frameworkId}:${controlKey}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const frameworkFilter = (frameworkId) => ({
  must: [{ key: "frameworkId", match: { value: frameworkId } }],
});

const controlChunks = (framework) =>
  chunkFramework(framework).filter((c) => !c.metadata.isGeneralDescription);

/**
 * Embed a framework's controls and store them in Qdrant (if configured),
 * replacing any points from a previous index of the same framework.
 * @returns {Promise<Array<{controlKey: string, text: string, vector: number[]}>>}
 */
export const indexFramework = async (
  framework,
  { embedTexts, qdrant = isQdrantConfigured() ? getQdrantClient() : null },
) => {
  const chunks = controlChunks(framework);
  const vectors = await embedTexts(chunks.map((c) => c.text));
  const entries = chunks.map((c, i) => ({
    controlKey: c.metadata.controlKey,
    text: c.text,
    vector: vectors[i],
  }));

  if (qdrant) {
    const frameworkId = framework._id.toString();
    await ensureFrameworkCollection(qdrant);
    await qdrant.delete(FRAMEWORK_COLLECTION, { wait: true, filter: frameworkFilter(frameworkId) });
    if (entries.length > 0) {
      await qdrant.upsert(FRAMEWORK_COLLECTION, {
        wait: true,
        points: chunks.map((c, i) => ({
          id: pointId(frameworkId, c.metadata.controlKey),
          vector: vectors[i],
          payload: { ...c.metadata, textHash: sha1(c.text) },
        })),
      });
    }
  }
  return entries;
};

const scrollAll = async (qdrant, frameworkId) => {
  const points = [];
  let offset;
  do {
    const page = await qdrant.scroll(FRAMEWORK_COLLECTION, {
      filter: frameworkFilter(frameworkId),
      limit: 256,
      offset,
      with_payload: true,
      with_vector: true,
    });
    points.push(...page.points);
    offset = page.next_page_offset ?? undefined;
  } while (offset !== undefined && offset !== null);
  return points;
};

/**
 * Vectors for every control of a framework. Reads them from Qdrant when the
 * stored points match the framework's current controls; otherwise (first use,
 * or controls edited since) re-indexes. Without Qdrant, embeds directly.
 * @returns {Promise<{entries: Array<{controlKey, text, vector}>, reindexed: boolean}>}
 */
export const getControlVectors = async (
  framework,
  { embedTexts, qdrant = isQdrantConfigured() ? getQdrantClient() : null },
) => {
  const chunks = controlChunks(framework);
  if (!qdrant) {
    return { entries: await indexFramework(framework, { embedTexts, qdrant: null }), reindexed: true };
  }

  await ensureFrameworkCollection(qdrant);
  const points = await scrollAll(qdrant, framework._id.toString());
  const byKey = new Map(points.map((p) => [p.payload?.controlKey, p]));
  const upToDate =
    points.length === chunks.length &&
    chunks.every((c) => byKey.get(c.metadata.controlKey)?.payload?.textHash === sha1(c.text));

  if (!upToDate) {
    return { entries: await indexFramework(framework, { embedTexts, qdrant }), reindexed: true };
  }
  return {
    entries: chunks.map((c) => ({
      controlKey: c.metadata.controlKey,
      text: c.text,
      vector: byKey.get(c.metadata.controlKey).vector,
    })),
    reindexed: false,
  };
};
