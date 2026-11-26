import { test } from "node:test";
import assert from "node:assert/strict";
import { marketMatches, selectApplicableFrameworks } from "../services/compliance/applicability.js";
import { framework, product } from "./helpers.js";

test("market aliases match (USA = United States)", () => {
  assert.ok(marketMatches("USA", ["United States"]));
  assert.ok(marketMatches("EU", ["European Union"]));
  assert.ok(!marketMatches("India", ["USA"]));
});

test("global frameworks and products without markets always match", () => {
  assert.ok(marketMatches("Global", ["India"]));
  assert.ok(marketMatches("India", []));
  assert.ok(marketMatches(undefined, ["USA"]));
});

test("automatic selection skips company-only, other-market, inactive and empty frameworks", () => {
  const good = framework();
  const companyOnly = framework({ appliesTo: ["company"] });
  const india = framework({ country: "India" });
  const inactive = framework({ isActive: false });
  const empty = framework({ controls: [] });
  const { selected, skipped } = selectApplicableFrameworks([good, companyOnly, india, inactive, empty], product());
  assert.deepEqual(selected, [good]);
  assert.equal(skipped.length, 4);
  assert.match(skipped.find((s) => s.framework === india).reason, /India/);
});

test("explicit frameworkIds override the automatic rules", () => {
  const india = framework({ country: "India" });
  const other = framework();
  const { selected } = selectApplicableFrameworks([india, other], product(), {
    frameworkIds: [india._id.toString()],
  });
  assert.deepEqual(selected, [india]);
});
