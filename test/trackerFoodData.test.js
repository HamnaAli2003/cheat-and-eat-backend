import { test } from "node:test";
import assert from "node:assert/strict";

import { foodSeedData } from "../database/seeds/foodSeedData.js";
import { TRACKER_FOOD_FIXES } from "../database/seeds/trackerFoodFixes.js";
import { TRACKER_FOOD_ADDITIONS } from "../database/seeds/trackerFoodAdditions.js";

const SLUG_RE = /^[a-z0-9-]+$/;

const plausiblePer100 = (name, values) => {
  const kcal = values.baseCalories;
  assert.ok(kcal >= 20 && kcal <= 750, `${name}: kcal/100g ${kcal}`);
  assert.ok(valueInRange(values.baseProtein, 0, 40), `${name}: protein/100g ${values.baseProtein}`);
  assert.ok(valueInRange(values.baseFat, 0, 60), `${name}: fat/100g ${values.baseFat}`);
  assert.ok(valueInRange(values.baseCarbs, 0, 90), `${name}: carbs/100g ${values.baseCarbs}`);
};

const valueInRange = (v, min, max) => v >= min && v <= max;

const assertServing = (name, f) => {
  assert.ok(f.servingG > 0, `${name}: servingG must be positive`);
  assert.equal(typeof f.servingLabel, "string", `${name}: servingLabel not a string`);
  assert.ok(f.servingLabel.trim().length > 0, `${name}: empty servingLabel`);
  assert.ok(!f.servingLabel.includes("\n"), `${name}: servingLabel contains newline`);
};

const assertOil = (name, f) => {
  assert.ok(f.oilG >= 0, `${name}: oilG must be non-negative`);
  assert.ok(f.oilKcal >= 0, `${name}: oilKcal must be non-negative`);
  assert.equal(f.oilKcal, Math.round(f.oilG * 9 * 100) / 100, `${name}: oilKcal must equal oilG * 9`);
};

test("tracker food fixes target distinct slugs", () => {
  const slugs = Object.keys(TRACKER_FOOD_FIXES);
  assert.equal(new Set(slugs).size, slugs.length, "fix slugs must be unique");
  for (const slug of slugs) {
    assert.match(slug, SLUG_RE, `bad slug: ${slug}`);
  }
});

test("tracker food fixes produce plausible per-100g values", () => {
  for (const [slug, fix] of Object.entries(TRACKER_FOOD_FIXES)) {
    plausiblePer100(slug, fix);
    assertServing(slug, fix);
    assertOil(slug, fix);
  }
});

test("the placeholder combo rows are no longer zero-calorie", () => {
  const comboSlugs = ["daal-chawal", "halwa-puri"];
  for (const slug of comboSlugs) {
    const fix = TRACKER_FOOD_FIXES[slug];
    assert.ok(fix, `${slug}: combo fix missing`);
    assert.ok(fix.baseCalories > 0, `${slug}: still 0 kcal`);
    assert.ok(fix.baseProtein > 0, `${slug}: still 0 protein`);
  }
});

test("tracker food additions number exactly 17", () => {
  assert.equal(TRACKER_FOOD_ADDITIONS.length, 17);
});

test("tracker food additions have the required fields", () => {
  const REQUIRED = [
    "name",
    "slug",
    "category",
    "description",
    "baseCalories",
    "baseProtein",
    "baseCarbs",
    "baseFat",
    "servingG",
    "servingLabel",
    "oilG",
    "oilKcal",
  ];
  const missing = [];
  for (const food of TRACKER_FOOD_ADDITIONS) {
    for (const f of REQUIRED) {
      if (food[f] === undefined || food[f] === null || food[f] === "") {
        missing.push(`${food.name} -> ${f}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("addition names are new to the existing catalog (no duplication)", () => {
  const existing = new Set(foodSeedData.map((f) => f.name));
  const dupes = TRACKER_FOOD_ADDITIONS.map((f) => f.name).filter((n) => existing.has(n));
  assert.deepEqual(dupes, [], "an added food name already exists in the seed catalog");
});

test("addition slugs are unique and distinct from fixed slugs", () => {
  const slugs = TRACKER_FOOD_ADDITIONS.map((f) => f.slug);
  assert.equal(new Set(slugs).size, slugs.length, "addition slugs must be unique");
  for (const slug of slugs) {
    assert.match(slug, SLUG_RE, `bad slug: ${slug}`);
    assert.ok(!(slug in TRACKER_FOOD_FIXES), `${slug}: also present in fixes`);
  }
});

test("addition categories are within the known set", () => {
  const allowed = new Set([
    "vegetable", "rice", "curry-kebab", "dessert", "drink", "drinks",
    "bread", "snack", "fruit", "daal", "sabzi", "meat", "combos", "breakfast",
  ]);
  const bad = [...new Set(TRACKER_FOOD_ADDITIONS.map((f) => f.category))].filter(
    (c) => !allowed.has(c)
  );
  assert.deepEqual(bad, [], "unknown category slug");
});

test("addition descriptions are non-empty strings without newlines", () => {
  for (const food of TRACKER_FOOD_ADDITIONS) {
    assert.equal(typeof food.description, "string", `${food.name}: description not a string`);
    assert.ok(food.description.trim().length > 0, `${food.name}: empty description`);
    assert.ok(!food.description.includes("\n"), `${food.name}: description contains newline`);
  }
});

test("tracker food additions produce plausible per-100g values", () => {
  for (const food of TRACKER_FOOD_ADDITIONS) {
    plausiblePer100(food.name, food);
    assertServing(food.name, food);
    assertOil(food.name, food);
  }
});

test("high-protein additions are actually high in protein", () => {
  const grilled = TRACKER_FOOD_ADDITIONS.find((f) => f.slug === "grilled-chicken-breast");
  const eggs = TRACKER_FOOD_ADDITIONS.find((f) => f.slug === "boiled-eggs");
  assert.ok(grilled.baseProtein >= 25, "grilled chicken breast must be protein-dense");
  assert.ok(eggs.baseProtein >= 10, "boiled eggs must be protein-dense");
  assert.ok(grilled.baseFat < 10, "grilled chicken breast must be lean");
});

test("fix slugs reference a name and never the zero-kcal combo value", () => {
  for (const [slug, fix] of Object.entries(TRACKER_FOOD_FIXES)) {
    assert.ok(fix.name && fix.name.trim(), `${slug}: missing name`);
  }
});