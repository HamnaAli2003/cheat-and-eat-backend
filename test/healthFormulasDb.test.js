import { test, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import "dotenv/config";
import { FORMULAS } from "../database/seeds/healthFormulaData.js";

const { Client } = pg;

const DB_AVAILABLE = Boolean(process.env.DATABASE_URL);
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
if (DB_AVAILABLE) await client.connect();
if (DB_AVAILABLE) {
  after(async () => {
    await client.end();
  });
}

test(
  "health_formulas table contains all 18 seeded formulas",
  { skip: DB_AVAILABLE ? false : "DATABASE_URL not set — skipping DB test" },
  async () => {
    const { rows } = await client.query("SELECT key FROM health_formulas ORDER BY key");
    const dbKeys = rows.map((r) => r.key).sort();
    const seedKeys = FORMULAS.map((f) => f.key).sort();
    assert.deepEqual(dbKeys, seedKeys, "DB keys must match seed keys");
  }
);

test(
  "each seeded formula is stored with its full metadata",
  { skip: DB_AVAILABLE ? false : "DATABASE_URL not set — skipping DB test" },
  async () => {
    const { rows } = await client.query(
      "SELECT key, name, category, description, formula, params, constants, sort_order FROM health_formulas"
    );
    const byKey = new Map(rows.map((r) => [r.key, r]));

    for (const f of FORMULAS) {
      const db = byKey.get(f.key);
      assert.ok(db, `missing ${f.key} in DB`);
      assert.equal(db.name, f.name, `name mismatch for ${f.key}`);
      assert.equal(db.category, f.category, `category mismatch for ${f.key}`);
      assert.equal(db.sort_order, f.sortOrder, `sort_order mismatch for ${f.key}`);
      assert.ok(db.description.length > 0, `empty description for ${f.key}`);
      assert.ok(db.formula.length > 0, `empty formula for ${f.key}`);
      // note: node-pg parses jsonb into native values already
      assert.deepEqual(
        db.params,
        f.params,
        `params mismatch for ${f.key}`
      );
      assert.deepEqual(
        db.constants,
        f.constants,
        `constants mismatch for ${f.key}`
      );
    }
  }
);