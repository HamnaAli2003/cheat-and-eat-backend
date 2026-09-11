import { test, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import "dotenv/config";
import { DAILY_TIPS } from "../database/seeds/dailyTipsData.js";

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
  "daily_tips table contains all seeded tips in order",
  { skip: DB_AVAILABLE ? false : "DATABASE_URL not set — skipping DB test" },
  async () => {
    const { rows } = await client.query(
      "SELECT text, icon, sort_order FROM daily_tips WHERE is_active = true ORDER BY sort_order ASC"
    );
    assert.equal(rows.length, DAILY_TIPS.length, "tip count must match seed");

    rows.forEach((row, index) => {
      const seed = DAILY_TIPS[index];
      assert.equal(row.text, seed.text, `text mismatch at index ${index}`);
      assert.equal(row.icon, seed.icon, `icon mismatch at index ${index}`);
      assert.equal(row.sort_order, index + 1, `order mismatch at index ${index}`);
    });
  }
);

test(
  "meals and goal_changes tables exist with expected columns",
  { skip: DB_AVAILABLE ? false : "DATABASE_URL not set — skipping DB test" },
  async () => {
    const meals = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'meals'`
    );
    const mealColumns = meals.rows.map((r) => r.column_name);
    for (const col of [
      "id",
      "user_id",
      "name",
      "meal_type",
      "calories",
      "eaten_on",
    ]) {
      assert.ok(mealColumns.includes(col), `meals missing column ${col}`);
    }

    const changes = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'goal_changes'`
    );
    const changeColumns = changes.rows.map((r) => r.column_name);
    for (const col of ["user_id", "daily_calorie_goal", "changed_on"]) {
      assert.ok(changeColumns.includes(col), `goal_changes missing column ${col}`);
    }
  }
);