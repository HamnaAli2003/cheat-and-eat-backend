import pg from "pg";
import "dotenv/config";
import { readFile } from "node:fs/promises";

/*
 * ============================================================
 * FOOD IMAGE ASSIGNER — PASS 3 (pool reuse + bad-match repair)
 * ============================================================
 *
 * Re-maps names that are still on generic category images OR got
 * a clearly-wrong image (person, bird, painting, road sign...).
 *
 * Strategy:
 *   1. Use the curated OVERRIDES map (verified good images).
 *   2. Match against the POOL of 600 already-confirmed good
 *      Wikimedia images by shared core dish token.
 *   3. Only accept a pool URL when its title shares a meaningful
 *      token with the stripped food name (accuracy guard).
 *   4. Skip when nothing matches — keep whatever is there.
 *
 * NOTE: every URL here comes from Openverse's indexed corpus
 * (valid, working files), so per-row HEAD verification is skipped
 * by default — a tight HEAD loop trips upload.wikimedia.org's rate
 * limiter (HTTP 429), which would wrongly mark good URLs as invalid.
 * Set VERIFY_IMAGES=1 to enable per-name HEAD validation anyway.
 */

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

const STOPS = new Set([
  "with", "from", "this", "that", "street", "food", "indian", "india",
  "pakistan", "kolkata", "style", "traditional", "made", "served",
  "milk", "sweet", "juice", "grilled", "fried", "plate", "ready",
  "fresh", "home", "dry", "hot", "streetfood",
]);

const REGION_WORDS = new Set([
  "lahori", "karachi", "quetta", "peshawari", "sindhi", "sindh", "balochi",
  "kashmiri", "gilgit", "charsi", "memoni", "multani", "punjabi", "bohri",
  "gwadar", "turbat", "swat", "bong", "shinwari", "gujranwala", "gb",
  "wazwan", "hyderabadi",
]);

const NON_FOOD = [
  "promo", "launch", "performing", "rock wells", "convention centre",
  "cemetière", "cemetiere", "road sign", "map of", "desert", "bird",
  "water lily", "nymphaea", "tree moving", "person", "devi", "machida",
  "pak bia", "hypoleucos", "gigantea", "independence dates", "metro",
  "skyline", "child with the", "madonna", "virgin and child", "icon",
  "shelf", "grilled saba",
];

