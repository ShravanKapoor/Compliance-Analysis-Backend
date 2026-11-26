// Turns a product into text chunks that can be embedded and compared with
// framework controls. Chunk 0 is always the product profile.

export const MAX_CHUNK_CHARS = 800;

/** Split text into pieces of at most `max` characters, on paragraph then sentence boundaries. */
export const splitText = (text, max = MAX_CHUNK_CHARS) => {
  const clean = (text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const pieces = [];
  let current = "";
  const push = () => {
    if (current.trim()) pieces.push(current.trim());
    current = "";
  };
  const units = clean
    .split(/\n\s*\n/)
    .flatMap((para) => para.match(/[^.!?]+[.!?]*\s*/g) || [para]);
  for (const unit of units) {
    if ((current + unit).length > max) push();
    if (unit.length > max) {
      for (let i = 0; i < unit.length; i += max) pieces.push(unit.slice(i, i + max).trim());
      continue;
    }
    current += unit;
  }
  push();
  return pieces;
};

const line = (label, value) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)
    ? null
    : `${label}: ${Array.isArray(value) ? value.join(", ") : value}`;

export const productProfileText = (product) => {
  const r = product.regulatory || {};
  const approvals = (r.approvals || [])
    .map((a) => [a.authority, a.approvalNumber].filter(Boolean).join(" "))
    .filter(Boolean);
  return [
    line("Product", product.productName),
    line("Product code", product.productCode),
    line("Product type", product.productType),
    line("Description", product.description),
    line("Intended use", r.intendedUse),
    line("Device class", r.deviceClass),
    line("Risk category", r.riskCategory),
    line("Markets", r.market),
    line("Approvals", approvals),
  ]
    .filter(Boolean)
    .join("\n");
};

/**
 * @returns {Array<{id: string, source: string, text: string}>}
 */
export const buildEvidenceChunks = (product) => {
  const chunks = [{ id: "profile", source: "Product profile", text: productProfileText(product) }];
  (product.evidence || []).forEach((item, i) => {
    const title = (item.title || "").trim() || `Evidence ${i + 1}`;
    splitText(item.content).forEach((piece, j) => {
      chunks.push({ id: `evidence-${i + 1}.${j + 1}`, source: title, text: `${title}: ${piece}` });
    });
  });
  return chunks;
};
