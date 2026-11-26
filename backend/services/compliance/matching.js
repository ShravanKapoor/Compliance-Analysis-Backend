// Finds the product evidence closest to each framework control.

export const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

/**
 * @param {Array<{controlKey, vector}>} controls
 * @param {Array<{id, source, text, vector}>} evidence
 * @returns {Map<string, Array<{chunkId, source, text, score}>>} best matches per control, highest first
 */
export const matchControls = (controls, evidence, topK = 3) => {
  const result = new Map();
  for (const control of controls) {
    const ranked = evidence
      .map((e) => ({ chunkId: e.id, source: e.source, text: e.text, score: cosine(control.vector, e.vector) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
    result.set(control.controlKey, ranked);
  }
  return result;
};
