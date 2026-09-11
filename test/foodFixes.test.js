import { test } from "node:test";
import assert from "node:assert/strict";

import { foodSeedData } from "../database/seeds/foodSeedData.js";
import {
  DESCRIPTIONS,
  NUTRITION_FIXES,
  applyFixes,
} from "../database/seeds/foodFixes.js";

test("every raw food missing a description is covered by DESCRIPTIONS", () => {
  const uncovered = [
    ...new Set(
      foodSeedData
        .filter((f) => !f.description || !f.description.trim())
        .map((f) => f.name)
    ),
  ].filter((name) => !(name in DESCRIPTIONS));
  assert.deepEqual(uncovered, []);
});

test("applyFixes leaves zero foods without a description", () => {
  const after = foodSeedData.map(applyFixes);
  const stillMissing = after.filter((f) => !f.description || !f.description.trim());
  assert.equal(stillMissing.length, 0);
});

test("descriptions are non-empty strings without newlines", () => {
  for (const [name, desc] of Object.entries(DESCRIPTIONS)) {
    assert.equal(typeof desc, "string", `${name}: description not a string`);
    assert.ok(desc.trim().length > 0, `${name}: empty description`);
    assert.ok(!desc.includes("\n"), `${name}: description contains newline`);
  }
});

test("every NUTRITION_FIXES name exists in the seed catalog", () => {
  const names = new Set(foodSeedData.map((f) => f.name));
  const unknown = Object.keys(NUTRITION_FIXES).filter((n) => !names.has(n));
  assert.deepEqual(unknown, []);
});

test("nutrition fixes produce plausible per-100g values", () => {
  for (const [name, n] of Object.entries(NUTRITION_FIXES)) {
    const food = foodSeedData.find((f) => f.name === name);
    assert.ok(food, `${name}: not found in seed`);
    const servingG = n.servingG ?? food.servingG;
    assert.ok(servingG > 0, `${name}: servingG must be positive`);

    const kcal100 = (n.kcal / servingG) * 100;
    const protein100 = (n.proteinG / servingG) * 100;
    const fat100 = (n.fatG / servingG) * 100;
    const carbs100 = (n.carbsG / servingG) * 100;

    assert.ok(kcal100 >= 25 && kcal100 <= 750, `${name}: kcal/100g ${kcal100}`);
    assert.ok(protein100 >= 0 && protein100 <= 40, `${name}: protein/100g ${protein100}`);
    assert.ok(fat100 >= 0 && fat100 <= 70, `${name}: fat/100g ${fat100}`);
    assert.ok(carbs100 >= 0 && carbs100 <= 100, `${name}: carbs/100g ${carbs100}`);
  }
});

test("the old copy-paste template bug is gone from every fixed food", () => {
  // 26 nut/dried-fruit names used to share the identical impossible template
  // (179 kcal, 5p/15c/11f @ 35g). After fixes each must not carry that signature.
  for (const [name, n] of Object.entries(NUTRITION_FIXES)) {
    const templated =
      Math.abs(n.kcal - 179) <= 1 &&
      Math.abs(n.proteinG - 5) <= 0.5 &&
      Math.abs(n.carbsG - 15) <= 0.5 &&
      Math.abs(n.fatG - 11) <= 0.5;
    assert.ok(!templated, `${name}: still has the 179/5/15/11 template`);
  }
});

test("per-100g nutrition of fixed foods matches known accuracy targets", () => {
  const per100 = (name, field) => {
    const n = NUTRITION_FIXES[name];
    const food = foodSeedData.find((f) => f.name === name);
    const servingG = food.servingG;
    return n[field] / servingG * 100;
  };

  // Almond ~579 kcal/100g, fat ~50g/100g
  assert.ok(per100("Almond", "kcal") > 500, `almond kcal/100g ${per100("Almond", "kcal")}`);
  assert.ok(per100("Almond", "fatG") > 40, `almond fat/100g ${per100("Almond", "fatG")}`);

  // Fresh dates ~282 kcal/100g, fat ~0.3g/100g
  assert.ok(per100("Dates", "kcal") > 200, `dates kcal/100g ${per100("Dates", "kcal")}`);
  assert.ok(per100("Dates", "fatG") < 2, `dates fat/100g ${per100("Dates", "fatG")}`);

  // Fresh coconut flesh ~354 kcal/100g, fat ~33g/100g
  assert.ok(per100("Coconut", "kcal") > 300, `coconut kcal/100g ${per100("Coconut", "kcal")}`);
  assert.ok(per100("Coconut", "fatG") > 25, `coconut fat/100g ${per100("Coconut", "fatG")}`);

  // Walnut ~654 kcal/100g, fat ~65g/100g
  assert.ok(per100("Walnut", "kcal") > 600, `walnut kcal/100g ${per100("Walnut", "kcal")}`);
  assert.ok(per100("Walnut", "fatG") > 55, `walnut fat/100g ${per100("Walnut", "fatG")}`);
});

test("applyFixes is pure: it does not mutate the raw seed record", () => {
  const raw = foodSeedData.find((f) => f.name === "Almond");
  const before = JSON.stringify(raw);
  applyFixes(raw);
  assert.equal(JSON.stringify(raw), before);
});

test("previously-wrong descriptions are corrected", () => {
  assert.equal(DESCRIPTIONS["Cherry Tomato"], "Small, sweet bite-sized tomatoes");
  assert.ok(!DESCRIPTIONS["Cherry Tomato"].toLowerCase().includes("watermelon"));
  assert.ok(DESCRIPTIONS["Turnip Greens"].toLowerCase().includes("turnip"));
});