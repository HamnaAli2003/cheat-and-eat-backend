import pg from "pg";
import "dotenv/config";
import { TRACKER_KEEP_SLUG_SET } from "../database/seeds/trackerFoodDedup.js";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// Group every active food by NAME (ignoring category). If a name has >1 row
// we keep ONE canonical row and deactivate the rest (reversible: is_active=FALSE).
const groups = await c.query(`
  SELECT name, count(*) AS n
  FROM foods
  WHERE is_active = TRUE
  GROUP BY name
  HAVING count(*) > 1
  ORDER BY name
`);

let deactivated = 0;
const log = [];

for (const { name } of groups.rows) {
  const rows = await c.query(
    `SELECT id, slug, region, image_url
       FROM foods
      WHERE is_active = TRUE AND name = $1
      ORDER BY id`,
    [name]
  );

  // Pick the canonical row: tracker-mapped slug > has an image > lowest id.
  let keep = rows.rows[0];
  for (const r of rows.rows) {
    const rank = (a) => (TRACKER_KEEP_SLUG_SET.has(a.slug) ? 0 : a.image_url ? 1 : 2);
    if (rank(r) < rank(keep)) keep = r;
    else if (rank(r) === rank(keep) && r.id < keep.id) keep = r;
  }

  for (const r of rows.rows) {
    if (r.id === keep.id) continue;
    await c.query(`UPDATE foods SET is_active = FALSE WHERE id = $1`, [r.id]);
    deactivated++;
    log.push(`- ${name}  | kept #${keep.id} (${keep.slug}) | deactivated #${r.id} (${r.slug})`);
  }
}

const after = await c.query(`SELECT count(*) AS total FROM foods WHERE is_active = TRUE`);
console.log(`Deactivated ${deactivated} duplicate rows. Active foods now: ${after.rows[0].total}`);
for (const l of log) console.log(l);

await c.end();
