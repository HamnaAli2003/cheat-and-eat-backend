import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMealSchema,
  mealListQuerySchema,
  mealHistoryQuerySchema,
  deleteMealParamsSchema,
} from "../src/validators/mealValidator.js";

test("createMealSchema accepts a valid preset meal", () => {
  const result = createMealSchema.safeParse({
    date: "2026-09-08",
    name: "Chicken Biryani",
    imageUrl: "https://example.com/biryani.jpg",
    portion: "Medium · 250g",
    mealType: "lunch",
    calories: 650,
    protein: 28,
    carbs: 70,
    fat: 24,
    fiber: 5,
  });
  assert.equal(result.success, true);
});

test("createMealSchema accepts a custom quick-add (no foodId/image)", () => {
  const result = createMealSchema.safeParse({
    name: "My homemade shake",
    imageUrl: null,
    portion: "400 kcal (custom)",
    mealType: "snacks",
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 0,
  });
  assert.equal(result.success, true);
  assert.equal(result.data.fiber, 0, "fiber should default to 0");
});

test("createMealSchema rejects an invalid meal type", () => {
  const result = createMealSchema.safeParse({
    name: "Chai",
    mealType: "brunch",
    calories: 50,
  });
  assert.equal(result.success, false);
});

test("createMealSchema rejects a missing name", () => {
  const result = createMealSchema.safeParse({
    mealType: "breakfast",
    calories: 120,
  });
  assert.equal(result.success, false);
});

test("createMealSchema rejects negative calories", () => {
  const result = createMealSchema.safeParse({
    name: "Oops",
    mealType: "dinner",
    calories: -10,
  });
  assert.equal(result.success, false);
});

test("mealListQuerySchema accepts date or from/to but not both", () => {
  assert.equal(
    mealListQuerySchema.safeParse({ date: "2026-09-08" }).success,
    true
  );
  assert.equal(
    mealListQuerySchema
      .safeParse({ from: "2026-09-01", to: "2026-09-08" })
      .success,
    true
  );
  assert.equal(
    mealListQuerySchema
      .safeParse({ date: "2026-09-08", from: "2026-09-01" })
      .success,
    false,
    "date must not be combined with from/to"
  );
});

test("mealHistoryQuerySchema accepts an optional days value", () => {
  assert.equal(mealHistoryQuerySchema.safeParse({}).success, true);
  assert.equal(mealHistoryQuerySchema.safeParse({ days: 14 }).success, true);
  assert.equal(mealHistoryQuerySchema.safeParse({ days: 0 }).success, false);
});

test("deleteMealParamsSchema coerces a string id", () => {
  const result = deleteMealParamsSchema.safeParse({ id: "42" });
  assert.equal(result.success, true);
  assert.equal(result.data.id, 42);
});