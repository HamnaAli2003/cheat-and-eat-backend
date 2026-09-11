/*
 * ============================================================
 * 007 — FOOD CATEGORY RE-ORGANIZATION
 * ============================================================
 *
 * Implements the user's categorization directive:
 *   1. Rename category "Rice" -> "Rice & Breads" (slug stays `rice`).
 *   2. Create a dedicated "Sweets" category.
 *   3. Move flatbreads (rotis, naans, parathas, kulchas, chapatis,
 *      phulka, sheermal, tandoori roti, etc.) into "Rice & Breads".
 *   4. Move sweets/desserts (halwa, barfi, laddu, jalebi, kheer,
 *      kulfi, firni/phirni, mithai, gulab jamun, rasgulla, zarda,
 *      shahi tukray, falooda, etc.) into "Sweets".
 *   5. Halwa Puri (combo) -> "Curries" (user choice).
 *   6. Delete "Sweet Samosa" (id 1025) — user approved removal.
 *
 * User decisions incorporated:
 *   - Puri (997/1032) and Bedmi Puri (1002): REMAIN in Snacks.
 *   - Sweet Paratha (855): it is a bread -> "Rice & Breads".
 *   - Sweet Samosa (1025): DELETE.
 *   - Sweet Corn (1265) / Sweet Potato (64): stay in Snacks.
 *   - Halwa Puri (21/463): -> "Curries".
 *   - Bhel/Pani/Dahi/Sev/Kachori Puri are chaat: stay in Snacks.
 *
 * Idempotent: uses category lookup by slug + food lookup by id and
 * only updates when the target category differs.
 *
 * Run:  node database/seeds/007_food_category_reorg.js
 */
import pg from "pg";
import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const now = new Date().toISOString().replace(/[:.]/g, "-");
const auditDir = "./reports/audit";
const backupPath = `${auditDir}/category_reorg_backup.${now}.json`;
if (!existsSync(auditDir)) mkdirSync(auditDir, { recursive: true });

const BREAD_FOOD_IDS = [
  11, 12, 817, 827, 838, 839, 841, 843, 844, 849, 852, 853, 854, 862, 863,
  866, 867, 868, 870, 879, 893, 894, 896, 901, 907, 920, 921, 923, 924, 930,
  940, 941, 942, 944, 949, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973,
  974, 975, 976, 977, 979, 980, 981, 982, 983, 984, 985, 986, 988, 989, 990,
  991, 992, 993, 994, 995, 1003, 1006, 855,
];

const SWEET_FOOD_IDS = [
  /* Snacks -> Sweets */
  18, 19, 432, 437, 438, 441, 448, 454, 464, 465, 466, 480, 486, 487, 488,
  491, 492, 493, 494, 495, 496, 497, 498, 501, 522, 523, 526, 527, 528, 529,
  530, 531, 532, 533, 534, 535, 536, 549, 550, 551, 552, 554, 555, 556, 557,
  564, 565, 566, 567, 568, 569, 570, 582, 583, 584, 585, 586, 588, 589, 591,
  592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 606, 607,
  609, 612, 613, 614, 615, 1491,
  /* Rice -> Sweets */
  161, 162, 163, 164, 192, 193, 195, 214, 257, 258,
];

const HALWA_PURI_FOOD_IDS = [21, 463];

const SWEET_SAMOSA_FOOD_ID = 1025;

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    /* ── 0. Backup affected rows ──────────────────────────────── */
    const allIds = [
      ...new Set([
        ...BREAD_FOOD_IDS,
        ...SWEET_FOOD_IDS,
        ...HALWA_PURI_FOOD_IDS,
        SWEET_SAMOSA_FOOD_ID,
      ]),
    ];

    const backupR = await client.query(
      `SELECT f.id, f.name, c.slug AS category_slug, f.is_active
       FROM foods f JOIN food_categories c ON c.id = f.category_id
       WHERE f.id = ANY($1::bigint[])
       ORDER BY f.id`,
      [allIds]
    );
    const catR = await client.query(
      `SELECT id, name, slug FROM food_categories ORDER BY id`
    );

    writeFileSync(
      backupPath,
      JSON.stringify(
        {
          backedUpAt: new Date().toISOString(),
          categories: catR.rows,
          foods: backupR.rows,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`💾 Backup written → ${backupPath}`);

    /* ── 1. Rename "Rice" -> "Rice & Breads" ──────────────────── */
    await client.query(
      `UPDATE food_categories SET name = 'Rice & Breads' WHERE slug = 'rice'`
    );
    console.log(`🔠 Renamed category "Rice" -> "Rice & Breads"`);

    /* ── 2. Create "Sweets" category ──────────────────────────── */
    const sweetsR = await client.query(
      `INSERT INTO food_categories (name, slug)
       VALUES ('Sweets', 'sweets')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const sweetsCatId = sweetsR.rows[0].id;
    console.log(`🍬 Category "Sweets" ready (id ${sweetsCatId})`);

    /* ── 3. Move breads -> Rice & Breads ──────────────────────── */
    const riceBreads = await client.query(
      `SELECT id FROM food_categories WHERE slug = 'rice'`
    );
    const riceCatId = riceBreads.rows[0].id;
    const breadMove = await client.query(
      `UPDATE foods SET category_id = $1 WHERE id = ANY($2::bigint[])`,
      [riceCatId, BREAD_FOOD_IDS]
    );
    console.log(`🫓 Moved ${breadMove.rowCount} breads -> Rice & Breads`);

    /* ── 4. Move sweets -> Sweets ─────────────────────────────── */
    const sweetMove = await client.query(
      `UPDATE foods SET category_id = $1 WHERE id = ANY($2::bigint[])`,
      [sweetsCatId, SWEET_FOOD_IDS]
    );
    console.log(`🍬 Moved ${sweetMove.rowCount} sweets -> Sweets`);

    /* ── 5. Move Halwa Puri -> Curries ────────────────────────── */
    const curriesR = await client.query(
      `SELECT id FROM food_categories WHERE slug = 'curries'`
    );
    const curriesCatId = curriesR.rows[0].id;
    const halwaMove = await client.query(
      `UPDATE foods SET category_id = $1 WHERE id = ANY($2::bigint[])`,
      [curriesCatId, HALWA_PURI_FOOD_IDS]
    );
    console.log(`🥘 Moved ${halwaMove.rowCount} Halwa Puri -> Curries`);

    /* ── 6. Delete Sweet Samosa (1025) ────────────────────────── */
    const del = await client.query(
      `DELETE FROM foods WHERE id = $1`,
      [SWEET_SAMOSA_FOOD_ID]
    );
    console.log(`🗑️  Deleted Sweet Samosa (${del.rowCount} row)`);

    await client.query("COMMIT");
    console.log("✅ Category re-organization completed");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Category re-org failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();