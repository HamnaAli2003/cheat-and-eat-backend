/*
 * ============================================================
 * 006 — FOOD PORTIONS & RECIPES SEED
 * ============================================================
 *
 * Idempotent. Adds spec-accurate portion rows for fruits and
 * ingredient-based recipes for selected dishes.
 *
 * Existing data is PRESERVED (no deletes). New rows are inserted
 * alongside. Recipe food/ingredient ids are computed from the
 * current table max so reruns stay valid.
 *
 * Run:  node database/seeds/006_food_portions_and_recipes.js
 */
import pg from "pg";
import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { FRUIT_PORTIONS } from "./data/foodPortionData.js";
import { RECIPES } from "./data/foodRecipeData.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const now = new Date().toISOString().replace(/[:.]/g, "-");
const auditDir = "./reports/audit";
const backupPath = `${auditDir}/portions_recipes_backup.${now}.json`;
if (!existsSync(auditDir)) mkdirSync(auditDir, { recursive: true });

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    /* ── 0. Backup affected rows ──────────────────────────────── */
    const fruitIds = [...new Set(FRUIT_PORTIONS.map((p) => p.food_id))];
    const recipeIds = RECIPES.map((r) => r.food_id);

    const servR = await client.query(
      `SELECT * FROM food_servings WHERE food_id = ANY($1::bigint[]) ORDER BY food_id, sort_order`,
      [fruitIds]
    );
    const recR = await client.query(
      `SELECT * FROM recipes WHERE food_id = ANY($1::bigint[]) ORDER BY food_id`,
      [recipeIds]
    );

    writeFileSync(
      backupPath,
      JSON.stringify(
        {
          backedUpAt: new Date().toISOString(),
          food_servings: servR.rows,
          recipes: recR.rows,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`💾 Backup written → ${backupPath}`);

    /* ── 1. Insert fruit portion rows ─────────────────────────── */
    let insertedServings = 0;
    for (const p of FRUIT_PORTIONS) {
      await client.query(
        `INSERT INTO food_servings
           (food_id, name, unit, amount, amount_unit, edible_weight_g,
            per_unit_g, sort_order, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          p.food_id,
          p.name,
          p.unit,
          p.amount,
          p.amount_unit,
          p.edible_weight_g ?? null,
          p.per_unit_g ?? null,
          p.sort_order,
          p.is_default ?? false,
        ]
      );
      insertedServings += 1;
    }
    console.log(`🍎 Inserted ${insertedServings} fruit portion rows`);

    /* ── 2. Insert recipes + ingredients ──────────────────────── */
    const maxRecR = await client.query(
      `SELECT COALESCE(MAX(id), 0) AS max_id FROM recipes`
    );
    let recipeId = Number(maxRecR.rows[0].max_id) + 1;

    const maxIngR = await client.query(
      `SELECT COALESCE(MAX(id), 0) AS max_id FROM recipe_ingredients`
    );
    let ingredientId = Number(maxIngR.rows[0].max_id) + 1;

    for (const recipe of RECIPES) {
      const dishR = await client.query(
        `SELECT id FROM foods WHERE id = $1 AND is_active = true`,
        [recipe.food_id]
      );
      if (dishR.rows.length === 0) {
        throw new Error(`Recipe target food not active/missing: ${recipe.food_id}`);
      }

      await client.query(
        `INSERT INTO recipes
           (id, food_id, name, description, default_servings, estimated, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,true)`,
        [
          recipeId,
          recipe.food_id,
          recipe.name,
          recipe.description ?? null,
          recipe.default_servings,
          recipe.estimated ?? true,
        ]
      );

      for (const ing of recipe.ingredients) {
        if (ing.food_id == null && !ing.per100) {
          throw new Error(
            `Ingredient "${ing.name}" (recipe "${recipe.name}") needs food_id or per100`
          );
        }
        await client.query(
          `INSERT INTO recipe_ingredients
             (id, recipe_id, food_id, name, quantity, unit, per100, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            ingredientId,
            recipeId,
            ing.food_id ?? null,
            ing.name,
            ing.quantity,
            ing.unit ?? "g",
            ing.per100 ? JSON.stringify(ing.per100) : null,
            ing.sort_order ?? 0,
          ]
        );
        ingredientId += 1;
      }

      console.log(`🍛 Recipe: ${recipe.name} → food ${recipe.food_id} (${recipe.ingredients.length} ingredients)`);
      recipeId += 1;
    }

    await client.query("COMMIT");
    console.log("✅ Food portions & recipes seed completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();