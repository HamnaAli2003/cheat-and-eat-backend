/**
 * applyFoodFixes.js — idempotently apply foodFixes.js (descriptions +
 * nutrition corrections) to the live database.
 *
 * SAFETY: this script ONLY updates description + per-100g nutrition +
 * serving columns. It NEVER touches image_url / image_source, so the
 * assigned real image URLs from the pass-3 image scripts are preserved.
 *
 * Usage: node scripts/applyFoodFixes.js
 */
import pg from "pg";
import "dotenv/config";
import { foodSeedData } from "../database/seeds/foodSeedData.js";
import { applyFixes } from "../database/seeds/foodFixes.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const toPer100g = (value, servingG) => {
  if (!servingG || servingG <= 0) return Number(value) || 0;
  return Math.round((value / servingG) * 100 * 100) / 100;
};

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    let updated = 0;
    let skipped = 0;

    for (const rawFood of foodSeedData) {
      const fixed = applyFixes(rawFood);

      const descriptionChanged =
        rawFood.description !== fixed.description && !!fixed.description;
      const nutritionChanged =
        rawFood.kcal !== fixed.kcal ||
        rawFood.proteinG !== fixed.proteinG ||
        rawFood.carbsG !== fixed.carbsG ||
        rawFood.fatG !== fixed.fatG;

      if (!descriptionChanged && !nutritionChanged) {
        skipped += 1;
        continue;
      }

      const result = await client.query(
        `
          UPDATE foods
          SET
            description = $2,
            base_calories = $3,
            base_protein = $4,
            base_carbs = $5,
            base_fat = $6,
            serving_g = $7,
            serving_label = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE slug = $1
        `,
        [
          fixed.slug,
          fixed.description,
          toPer100g(fixed.kcal, fixed.servingG),
          toPer100g(fixed.proteinG, fixed.servingG),
          toPer100g(fixed.carbsG, fixed.servingG),
          toPer100g(fixed.fatG, fixed.servingG),
          fixed.servingG,
          fixed.servingLabel,
        ]
      );

      updated += result.rowCount;
    }

    await client.query("COMMIT");

    console.log(`✅ Food fixes applied. Updated rows: ${updated}, unchanged: ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to apply food fixes:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();