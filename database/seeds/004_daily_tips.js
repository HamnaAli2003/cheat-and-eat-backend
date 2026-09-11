import pg from "pg";
import "dotenv/config";
import { DAILY_TIPS } from "./dailyTipsData.js";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

/*
 * ============================================================
 * DAILY TIPS SEED
 * ============================================================
 *
 * Idempotent: wipes the daily_tips table and re-inserts the curated
 * tip list. Tip content lives in dailyTipsData.js (shared with tests).
 */

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM daily_tips");

    for (let i = 0; i < DAILY_TIPS.length; i += 1) {
      const tip = DAILY_TIPS[i];
      await client.query(
        `
          INSERT INTO daily_tips (text, icon, sort_order, is_active)
          VALUES ($1, $2, $3, true)
        `,
        [tip.text, tip.icon, i + 1]
      );
    }

    await client.query("COMMIT");

    console.log("✅ Daily tips seeded successfully");
    console.log(`💡 Tips: ${DAILY_TIPS.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Daily tips seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();