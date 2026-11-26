import { createHash } from "node:crypto";

// Deterministic stand-in for the Hugging Face model: a bag-of-words vector
// hashed into 384 dimensions. Texts that share words get similar vectors.
export const fakeEmbed = async (texts) =>
  texts.map((text) => {
    const v = new Array(384).fill(0);
    for (const word of text.toLowerCase().match(/[a-z0-9]+/g) || []) {
      if (word.length < 3) continue;
      const h = createHash("md5").update(word).digest();
      v[h.readUInt16BE(0) % 384] += 1;
    }
    return v;
  });

let n = 0;
export const oid = () => {
  const id = (++n).toString(16).padStart(24, "0");
  return { toString: () => id };
};

export const framework = (overrides = {}) => ({
  _id: oid(),
  name: "Medical Device Software",
  shortCode: "MDS",
  version: "1.0",
  country: "USA",
  appliesTo: ["product"],
  isActive: true,
  controls: [
    {
      _id: oid(),
      controlId: "MDS-1",
      title: "Software validation",
      requirementText: "Software validation testing must be performed and documented in a validation report",
      riskLevel: "high",
      mandatory: true,
    },
    {
      _id: oid(),
      controlId: "MDS-2",
      title: "Cybersecurity risk assessment",
      requirementText: "A cybersecurity threat model and penetration testing must be completed",
      riskLevel: "medium",
      mandatory: true,
    },
    {
      _id: oid(),
      controlId: "MDS-3",
      title: "Labelling",
      requirementText: "Labels must include the unique device identifier",
      riskLevel: "low",
      mandatory: false,
    },
  ],
  ...overrides,
});

export const product = (overrides = {}) => ({
  _id: oid(),
  productName: "CardioScan",
  productType: "software",
  description: "AI software that reads ECG traces",
  regulatory: { market: ["United States"], intendedUse: "Detect arrhythmia", riskCategory: "high" },
  evidence: [
    {
      title: "Validation report",
      content: "Software validation testing was performed and documented in validation report VR-12.",
    },
  ],
  ...overrides,
});
