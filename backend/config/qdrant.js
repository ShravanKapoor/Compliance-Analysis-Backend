import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBEDDING_DIM } from "../utils/embeddings.js";

export const FRAMEWORK_COLLECTION = "frameworks";

// Qdrant is optional: without QDRANT_URL the compliance engine embeds
// framework controls on the fly instead of caching them.
export const isQdrantConfigured = () => Boolean(process.env.QDRANT_URL);

let client;
export const getQdrantClient = () => {
  if (!client) {
    client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return client;
};

let ensured;
/**
 * Create the frameworks collection (and its frameworkId payload index) if it
 * doesn't exist. Runs once per process; a failure is retried on the next call.
 */
export const ensureFrameworkCollection = (qdrant = getQdrantClient()) => {
  if (!ensured) {
    ensured = (async () => {
      const { exists } = await qdrant.collectionExists(FRAMEWORK_COLLECTION);
      if (exists) return;
      await qdrant.createCollection(FRAMEWORK_COLLECTION, {
        vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
      });
      // Payload index so we can filter points by frameworkId
      await qdrant.createPayloadIndex(FRAMEWORK_COLLECTION, {
        field_name: "frameworkId",
        field_schema: "keyword",
        wait: true,
      });
      console.log(`Qdrant collection '${FRAMEWORK_COLLECTION}' created.`);
    })().catch((err) => {
      ensured = undefined;
      throw err;
    });
  }
  return ensured;
};

export default getQdrantClient;
