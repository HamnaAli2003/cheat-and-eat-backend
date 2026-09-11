/*
 * ============================================================
 * 006 — FOOD PORTIONS SEED (minimal)
 * ============================================================
 * Adds spec-accurate portion rows for fruits.
 * Existing data preserved; new rows inserted alongside.
 */
import pg from "pg";
import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const now = new Date().toISOString().replace(/[:.]/g, "-");
// Relative to CWD (backend dir)
const auditDir = "./reports/audit";
if (!existsSync(auditDir)) mkdirSync(auditDir, { recursive: true });
const backupPath = auditDir + "/portions_backup." + now + ".json";

function backup(payload) {
  writeFileSync(backupPath, JSON.stringify(payload, null, 2), "utf8");
}

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    /* ── 0. Backup one row per fruit food ─────────────────────── */
    // Fruit food IDs we care about (from earlier DB probe)
    const fruitFoodIds = [15, 14, 1456, 1450, 1451, 1444, 1441, 1442, 1399, 1458, 1460, 1457, 1369, 1370, 1443, 1445, 1455, 1269, 1452];
    const sampleRows = [];
    for (const fd of fruitFoodIds) {
      const { rows } = await client.query(
        `SELECT * FROM food_servings WHERE food_id = $1 ORDER BY sort_order LIMIT 1`,
        [fd]
      );
      if (rows.length) sampleRows.push({ food_id: fd, row: rows[0] });
    }
    backup({ backedUpAt: new Date().toISOString(), sampled: sampleRows });
    console.log("💾 Backup written");

    /* ── 1. Insert new fruit portion rows ─────────────────────── */
    // Define portions for each fruit food ID
    const portionsById = {
      15: [   // Banana
        { name: 'Small (1 small)', unit: 'banana', amount: 90, amount_unit: 'g', edible_weight_g: 78, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'banana', amount: 118, amount_unit: 'g', edible_weight_g: 105, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'banana', amount: 145, amount_unit: 'g', edible_weight_g: 130, sort_order: 3 },
        { name: '1 cup sliced', unit: 'cup', amount: 150, amount_unit: 'g', sort_order: 4 }
      ],
      14: [   // Mango
        { name: 'Small (1 small)', unit: 'mango', amount: 200, amount_unit: 'g', edible_weight_g: 140, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'mango', amount: 300, amount_unit: 'g', edible_weight_g: 200, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'mango', amount: 400, amount_unit: 'g', edible_weight_g: 270, sort_order: 3 },
        { name: '1 cup diced', unit: 'cup', amount: 165, amount_unit: 'g', sort_order: 4 }
      ],
      1456: [ // Apple
        { name: 'Small (1 small)', unit: 'apple', amount: 149, amount_unit: 'g', edible_weight_g: 135, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'apple', amount: 182, amount_unit: 'g', edible_weight_g: 165, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'apple', amount: 223, amount_unit: 'g', edible_weight_g: 200, sort_order: 3 },
        { name: '1 cup sliced', unit: 'cup', amount: 109, amount_unit: 'g', sort_order: 4 }
      ],
      1450: [ // Orange
        { name: 'Small (1 small)', unit: 'orange', amount: 130, amount_unit: 'g', edible_weight_g: 100, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'orange', amount: 154, amount_unit: 'g', edible_weight_g: 120, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'orange', amount: 184, amount_unit: 'g', edible_weight_g: 140, sort_order: 3 },
        { name: '½ cup segments', unit: 'cup', amount: 90, amount_unit: 'g', sort_order: 4 }
      ],
      1451: [ // Kinnow
        { name: 'Medium (1 whole)', unit: 'kinnow', amount: 140, amount_unit: 'g', edible_weight_g: 95, sort_order: 1, is_default: true },
        { name: 'Large (1 whole)', unit: 'kinnow', amount: 170, amount_unit: 'g', edible_weight_g: 115, sort_order: 2 },
        { name: '1 cup segments', unit: 'cup', amount: 100, amount_unit: 'g', sort_order: 3 },
        { name: '½ cup segments', unit: 'cup', amount: 50, amount_unit: 'g', sort_order: 4 }
      ],
      1444: [ // Guava
        { name: 'Small (1 small)', unit: 'guava', amount: 90, amount_unit: 'g', edible_weight_g: 75, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'guava', amount: 150, amount_unit: 'g', edible_weight_g: 130, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'guava', amount: 210, amount_unit: 'g', edible_weight_g: 180, sort_order: 3 },
        { name: '½ cup pieces', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 4 }
      ],
      1441: [ // Watermelon
        { name: '½ small wedge', unit: 'wedge', amount: 150, amount_unit: 'g', edible_weight_g: 142, sort_order: 1 },
        { name: '1 cup diced', unit: 'cup', amount: 152, amount_unit: 'g', sort_order: 2, is_default: true },
        { name: '1 slice (1-in wedge)', unit: 'wedge', amount: 280, amount_unit: 'g', edible_weight_g: 265, sort_order: 3 },
        { name: '2 cups diced', unit: 'cup', amount: 305, amount_unit: 'g', sort_order: 4 }
      ],
      1442: [ // Muskmelon
        { name: '1 slice', unit: 'slice', amount: 200, amount_unit: 'g', edible_weight_g: 180, sort_order: 1 },
        { name: '1 cup diced', unit: 'cup', amount: 160, amount_unit: 'g', sort_order: 2, is_default: true },
        { name: '½ cup diced', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 3 },
        { name: '¼ melon', unit: 'melon', amount: 260, amount_unit: 'g', edible_weight_g: 235, sort_order: 4 }
      ],
      1399: [ // Grapes (count-based)
        { name: '10 grapes', unit: 'grapes', amount: 10, amount_unit: 'count', per_unit_g: 5, sort_order: 1 },
        { name: '1 cup (~20 grapes)', unit: 'grapes', amount: 20, amount_unit: 'count', per_unit_g: 5, sort_order: 2, is_default: true },
        { name: '1 small bunch', unit: 'bunch', amount: 120, amount_unit: 'g', sort_order: 3 },
        { name: '2 cups (~40 grapes)', unit: 'grapes', amount: 40, amount_unit: 'count', per_unit_g: 5, sort_order: 4 }
      ],
      1458: [ // Pomegranate
        { name: '¼ fruit', unit: 'fruit', amount: 140, amount_unit: 'g', edible_weight_g: 87, sort_order: 1 },
        { name: '1 medium fruit', unit: 'fruit', amount: 280, amount_unit: 'g', edible_weight_g: 174, sort_order: 2, is_default: true },
        { name: '½ cup arils', unit: 'cup', amount: 88, amount_unit: 'g', sort_order: 3 },
        { name: '100 g arils', unit: 'arils', amount: 100, amount_unit: 'g', sort_order: 4 }
      ],
      1460: [ // Dates (count-based)
        { name: '1 date', unit: 'dates', amount: 1, amount_unit: 'count', per_unit_g: 8, sort_order: 1 },
        { name: '2 dates', unit: 'dates', amount: 2, amount_unit: 'count', per_unit_g: 8, sort_order: 2, is_default: true },
        { name: '3 dates', unit: 'dates', amount: 3, amount_unit: 'count', per_unit_g: 8, sort_order: 3 },
        { name: '35 g (typical)', unit: 'serving', amount: 35, amount_unit: 'g', sort_order: 4 }
      ],
      1457: [ // Pear
        { name: 'Small (1 small)', unit: 'pear', amount: 166, amount_unit: 'g', edible_weight_g: 150, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'pear', amount: 178, amount_unit: 'g', edible_weight_g: 162, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'pear', amount: 230, amount_unit: 'g', edible_weight_g: 210, sort_order: 3 },
        { name: '1 cup sliced', unit: 'cup', amount: 140, amount_unit: 'g', sort_order: 4 }
      ],
      1369: [ // Peach
        { name: 'Small (1 small)', unit: 'peach', amount: 130, amount_unit: 'g', edible_weight_g: 120, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'peach', amount: 150, amount_unit: 'g', edible_weight_g: 140, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'peach', amount: 175, amount_unit: 'g', edible_weight_g: 165, sort_order: 3 },
        { name: '1 cup sliced', unit: 'cup', amount: 154, amount_unit: 'g', sort_order: 4 }
      ],
      1370: [ // Plum (count-based)
        { name: '1 plum', unit: 'plums', amount: 1, amount_unit: 'count', per_unit_g: 66, sort_order: 1 },
        { name: '2 plums', unit: 'plums', amount: 2, amount_unit: 'count', per_unit_g: 66, sort_order: 2, is_default: true },
        { name: '3 plums', unit: 'plums', amount: 3, amount_unit: 'count', per_unit_g: 66, sort_order: 3 },
        { name: '100 g', unit: 'serving', amount: 100, amount_unit: 'g', sort_order: 4 }
      ],
      1443: [ // Papaya
        { name: '½ cup diced', unit: 'cup', amount: 72, amount_unit: 'g', sort_order: 1 },
        { name: '1 cup diced', unit: 'cup', amount: 145, amount_unit: 'g', sort_order: 2, is_default: true },
        { name: '½ small papaya', unit: 'papaya', amount: 150, amount_unit: 'g', edible_weight_g: 135, sort_order: 3 },
        { name: '2 cups diced', unit: 'cup', amount: 290, amount_unit: 'g', sort_order: 4 }
      ],
      1445: [ // Lychee (count-based)
        { name: '5 lychees', unit: 'lychees', amount: 5, amount_unit: 'count', per_unit_g: 14, sort_order: 1 },
        { name: '8 lychees', unit: 'lychees', amount: 8, amount_unit: 'count', per_unit_g: 14, sort_order: 2, is_default: true },
        { name: '10 lychees', unit: 'lychees', amount: 10, amount_unit: 'count', per_unit_g: 14, sort_order: 3 },
        { name: '100 g', unit: 'serving', amount: 100, amount_unit: 'g', sort_order: 4 }
      ],
      1455: [ // Sweet Lime
        { name: 'Medium (1 whole)', unit: 'mousambi', amount: 150, amount_unit: 'g', edible_weight_g: 105, sort_order: 1, is_default: true },
        { name: 'Large (1 whole)', unit: 'mousambi', amount: 180, amount_unit: 'g', edible_weight_g: 125, sort_order: 2 },
        { name: '½ cup segments', unit: 'cup', amount: 60, amount_unit: 'g', sort_order: 3 },
        { name: '1 glass juice', unit: 'glass', amount: 200, amount_unit: 'ml', sort_order: 4 }
      ],
      1269: [ // Honeydew
        { name: '½ cup diced', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 1 },
        { name: '1 cup diced', unit: 'cup', amount: 160, amount_unit: 'g', sort_order: 2, is_default: true },
        { name: '1 slice', unit: 'slice', amount: 200, amount_unit: 'g', edible_weight_g: 190, sort_order: 3 },
        { name: '¼ melon', unit: 'melon', amount: 350, amount_unit: 'g', edible_weight_g: 330, sort_order: 4 }
      ],
      1452: [ // Mandarin
        { name: 'Small (1 small)', unit: 'mandarin', amount: 100, amount_unit: 'g', edible_weight_g: 75, sort_order: 1 },
        { name: 'Medium (1 medium)', unit: 'mandarin', amount: 130, amount_unit: 'g', edible_weight_g: 100, sort_order: 2, is_default: true },
        { name: 'Large (1 large)', unit: 'mandarin', amount: 150, amount_unit: 'g', edible_weight_g: 115, sort_order: 3 },
        { name: '1 cup segments', unit: 'cup', amount: 90, amount_unit: 'g', sort_order: 4 }
      ]
    };

    // Insert portions per fruit food ID
    let servingId;
    {
      const [{ rows: [maxServing] }] = await client.query(
        `SELECT COALESCE(MAX(id), 0) AS max FROM food_servings`
      );
      servingId = Number(maxServing.max) + 1;
    }

    for (const fd of fruitFoodIds) {
      const portions = portionsById[fd];
      if (!portions) continue; // food ID not in our map

      for (const p of portions) {
        await client.query(
          `INSERT INTO food_servings
             (id, food_id, name, unit, amount, amount_unit, edible_weight_g,
              per_unit_g, sort_order, is_default)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            servingId,
            fd,
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
        servingId += 1;
      }
      console.log(`🍎 Inserted ${portions.length} portions for food ${fd}`);
    }

    await client.query("COMMIT");
    console.log("✅ Seed completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();