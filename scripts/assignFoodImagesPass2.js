import pg from "pg";
import "dotenv/config";

/*
 * ============================================================
 * FOOD IMAGE ASSIGNER — PASS 2 (regional-variant fallback)
 * ============================================================
 *
 * Handles foods whose raw-name search failed because the name
 * carries a regional/branding prefix (e.g. "Lahori Kachori",
 * "Quetta Pulao").  Strategy:
 *
 *   1. Strip known region/place/venue prefixes.
 *   2. Search the core dish name on Openverse.
 *   3. Fall back to a curated dictionary of common desi dishes.
 *   4. If still nothing, keep the existing category image.
 */

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});
const UA = "EatAndCheat/1.0 (food catalog images; contact: admin@example.com)";
const DELAY_MS = 200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const REGION_PREFIXES = [
  "lahori", "karachi", "quetta", "peshawari", "sindhi", "sindh",
  "balochi", "kashmiri", "gilgit", "charsi", "memoni", "multani",
  "punjabi", "bohri", "gwadar", "turbat", "swat", "bong", "shinwari",
  "gujranwala", "hydrabadi", "hyderabadi",
  "burns road", "jinnah road", "qissa khwani", "fort road",
  "port grand", "do darya", "hollywood café", "anarkali bazaar",
  "lassi", "chawal", "meethe", "mithai", "snacks", "drinks",
  "naan", "roti", "paratha", "doodh", "chesse",
  "sheer", "kheer", "sharbat",
];

// Curated fallbacks for dishes that Openverse struggles to index
const CURATED = {
  "Bihari Kebab": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Chaaps_and_kebabs.jpg/640px-Chaaps_and_kebabs.jpg",
  "Mutton Paye": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Paya_curry_bangladeshi_style.jpg/640px-Paya_curry_bangladeshi_style.jpg",
  "Paye": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Paya_curry_bangladeshi_style.jpg/640px-Paya_curry_bangladeshi_style.jpg",
  "Doodh Soda": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Gulab_Jamun_Doodh.jpg/640px-Gulab_Jamun_Doodh.jpg",
  "Sajji": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Chicken_sajji.jpg/640px-Chicken_sajji.jpg",
};

const searchOpenverse = async (query) => {
  const url =
    "https://api.openverse.org/v1/images/" +
    `?q=${encodeURIComponent(query)}` +
    "&source=wikimedia" +
    "&license_type=commercial" +
    "&page_size=6";
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
  const data = await res.json();
  return data?.results || [];
};

const stripRegion = (name) => {
  let parts = name.split(" ");
  while (parts.length > 1) {
    const first = parts[0].toLowerCase().replace(/[^a-z]/g, "");
    if (
      REGION_PREFIXES.some((p) => {
        const clean = p.replace(/^["']|["']$/g, "");
        return clean === first;
      })
    ) {
      parts = parts.slice(1);
    } else break;
  }
  let rest = parts.join(" ");
  // strip trailing placeholders
  rest = rest
    .replace(/\((chicken|mutton|beef|lamb)\)/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return rest || name;
};

const pickBest = (resultsArr, tokens) => {
  const scored = [];
  for (const r of resultsArr) {
    if (!r.url || !r.url.startsWith("https://upload.wikimedia.org")) continue;
    const title = String(r.title || "").toLowerCase();
    const name = tokens.join(" ").toLowerCase();
    let score = 0;
    if (title && title.includes(name)) score += 10;
    else score += tokens.some((t) => t.length > 2 && title.includes(t)) ? 5 : 0;
    if (r.license === "cc0" || r.license === "pdm") score += 2;
    scored.push({ r, score });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].r;
};

const tokenize = (name) =>
  name
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-zA-Z\s/]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2 && !REGION_PREFIXES.includes(t));

async function main() {
  await client.connect();

  const { rows } = await client.query(
    `SELECT name, count(*) cnt,
            (array_agg(image_url ORDER BY (image_source IS NOT NULL) DESC, slug))[1] AS cur_url,
            min(image_source) AS cur_source
       FROM foods
      GROUP BY name
      HAVING count(*) FILTER (WHERE image_url IS NULL) > 0
          OR bool_or(image_source LIKE 'Wikimedia Commons Special:FilePath%')
      ORDER BY name`
  );

  console.log(`Names still on generic images: ${rows.length}`);

  let updated = 0;
  let resolved = 0;

  for (const { name } of rows) {
    // skip any that now already have a real per-food image
    const core = stripRegion(name);

    let chosen = null;
    let usedQuery = null;

    // 1. curated
    if (CURATED[name] || CURATED[core]) {
      chosen = { url: CURATED[name] || CURATED[core], title: core, license: "cc0" };
      usedQuery = "curated";
    }

    // 2. try full name first, then stripped core
    if (!chosen) {
      for (const q of [name, core]) {
        if (!q) continue;
        try {
          const found = await searchOpenverse(q);
          const best = pickBest(found, tokenize(core));
          if (best) {
            chosen = best;
            usedQuery = q;
            break;
          }
        } catch {
          /* try next */
        }
        await sleep(DELAY_MS);
      }
    }

    if (chosen?.url) {
      const res = await client.query(
        `UPDATE foods
            SET image_url = $1,
                image_source = $2
          WHERE name = $3`,
        [
          chosen.url,
          `Wikimedia Commons via Openverse (${chosen.title || core}${usedQuery ? " — query: " + usedQuery : ""})`,
          name,
        ]
      );
      updated += res.rowCount;
      resolved++;
      console.log(`✓ ${name.padEnd(40)} ${chosen.title || ""}`);
    } else {
      console.log(`✗ ${name}`);
    }

    await sleep(DELAY_MS + 100);
  }

  const stats = await client.query(
    `SELECT count(*) FILTER (WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%') AS generic,
            count(*) FILTER (WHERE image_url IS NULL) AS noimg,
            count(*) AS total
       FROM foods`
  );
  console.log(`\n✅ Pass 2 done. Resolved: ${resolved}, rows updated: ${updated}`);
  console.log(`Remaining generic-image foods: ${stats.rows[0].generic}`);

  await client.end();
}

main().catch(async (e) => {
  console.error("FATAL:", e.message);
  await client.end().catch(() => {});
  process.exit(1);
});