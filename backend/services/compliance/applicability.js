// Decides which frameworks a product should be checked against.

const norm = (s) => (s || "").toString().trim().toLowerCase();

const GLOBAL = new Set(["global", "international", "worldwide", "all"]);

// Common spellings of the same market, so "USA" matches "United States".
const ALIASES = {
  us: ["us", "usa", "u.s.", "u.s.a.", "united states", "united states of america", "america"],
  uk: ["uk", "u.k.", "united kingdom", "great britain", "britain", "england"],
  eu: ["eu", "european union", "europe"],
  india: ["india", "in", "bharat"],
};
const canonical = (s) => {
  const n = norm(s);
  for (const [key, names] of Object.entries(ALIASES)) if (names.includes(n)) return key;
  return n;
};

export const marketMatches = (frameworkCountry, productMarkets = []) => {
  if (!frameworkCountry || GLOBAL.has(norm(frameworkCountry))) return true;
  if (productMarkets.length === 0) return true; // unknown markets: don't exclude
  const fc = canonical(frameworkCountry);
  return productMarkets.some((m) => GLOBAL.has(norm(m)) || canonical(m) === fc);
};

/**
 * @param {Array} frameworks  active frameworks
 * @param {Object} product
 * @param {{frameworkIds?: string[]}} options  explicit selection overrides the automatic rules
 * @returns {{selected: Array, skipped: Array<{framework, reason}>}}
 */
export const selectApplicableFrameworks = (frameworks, product, { frameworkIds } = {}) => {
  const selected = [];
  const skipped = [];
  const wanted = frameworkIds?.length ? new Set(frameworkIds.map(String)) : null;

  for (const fw of frameworks) {
    const id = fw._id.toString();
    if (wanted && !wanted.has(id)) continue;
    if (fw.isActive === false) {
      skipped.push({ framework: fw, reason: "Framework is inactive" });
    } else if (!fw.controls || fw.controls.length === 0) {
      skipped.push({ framework: fw, reason: "Framework has no controls to check" });
    } else if (wanted) {
      selected.push(fw); // explicitly requested: skip the automatic rules
    } else if (fw.appliesTo?.length && !fw.appliesTo.includes("product")) {
      skipped.push({ framework: fw, reason: "Framework applies to companies, not products" });
    } else if (!marketMatches(fw.country, product.regulatory?.market)) {
      skipped.push({
        framework: fw,
        reason: `Framework is for ${fw.country}; product markets are ${product.regulatory.market.join(", ")}`,
      });
    } else {
      selected.push(fw);
    }
  }
  return { selected, skipped };
};
