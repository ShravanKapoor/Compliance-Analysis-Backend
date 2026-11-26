export const STATUS_LABEL = {
  met: "Met",
  partial: "Partial",
  not_met: "Not met",
  not_applicable: "Not applicable",
  compliant: "Compliant",
  non_compliant: "Non-compliant",
  under_review: "Needs review",
  draft: "Not analysed",
};

export const statusLabel = (status) => STATUS_LABEL[status] ?? status;

export const PRODUCT_TYPES = {
  drug: "Drug",
  medical_device: "Medical device",
  software: "Software",
  ai_system: "AI system",
  diagonistic: "Diagnostic",
  other: "Other",
};

export const RISK_LABEL = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };

export const METHOD_LABEL = { claude: "Claude review", similarity: "Evidence match" };

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
