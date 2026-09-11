import pg from "pg";
import fs from "fs";
import "dotenv/config";
import { scoreName, cleanTitle, tokens, REGION_WORDS } from "./lib/imageMatch.js";

/*
 * ============================================================
 * OPENVERSE CANDIDATE DISCOVERY (read-only)
 * ============================================================
 *
 * For every ACTIVE food with no image_url, query the Openverse
 * image index (Wikimedia source only, commercial licenses) and
 * score the results with the shared confidence model.
 *
 * DISTINCT FROM THE OLD PIPELINE:
 *   - No image-pool token matching.
 *   - No copying another food's image.
 *   - Candidates come from per-food searches only.
 *
 * Writes (state, NOT database):
 *   scripts/.food_image_candidates.json   name -> [ candidates ]
 *   scripts/.food_image_search_progress.json
 *
 * Usage:
 *   node searchFoodImageCandidates.js        # fetch + score missing
 *   node searchFoodImageCandidates.js --rescore   # re-score stored
 *                                                # candidates only
 */

const UA = "EatAndCheat/1.0 (food catalog images; contact: admin@example.com)";
const CAND_FILE = "scripts/.food_image_candidates.json";
const PROG_FILE = "scripts/.food_image_search_progress.json";
const DELAY_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESCORE = process.argv.includes("--rescore");

const stripQuery = (name) => {
  let n = name.replace(/\(.*?\)/g, " ").trim();
  const parts = n.split(/\s+/);
  const filtered = parts.filter((p) => !REGION_WORDS.has(p.toLowerCase()));
  return (filtered.length ? filtered : parts).join(" ").trim() || name;
};

const searchOpenverse = async (query) => {
  const url =
    "https://api.openverse.org/v1/images/" +
    `?q=${encodeURIComponent(query)}` +
    "&source=wikimedia" +
    "&license_type=commercial" +
    "&page_size=10";
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new Error("HTTP 429");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data?.results || [];
};

fs.mkdirSync("scripts", { recursive: true });
let candidates = {};
try {
  candidates = JSON.parse(fs.readFileSync(CAND_FILE, "utf8"));
} catch {
  candidates = {};
}
let progress = [];
try {
  progress = JSON.parse(fs.readFileSync(PROG_FILE, "utf8"));
} catch {
  progress = [];
}

if (RESCORE) {
  let changed = 0;
  for (const [name, list] of Object.entries(candidates)) {
    if (!list) continue;
    for (const c of list) {
      const sc = scoreName(name, c.title, c.license);
      if (sc.level !== c.level || sc.conf !== c.conf) changed += 1;
      c.conf = sc.conf;
      c.level = sc.level;
      c.reason = sc.reason;
    }
    list.sort((a, b) => b.conf - a.conf);
  }
  fs.writeFileSync(CAND_FILE, JSON.stringify(candidates, null, 2));
  const byLevel = {};
  for (const arr of Object.values(candidates)) {
    const lvl = arr[0] ? arr[0].level : "NONE";
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
  }
  console.log("RESCORED with shared imageMatch rules. changed:", changed);
  console.log("best-level distribution:", JSON.stringify(byLevel));
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT DISTINCT name, MIN(slug) AS slug
     FROM foods
    WHERE is_active = TRUE AND image_url IS NULL
    GROUP BY name
    ORDER BY name`
);
await client.end();

const todo = rows.filter((r) => !progress.includes(r.name) || !candidates[r.name]);
console.log(`Foods missing images: ${rows.length} | already searched: ${rows.length - todo.length} | todo: ${todo.length}`);

let okCount = 0;
let failCount = 0;

for (const { name } of todo) {
  const queries = [name, stripQuery(name)];
  const uniq = new Map();
  let lastErr = null;

  for (const q of [...new Set(queries.filter(Boolean))]) {
    if (uniq.size >= 8) break;
    try {
      const results = await searchOpenverse(q);
      for (const r of results) {
        if (!r.url || !r.url.startsWith("https://upload.wikimedia.org")) continue;
        if (uniq.has(r.url)) continue;
        const title = cleanTitle(r.title);
        const sc = scoreName(name, title, r.license);
        uniq.set(r.url, {
          url: r.url,
          title,
          license: r.license,
          foreignLandingUrl: r.foreign_landing_url || null,
          thumbnail: r.thumbnail || null,
          query: q,
          conf: sc.conf,
          level: sc.level,
          reason: sc.reason,
        });
      }
      if (uniq.size === 0) lastErr = "no wikimedia results";
    } catch (e) {
      lastErr = e.message;
      if (/429/.test(e.message)) await sleep(3000);
    }
    await sleep(DELAY_MS);
  }

  const scored = [...uniq.values()].sort((a, b) => b.conf - a.conf).slice(0, 5);
  candidates[name] = scored;
  if (!progress.includes(name)) progress.push(name);

  const best = scored[0] ? `${scored[0].level} ${scored[0].conf} "${scored[0].title.slice(0, 50)}"` : `NONE ${lastErr || ""}`;
  console.log(`${scored.length ? "✓" : "✗"} ${name.padEnd(38)} ${best}`);
  if (scored.length) okCount += 1;
  else failCount += 1;

  fs.writeFileSync(CAND_FILE, JSON.stringify(candidates, null, 2));
  fs.writeFileSync(PROG_FILE, JSON.stringify(progress, null, 2));
}

const byLevel = {};
for (const arr of Object.values(candidates)) {
  const lvl = arr[0] ? arr[0].level : "NONE";
  byLevel[lvl] = (byLevel[lvl] || 0) + 1;
}
console.log("\n=== CANDIDATE DISCOVERY SUMMARY ===");
console.log("foods with candidate(s):", okCount, "| no candidates:", failCount);
console.log("best-level distribution:", JSON.stringify(byLevel));
console.log(`state: ${CAND_FILE}`);