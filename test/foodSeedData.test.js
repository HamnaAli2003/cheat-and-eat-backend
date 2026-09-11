import { test } from "node:test";
import assert from "node:assert/strict";

import { foodSeedData, FOOD_SEED_COUNT } from "../database/seeds/foodSeedData.js";

const REQUIRED = [
  "slug",
  "name",
  "region",
  "category",
  "imageUrl",
  "imageSource",
  "kcal",
  "proteinG",
  "carbsG",
  "fatG",
];

test("foodSeedData matches the declared seed count", () => {
  assert.equal(foodSeedData.length, FOOD_SEED_COUNT);
  assert.equal(FOOD_SEED_COUNT, 1434);
});

test("every food has the required fields", () => {
  const missing = [];
  for (const food of foodSeedData) {
    for (const f of REQUIRED) {
      if (food[f] === undefined || food[f] === null || food[f] === "") {
        missing.push(`${food.name} -> ${f}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("slugs are unique across the whole catalog", () => {
  const seen = new Map();
  for (const food of foodSeedData) {
    if (seen.has(food.slug)) {
      seen.set(food.slug, seen.get(food.slug) + 1);
    } else {
      seen.set(food.slug, 1);
    }
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  assert.deepEqual(dupes, []);
});

test("name lists may repeat across categories, but slug is the unique identity", () => {
  // e.g. "Seekh Kebab" exists as a curry-kebab and a snack for the same region;
  // the slug (region-category-name) is what guarantees uniqueness.
  const seenSlugs = foodSeedData.map((f) => f.slug);
  assert.equal(new Set(seenSlugs).size, seenSlugs.length, "slugs must be unique");
});

test("categories are within the known set", () => {
  const allowed = new Set([
    "vegetable", "rice", "curry-kebab", "dessert", "drink", "bread", "snack", "fruit",
  ]);
  const bad = [...new Set(foodSeedData.map((f) => f.category))].filter(
    (c) => !allowed.has(c)
  );
  assert.deepEqual(bad, []);
});

test("every food has an image URL and source", () => {
  const missingUrl = foodSeedData.filter((f) => !f.imageUrl).length;
  const missingSource = foodSeedData.filter((f) => !f.imageSource).length;
  assert.equal(missingUrl, 0, "foods with no imageUrl");
  assert.equal(missingSource, 0, "foods with no imageSource");
});

test("macronutrients add up to a plausible kcal value", () => {
  const bad = [];
  for (const food of foodSeedData) {
    const fromMacros = food.proteinG * 4 + food.carbsG * 4 + food.fatG * 9;
    const diff = Math.abs(fromMacros - food.kcal);
    // allow wiggle room for oil-based dishes / rounding
    if (food.kcal > 0 && fromMacros > 0 && diff / food.kcal > 0.35) {
      bad.push(`${food.name}: kcal ${food.kcal}, macros ~${fromMacros.toFixed(0)}`);
    }
  }
  assert.deepEqual(bad, []);
});