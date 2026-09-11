import { test } from "node:test";
import assert from "node:assert/strict";

import { FORMULAS } from "../database/seeds/healthFormulaData.js";

test("healthFormulaData contains 18 formulas", () => {
  assert.equal(FORMULAS.length, 18);
});

test("formula keys are unique", () => {
  const keys = FORMULAS.map((f) => f.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("every formula has the expected shape", () => {
  for (const f of FORMULAS) {
    assert.ok(f.key, `missing key`);
    assert.ok(f.name, `missing name for ${f.key}`);
    assert.ok(f.category, `missing category for ${f.key}`);
    assert.ok(f.description, `missing description for ${f.key}`);
    assert.ok(f.formula, `missing formula body for ${f.key}`);
    assert.ok(Array.isArray(f.params), `params must be array for ${f.key}`);
    assert.ok(
      f.constants && typeof f.constants === "object",
      `constants must be object for ${f.key}`
    );
    assert.ok(Number.isInteger(f.sortOrder), `sortOrder must be int for ${f.key}`);
  }
});

test("sortOrder is sequential 1..18", () => {
  const orders = FORMULAS.map((f) => f.sortOrder).sort((a, b) => a - b);
  assert.deepEqual(orders, Array.from({ length: 18 }, (_, i) => i + 1));
});

test("expected formula keys are present", () => {
  const keys = FORMULAS.map((f) => f.key).sort();
  assert.deepEqual(keys, [
    "activity-multipliers",
    "bmi",
    "bmi-categories",
    "bmr",
    "duration-format",
    "get-calculated-goal",
    "goal-plan",
    "height-conversion",
    "ideal-weight",
    "kcal-per-kg",
    "loss-rate",
    "safe-floors",
    "safe-loss-rate",
    "stat-limits",
    "surplus-per-kg-month",
    "tdee",
    "validate-weight-loss-goal",
    "weight-loss-plan",
  ]);
});

test("gender-dependent calorie floor constants match the medical floors", () => {
  const floors = FORMULAS.find((f) => f.key === "safe-floors").constants;
  assert.equal(floors.male, 1500);
  assert.equal(floors.female, 1200);
});

test("stat-limits match the plausible input windows", () => {
  const limits = FORMULAS.find((f) => f.key === "stat-limits").constants;
  assert.equal(limits.minAge, 2);
  assert.equal(limits.maxAge, 120);
  assert.equal(limits.minHeight, 50);
  assert.equal(limits.maxHeight, 260);
  assert.equal(limits.minWeight, 15);
  assert.equal(limits.maxWeight, 350);
  assert.deepEqual(limits.validGenders, ["male", "female"]);
});

test("activity multipliers follow the standard Harris-Benedict-derived set", () => {
  const acts = FORMULAS.find((f) => f.key === "activity-multipliers").constants;
  assert.equal(acts.sedentary, 1.2);
  assert.equal(acts.lightlyActive, 1.375);
  assert.equal(acts.moderatelyActive, 1.55);
  assert.equal(acts.veryActive, 1.725);
});

test("kcal-per-kg uses the standard 7700 kcal/kg constant", () => {
  const kcal = FORMULAS.find((f) => f.key === "kcal-per-kg").constants;
  assert.equal(kcal.kcalPerKg, 7700);
});

test("key constants stay consistent across related formulas", () => {
  const get = (k) => FORMULAS.find((f) => f.key === k).constants;

  // deficit references must agree
  const lossRate = get("loss-rate");
  const goalPlan = get("goal-plan");
  const calcGoal = get("get-calculated-goal");
  assert.equal(goalPlan.deficitKcal, lossRate.deficitKcal);
  assert.equal(goalPlan.surplusKcal, lossRate.surplusKcal);
  assert.equal(calcGoal.surplusPerKgMonth, get("surplus-per-kg-month").kcalPerDay);

  // weeks-per-month must agree between loss-rate and goal tools
  const safeRate = get("safe-loss-rate");
  assert.equal(safeRate.weeksPerMonth, get("duration-format").weeksPerMonth);
});