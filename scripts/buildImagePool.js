import pg from "pg";
import "dotenv/config";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// Pull all current distinct name + image pairs so we can build a reuse pool
const rows = await c.query(
  `SELECT DISTINCT ON (name) name, image_url, image_source
     FROM foods
    WHERE image_source LIKE 'Wikimedia Commons via Openverse%'
    ORDER BY name`
);

const pool = [];
for (const r of rows.rows) {
  if (!r.image_url || r.image_url.includes("Special:FilePath")) continue;
  const title = r.image_source
    .replace(/^Wikimedia Commons via Openverse \(/, "")
    .replace(/\)$/, "")
    .split(" — query:")[0]
    .replace(/[()]/g, "")
    .trim();
  pool.push({
    name: r.name,
    url: r.image_url,
    title,
    titleClean: String(title).toLowerCase().replace(/[^a-z ]/g, ""),
    nameLower: String(r.name).toLowerCase().replace(/[^a-z ]/g, ""),
  });
}

console.log("Pool size:", pool.length);
const { writeFile } = await import("node:fs/promises");
await writeFile("scripts/.image_pool.json", JSON.stringify(pool, null, 2));
console.log("Saved scripts/.image_pool.json");

await c.end();