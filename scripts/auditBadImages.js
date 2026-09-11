import pg from "pg";
import "dotenv/config";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// Words strongly implying the matched title is NOT food
const NON_FOOD = [
  "promo", "launch", "performing", "rock wells", "convention centre",
  "cemetière", "cemetiere", "sign of", "road sign", "map of", "desert",
  "bird", "water lily", "nymphaea", "tree moving", "person", "devi",
  "machida", "pak bia", "hypoleucos", "gigantea", "independence dates",
  "metro", "skyline", "icon", "shelf", "grilled saba",
];

const rows = await c.query(
  "SELECT name, image_source, image_url FROM foods"
);
const issues = {};
for (const r of rows.rows) {
  if (!r.image_source) continue;
  if (r.image_source.startsWith("Wikimedia Commons Special:FilePath")) continue;
  const title = String(
    r.image_source.replace(/^Wikimedia Commons via Openverse \(/, "").replace(/\)$/, "").split(" — query:")[0] || ""
  ).toLowerCase();
  const bad = NON_FOOD.some((k) => title.includes(k));
  if (bad) {
    (issues[r.name] = issues[r.name] || []).push(`${title} | ${r.image_url}`);
  }
}

console.log("Distinct names with suspected bad images:", Object.keys(issues).length);
for (const [name, list] of Object.entries(issues)) {
  console.log("  " + name + " === " + list[0].split(" | ")[0]);
}

await c.end();