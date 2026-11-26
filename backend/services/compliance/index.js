import { createClaudeAssessor } from "./assessors/claude.js";
import { createSimilarityAssessor } from "./assessors/similarity.js";

export { runComplianceAnalysis } from "./engine.js";
export { selectApplicableFrameworks } from "./applicability.js";

/**
 * Claude assesses controls when ANTHROPIC_API_KEY is set (or COMPLIANCE_ASSESSOR=claude);
 * otherwise the evidence-similarity fallback is used.
 * COMPLIANCE_ASSESSOR=similarity forces the fallback.
 */
export const createAssessor = (env = process.env) => {
  const choice = (env.COMPLIANCE_ASSESSOR || "").toLowerCase();
  if (choice === "similarity") return createSimilarityAssessor();
  if (choice === "claude" || env.ANTHROPIC_API_KEY) return createClaudeAssessor();
  return createSimilarityAssessor();
};
