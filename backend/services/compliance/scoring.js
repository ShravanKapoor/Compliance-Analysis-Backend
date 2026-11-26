// Turns per-control results into scores and an overall status.

export const RISK_WEIGHT = { low: 1, medium: 2, high: 3 };
export const STATUS_CREDIT = { met: 1, partial: 0.5, not_met: 0 };
export const COMPLIANT_THRESHOLD = 80;

/** Risk-weighted 0-100 score. not_applicable controls are left out; null if none apply. */
export const scoreControls = (controls) => {
  let earned = 0, possible = 0;
  for (const c of controls) {
    if (c.status === "not_applicable") continue;
    const w = RISK_WEIGHT[c.riskLevel] ?? RISK_WEIGHT.medium;
    possible += w;
    earned += w * (STATUS_CREDIT[c.status] ?? 0);
  }
  return possible === 0 ? null : Math.round((100 * earned) / possible);
};

export const countStatuses = (controls) => {
  const counts = { met: 0, partial: 0, not_met: 0, not_applicable: 0 };
  for (const c of controls) counts[c.status] = (counts[c.status] ?? 0) + 1;
  return counts;
};

/**
 * Overall status for the product.
 * - The similarity method only measures whether matching evidence exists, so it
 *   never declares a product compliant: results are "under_review".
 * - Otherwise: compliant when the score reaches the threshold and no mandatory
 *   control is not_met.
 */
export const deriveStatus = ({ method, score, controls }) => {
  if (method === "similarity") return "under_review";
  if (score === null) return "under_review";
  const mandatoryGap = controls.some((c) => c.mandatory && c.status === "not_met");
  return score >= COMPLIANT_THRESHOLD && !mandatoryGap ? "compliant" : "non_compliant";
};

/** Unmet and partial controls, most serious first. */
export const collectGaps = (frameworkResults) =>
  frameworkResults
    .flatMap((fw) =>
      fw.controls
        .filter((c) => c.status === "not_met" || c.status === "partial")
        .map((c) => ({
          frameworkShortCode: fw.shortCode,
          controlKey: c.controlKey,
          controlId: c.controlId,
          title: c.title,
          status: c.status,
          riskLevel: c.riskLevel,
          mandatory: c.mandatory,
          remediation: c.remediation,
        })),
    )
    .sort(
      (a, b) =>
        Number(b.mandatory) - Number(a.mandatory) ||
        (RISK_WEIGHT[b.riskLevel] ?? 2) - (RISK_WEIGHT[a.riskLevel] ?? 2) ||
        (a.status === "not_met" ? -1 : 0) - (b.status === "not_met" ? -1 : 0),
    );
