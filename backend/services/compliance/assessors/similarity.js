// Fallback assessor: judges each control only by how closely the best piece
// of product evidence matches it (cosine similarity of MiniLM embeddings).
// This measures whether relevant evidence EXISTS, not whether it proves
// compliance, so reports produced this way are marked "under_review".

export const MET_THRESHOLD = 0.55;
export const PARTIAL_THRESHOLD = 0.4;

export const assessBySimilarity = (control) => {
  const best = control.matches?.[0];
  const score = best?.score ?? 0;
  const status = score >= MET_THRESHOLD ? "met" : score >= PARTIAL_THRESHOLD ? "partial" : "not_met";
  const rationale = best
    ? `Closest evidence: "${best.source}" (similarity ${score.toFixed(2)}). ` +
      (status === "met"
        ? "Strong match - review that it actually satisfies the requirement."
        : status === "partial"
          ? "Related evidence found, but it only partly matches the requirement."
          : "No product evidence closely matches this requirement.")
    : "No product evidence available.";
  return {
    controlKey: control.controlKey,
    status,
    rationale,
    remediation:
      status === "met" ? "" : `Add evidence showing how the product meets: ${control.title || control.controlId}.`,
    evidenceIds: status === "not_met" || !best ? [] : [best.chunkId],
  };
};

export const createSimilarityAssessor = () => ({
  method: "similarity",
  model: null,
  async assess({ controls }) {
    return { results: controls.map(assessBySimilarity), notes: [] };
  },
});
