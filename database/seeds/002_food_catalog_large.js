import pg from "pg";
import "dotenv/config";
import { foodSeedData } from "./foodSeedData.js";
import { applyFixes } from "./foodFixes.js";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

/*
 * ============================================================
 * CATEGORY NAMES
 * ============================================================
 *
 * The large seed uses its own category slugs.
 *
 * Existing categories from 001_food_catalog.js:
 *   rice, meat, daal, sabzi, bread, fruit, drinks, sweets, combos
 *
 * The large seed adds:
 *   vegetable, curry-kebab, dessert, drink, snack
 *
 * Shared slugs (rice, bread, fruit) reuse the same rows.
 */
const CATEGORY_NAMES = {
  vegetable: "Vegetable",
  rice: "Rice",
  "curry-kebab": "Curry & Kebab",
  dessert: "Dessert",
  drink: "Drinks",
  bread: "Bread",
  snack: "Snacks",
  fruit: "Fruit",
};

/*
 * Some seed slugs map onto an existing 001_food_catalog.js row whose slug
 * differs ("drink" in the large seed == "drinks" already in the DB).
 */
const CATEGORY_SLUG_ALIASES = {
  drink: "drinks",
};

/*
 * The seed stores nutrition per 1 typical serving.
 * The foods table stores base nutrition per 100g.
 *
 * Convert once at seed time:
 *   base_per_100g = serving_value / servingG * 100
 */
const toPer100g = (value, servingG) => {
  if (!servingG || servingG <= 0) {
    return Number(value) || 0;
  }

  return Math.round((value / servingG) * 100 * 100) / 100;
};

async function getCategoryId(slug) {
  const resolved = CATEGORY_SLUG_ALIASES[slug] || slug;
  const result = await client.query(
    `SELECT id FROM food_categories WHERE slug = $1`,
    [resolved]
  );

  if (!result.rows[0]) {
    throw new Error(`Category not found: ${slug}`);
  }

  return result.rows[0].id;
}

async function seedCategories() {
  const slugs = [...new Set(foodSeedData.map((f) => f.category))];

  for (const rawSlug of slugs) {
    const slug = CATEGORY_SLUG_ALIASES[rawSlug] || rawSlug;
    await client.query(
      `
        INSERT INTO food_categories (name, slug)
        VALUES ($1, $2)
        ON CONFLICT (slug)
        DO UPDATE SET name = EXCLUDED.name
      `,
      [CATEGORY_NAMES[rawSlug] || rawSlug, slug]
    );
  }

  return slugs.length;
}

async function insertFood(food) {
  const categoryId = await getCategoryId(food.category);

  const servingG = food.servingG;
  const baseCalories = toPer100g(food.kcal, servingG);
  const baseProtein = toPer100g(food.proteinG, servingG);
  const baseCarbs = toPer100g(food.carbsG, servingG);
  const baseFat = toPer100g(food.fatG, servingG);

  const result = await client.query(
    `
      INSERT INTO foods (
        category_id,
        name,
        slug,
        description,
        image_url,
        base_calories,
        base_protein,
        base_carbs,
        base_fat,
        base_fiber,
        urdu_name,
        region,
        subcategory,
        image_source,
        nutrition_basis,
        serving_g,
        serving_label,
        oil_g,
        oil_kcal
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (slug)
      DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        base_calories = EXCLUDED.base_calories,
        base_protein = EXCLUDED.base_protein,
        base_carbs = EXCLUDED.base_carbs,
        base_fat = EXCLUDED.base_fat,
        base_fiber = EXCLUDED.base_fiber,
        urdu_name = EXCLUDED.urdu_name,
        region = EXCLUDED.region,
        subcategory = EXCLUDED.subcategory,
        image_source = EXCLUDED.image_source,
        nutrition_basis = EXCLUDED.nutrition_basis,
        serving_g = EXCLUDED.serving_g,
        serving_label = EXCLUDED.serving_label,
        oil_g = EXCLUDED.oil_g,
        oil_kcal = EXCLUDED.oil_kcal,
        meat_grams = EXCLUDED.meat_grams,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [
      categoryId,
      food.name,
      food.slug,
      food.description,
      food.imageUrl,
      baseCalories,
      baseProtein,
      baseCarbs,
      baseFat,
      0,
      food.urduName ?? null,
      food.region ?? null,
      food.subcategory ?? null,
      food.imageSource ?? null,
      food.nutritionBasis ?? null,
      food.servingG ?? null,
      food.servingLabel ?? null,
      food.oilG ?? 0,
      food.oilKcal ?? 0,
      food.meatGrams ?? null,
    ]
  );

  return result.rows[0].id;
}

async function seedDefaultServing(foodId, food) {
  if (!food.servingLabel || !food.servingG) {
    return;
  }

  await client.query(
    `
      INSERT INTO food_servings (
        food_id,
        name,
        unit,
        amount,
        amount_unit,
        sort_order,
        is_default
      )
      VALUES ($1,$2,$3,$4,$5,1,TRUE)
      ON CONFLICT (food_id, name)
      DO UPDATE SET
        unit = EXCLUDED.unit,
        amount = EXCLUDED.amount,
        amount_unit = EXCLUDED.amount_unit,
        sort_order = EXCLUDED.sort_order,
        is_default = TRUE
    `,
    [foodId, food.servingLabel, "serving", food.servingG, "g"]
  );
}

async function seedMetadata(foodId, food) {
  const tags = ["desi", "pakistani", food.category];

  if (food.region) {
    tags.push(food.region);
  }

  await client.query(
    `
      INSERT INTO food_metadata (
        food_id,
        ingredients,
        tags
      )
      VALUES ($1,$2,$3)
      ON CONFLICT (food_id)
      DO UPDATE SET
        ingredients = EXCLUDED.ingredients,
        tags = EXCLUDED.tags,
        updated_at = CURRENT_TIMESTAMP
    `,
    [foodId, JSON.stringify([]), JSON.stringify(tags)]
  );
}

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    const categoryCount = await seedCategories();

    let inserted = 0;

    for (const rawFood of foodSeedData) {
      const food = applyFixes(rawFood);
      const foodId = await insertFood(food);

      await seedDefaultServing(foodId, food);
      await seedMetadata(foodId, food);

      inserted += 1;
    }

    await client.query("COMMIT");

    console.log("✅ Large food catalog seeded successfully");
    console.log(`🍛 Foods: ${inserted}`);
    console.log(`📂 Categories: ${categoryCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Food seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();