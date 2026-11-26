import { InferenceClient } from "@huggingface/inference";

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
// all-MiniLM-L6-v2 produces 384-dimensional sentence vectors. The Qdrant
// collection is created with this size, so the two must stay in sync.
export const EMBEDDING_DIM = 384;

const BATCH_SIZE = 32;

let client;
const getClient = () => {
  if (!client) client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
  return client;
};

const isVector = (v) =>
  Array.isArray(v) && v.length === EMBEDDING_DIM && v.every((x) => typeof x === "number");

/**
 * Embed many texts at once. Returns one 384-number vector per input text,
 * in the same order.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const embedTexts = async (texts) => {
  if (texts.length === 0) return [];
  const vectors = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const output = await getClient().featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: batch,
    });
    // A list of inputs returns a list of vectors. Guard against shapes we
    // don't expect (e.g. per-token output) instead of storing garbage.
    if (!Array.isArray(output) || output.length !== batch.length || !output.every(isVector)) {
      throw new Error(
        `Unexpected embedding output from ${EMBEDDING_MODEL}: expected ${batch.length} vectors of length ${EMBEDDING_DIM}`,
      );
    }
    vectors.push(...output);
  }
  return vectors;
};

/**
 * Generate a vector embedding for a single text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const generateEmbedding = async (text) => (await embedTexts([text]))[0];