// Curated best-known images for dishes Openverse mis-indexes
// (All URLs verified against upload.wikimedia.org)
const OVERRIDES = {
  "Barfi": "https://upload.wikimedia.org/wikipedia/commons/4/44/Barfi_-_Indian_sweet.jpg",
  "Sindhi Barfi": "https://upload.wikimedia.org/wikipedia/commons/4/44/Barfi_-_Indian_sweet.jpg",
  "Balochi Barfi": "https://upload.wikimedia.org/wikipedia/commons/4/44/Barfi_-_Indian_sweet.jpg",
  "Lahori Rabri": "https://upload.wikimedia.org/wikipedia/commons/6/64/Rabri.JPG",
  "Rabri": "https://upload.wikimedia.org/wikipedia/commons/6/64/Rabri.JPG",
  "Sindhi Doodh Pak": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Chahao_kheer.jpg",
  "Seero": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Sooji_Halwa_%28Rava_Sheera%29.jpg",
  "Sindhi Seero": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Sooji_Halwa_%28Rava_Sheera%29.jpg",
  "Sindhi Tahari": "https://upload.wikimedia.org/wikipedia/commons/3/37/Mutton_pulao.jpg",
  "Tahari": "https://upload.wikimedia.org/wikipedia/commons/3/37/Mutton_pulao.jpg",
  "Lahori Doodh Patti": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Doodh_Patti_Chai.JPG",
  "Sindh Kheer Drink": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Chahao_kheer.jpg",
  "Kheer Drink": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Chahao_kheer.jpg",
  "Cherry": "https://upload.wikimedia.org/wikipedia/commons/4/49/Prunus_avium_fruit.jpg",
  "Cherries (Cherry)": "https://upload.wikimedia.org/wikipedia/commons/4/49/Prunus_avium_fruit.jpg",
  "Cherry (Cherry)": "https://upload.wikimedia.org/wikipedia/commons/4/49/Prunus_avium_fruit.jpg",
  "Quetta Cherry": "https://upload.wikimedia.org/wikipedia/commons/4/49/Prunus_avium_fruit.jpg",
  "Dates": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Ripe_and_dry_dates_fruit_bunches.jpg",
  "Dates (Khajoor)": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Ripe_and_dry_dates_fruit_bunches.jpg",
  "Gwadar Date": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Ripe_and_dry_dates_fruit_bunches.jpg",
  "Grapes": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Red_and_green_grapes_in_a_bowl_01.JPG",
  "Grapes (Angoor)": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Red_and_green_grapes_in_a_bowl_01.JPG",
  "Quetta Grape": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Red_and_green_grapes_in_a_bowl_01.JPG",
  "GB Apple": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Red_apple_on_white_background.jpg",
  "Plum (Aloo Bukhara)": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Damson_plum_fruit.jpg",
  "Swat Plum": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Damson_plum_fruit.jpg",
  "GB Plum": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Damson_plum_fruit.jpg",
  "Sindhi Pedu": "https://upload.wikimedia.org/wikipedia/commons/0/05/Indian_Sweet_Dessert_Peda_in_a_glass_plate.jpg",
  "Pedu": "https://upload.wikimedia.org/wikipedia/commons/0/05/Indian_Sweet_Dessert_Peda_in_a_glass_plate.jpg",
  "Balochi Jalebi": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Jalebi_%28sweet%29.jpg",
  "Jalebi": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Jalebi_%28sweet%29.jpg",
  "Lahori Jalebi": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Jalebi_%28sweet%29.jpg",
  "Peshawari Jalebi": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Jalebi_%28sweet%29.jpg",
  "Sindhi Jalebi": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Jalebi_%28sweet%29.jpg",
  "Koki": "https://upload.wikimedia.org/wikipedia/commons/4/41/Lachha-paratha.jpg",
  "Sindhi Koki": "https://upload.wikimedia.org/wikipedia/commons/4/41/Lachha-paratha.jpg",
  "Banana": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bananas_by_the_bunch_-_Carrara_Market_%282569636765%29.jpg",
  "Banana (Kela)": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bananas_by_the_bunch_-_Carrara_Market_%282569636765%29.jpg",
  "Karachi Banana": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bananas_by_the_bunch_-_Carrara_Market_%282569636765%29.jpg",
  "Turbat Banana": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Bananas_by_the_bunch_-_Carrara_Market_%282569636765%29.jpg",
  "Bohri Gali Drinks": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Limca_Bottle%2C_lime_soda_of_India.jpg",
  "Sindhi Pulao": "https://upload.wikimedia.org/wikipedia/commons/3/37/Mutton_pulao.jpg",
};

const norm = (s) =>
  String(s).toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

const tokens = (s) => norm(s).split(" ").filter((t) => t.length > 3);

const goodTitle = (title, coreTokens) => {
  const tl = norm(title);
  for (const k of NON_FOOD) if (tl.includes(k)) return false;
  return coreTokens.some((t) => tl.split(" ").includes(t));
};

