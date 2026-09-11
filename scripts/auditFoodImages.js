import pg from "pg";
import "dotenv/config";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const flag = process.argv[2];

if (flag === "generic") {
  const generic = await c.query(
    "SELECT count(*) FROM foods WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%'"
  );
  console.log("Still generic:", generic.rows[0].count);
  const dist = await c.query(
    "SELECT DISTINCT name FROM foods WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%' ORDER BY name"
  );
  console.log("Distinct generic names:", dist.rows.length);
  for (const r of dist.rows) console.log("  " + r.name);
} else if (flag === "bad") {
  // find foods whose matched title is obviously not the food (no shared token)
  const rows = await c.query(
    "SELECT name, image_source FROM foods WHERE image_source LIKE 'Wikimedia Commons via Openverse%' AND image_source LIKE '% — query: %'"
  );
  const out = [];
  for (const r of rows.rows) {
    const m = r.image_source.match(/\(([^)]+)\) — query: (.+)$/);
    if (!m) continue;
    const title = String(m[1]).toLowerCase();
    const query = m[2].toLowerCase();
    const qTokens = query.split(/[\s/]+/).filter((t) => t.length > 2);
    const ok = qTokens.some((t) => title.includes(t));
    if (!ok) out.push(`${r.name} === ${r.image_source}`);
  }
  console.log("Suspected wrong matches:", out.length);
  for (const o of out) console.log("  " + o);
} else if (flag === "sample") {
  const rows = await c.query(
    "SELECT name, image_url, image_source FROM foods WHERE image_source LIKE 'Wikimedia Commons via Openverse%' LIMIT 30"
  );
  for (const r of rows) console.log(`${r.name} | ${r.image_url} | ${r.image_source}`);
}

await c.end();