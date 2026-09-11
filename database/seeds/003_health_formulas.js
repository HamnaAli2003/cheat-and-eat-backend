import pg from "pg";
import "dotenv/config";
import { FORMULAS } from "./healthFormulaData.js";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

/*
 * ============================================================
 * HEALTH FORMULAS SEED
 * ============================================================
 *
 * Idempotent upsert keyed on health_formulas.key.
 * Formula definitions live in healthFormulaData.js (shared with tests).
 */

const insertFormula = async (formula) => {
  await client.query(
    `
      INSERT INTO health_formulas (
        key,
        name,
        category,
        description,
        formula,
        params,
        constants,
        sort_order
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (key)
      DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        formula = EXCLUDED.formula,
        params = EXCLUDED.params,
        constants = EXCLUDED.constants,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      formula.key,
      formula.name,
      formula.category,
      formula.description,
      formula.formula,
      JSON.stringify(formula.params),
      formula.constants
        ? JSON.stringify(formula.constants)
        : JSON.stringify({}),
      formula.sortOrder,
    ]
  );
};

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    for (const formula of FORMULAS) {
      await insertFormula(formula);
    }

    await client.query("COMMIT");

    console.log("✅ Health formulas seeded successfully");
    console.log(`📐 Formulas: ${FORMULAS.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Health formulas seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