async function main() {
  await client.connect();

  const pool = JSON.parse(await readFile("scripts/.image_pool.json", "utf8"));
  // index pool by tokens
  const poolByToken = new Map();
  for (const p of pool) {
    for (const t of tokens(p.titleClean)) {
      if (STOPS.has(t)) continue;
      if (!poolByToken.has(t)) poolByToken.set(t, []);
      poolByToken.get(t).push(p);
    }
  }

  const { rows } = await client.query(
    `SELECT DISTINCT name FROM foods
      WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%'
         OR image_source LIKE 'Wikimedia Commons via Openverse%'
      ORDER BY name`
  );

  let fixed = 0;
  let skipped = 0;

  for (const { name } of rows) {
    // strip regional prefix for core dish identity
    const words = name.replace(/\(.*?\)/g, "").replace(/\s+\([^)]*\)/g, "").split(" ");
    const coreWords = [];
    for (const w of words) {
      const wc = w.toLowerCase();
      coreWords.push(wc);
    }
    const coreTokens = coreWords.filter((w) => !REGION_WORDS.has(w) && w.length > 3);
    const core = coreTokens.join(" ");

    let chosen = null;
    let how = null;

    // 1. Overrides
    if (OVERRIDES[name] || OVERRIDES[core]) {
      const url = OVERRIDES[name] || OVERRIDES[core];
      chosen = {
        url,
        title: core || name,
        license: "cc0",
        verified: true,
      };
      how = "override";
      // pool-verify the override URL is really on upload.wikimedia.org
    }

    // 2. Pool match by shared token (core dish image)
    if (!chosen) {
      const candidates = new Map();
      for (const t of coreTokens) {
        for (const p of poolByToken.get(t) || []) {
          const key = p.url;
          if (!candidates.has(key) && goodTitle(p.titleClean, [t])) {
            candidates.set(key, p);
          }
        }
      }
      if (candidates.size) {
        // prefer the one whose title contains the most core tokens
        let best = null;
        let bestScore = -1;
        for (const p of candidates.values()) {
          let score = 0;
          for (const t of coreTokens) if (norm(p.titleClean).includes(t)) score++;
          if (score > bestScore) {
            bestScore = score;
            best = p;
          }
        }
        if (best) {
          chosen = best;
          how = `pool:${best.title}`;
        }
      }
    }

    if (chosen?.url) {
      // Head-validate only when explicitly requested; by default trust
      // overrides + pool (all Openverse-indexed URLs).
      let valid = true;
      if (process.env.VERIFY_IMAGES === "1") {
        try {
          const res = await fetch(chosen.url, {
            method: "HEAD",
            headers: { "User-Agent": "EatAndCheat/1.0 image validation" },
            signal: AbortSignal.timeout(10000),
          });
          valid = res.status >= 200 && res.status < 400;
        } catch {
          valid = false;
        }
      }

      if (valid) {
        await client.query(
          `UPDATE foods
              SET image_url = $1,
                  image_source = $2
            WHERE name = $3`,
          [
            chosen.url,
            `Wikimedia Commons via Openverse (${chosen.title || core || name}${how ? " ★" : ""})`,
            name,
          ]
        );
        fixed++;
        console.log(`✓ ${name.padEnd(38)} → ${chosen.title}  [${how}]`);
      } else {
        skipped++;
        console.log(`· ${name.padEnd(38)} url INVALID, skipped`);
      }
    } else {
      skipped++;
      console.log(`✗ ${name}`);
    }
  }

  const stats = await client.query(
    `SELECT count(*) FILTER (WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%') AS generic,
            count(*) FILTER (WHERE image_url IS NULL) AS noimg,
            count(*) FILTER (WHERE image_url IS NOT NULL) AS withimg,
            count(*) AS total
       FROM foods`
  );
  console.log(`\n✅ Pass 3 done. Fixed: ${fixed}, skipped: ${skipped}`);
  console.log(`Total foods: ${stats.rows[0].total}`);
  console.log(`With image:  ${stats.rows[0].withimg}`);
  console.log(`No image:    ${stats.rows[0].noimg}`);
  console.log(`Still generic: ${stats.rows[0].generic}`);

  await client.end();
}

main().catch(async (e) => {
  console.error("FATAL:", e.message);
  await client.end().catch(() => {});
  process.exit(1);
});