import pg from "pg";
import "dotenv/config";
import { writeFile, readFile } from "node:fs/promises";

/*
 * Accurate per-dish image resolver.
 *
 * For every ACTIVE food with a NULL image, search Wikimedia Commons for the
 * dish by name and assign a photo ONLY when the file title genuinely matches
 * the dish (whole-word token / exact-phrase checks). Ensures no image URL is
 * reused across different dishes. Anything that cannot be confidently matched
 * stays NULL and is written to .food_image_resolved.json as "needs-review" so
 * it can be curated by hand.
 */

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "EatAndCheat/1.0 (food catalog image resolver; contact: admin@example.com)";
const RESULTS_FILE = "scripts/.food_image_resolved.json";
const LOG_FILE = "scripts/.food_image_resolve.log";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = (msg) => {
  const line = `${new Date().toISOString().slice(11, 19)} ${msg}`;
  console.log(line);
  return writeFile(LOG_FILE, line + "\n", { flag: "a" }).catch(() => {});
};

const STOPWORDS = new Set([
  "in", "of", "the", "and", "with", "on", "at", "a", "an", "for", "from", "style", "served", "pakistani", "indian", "traditional",
]);

const parenthetical = (name) => String(name).replace(/\([^)]*\)/g, " ");

const significantTokens = (name) => {
  const cleaned = parenthetical(name).toLowerCase().replace(/[^a-z\s/&]/g, " ").replace(/[/&]/g, " ");
  return cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
};

const normTitle = (title) =>
  String(title || "")
    .replace(/^File:/i, "")
    .replace(/\.(jpe?g|png|webp|gif|svg|tiff?)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const wholeWord = (text, token) => {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`).test(text);
};

const searchCommons = async (query, signal) => {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|mime|size",
    iiurlwidth: "640",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${API}?${params}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Commons HTTP ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages || {};
  return Object.values(pages).map((p) => ({
    title: p.title,
    info: Array.isArray(p.imageinfo) ? p.imageinfo[0] : null,
  }));
};

const usable = (cand) => {
  const info = cand.info;
  if (!info) return false;
  if (!["image/jpeg", "image/png", "image/webp"].includes(info.mime)) return false;
  if ((info.width || 0) < 480) return false;
  if (!info.thumburl && !info.url) return false;
  return true;
};

/*
 * Score a candidate file title against the dish's significant tokens.
 *   H   -> exact phrase / every token present / single-word dish present
 *   M   -> the dish noun (last token) is present (likely correct, worth a glance)
 *   LOW -> only a partial/ambiguous overlap (do NOT auto-assign)
 */
const scoreTitle = (title, tokens) => {
  const t = normTitle(title);
  if (!t) return { tier: "LOW", matched: 0, phrase: false };
  const phrase = parenthetical(tokens.join(" ")).trim();
  const phraseHit = phrase.length > 2 && t.includes(phrase);
  if (phraseHit) return { tier: "H", matched: tokens.length, phrase: true };

  const matched = tokens.filter((tok) => wholeWord(t, tok)).length;
  const noun = tokens[tokens.length - 1];
  const nounHit = wholeWord(t, noun);

  if (tokens.length === 1) return nounHit ? { tier: "H", matched: 1 } : { tier: "LOW", matched: 0 };
  if (matched >= tokens.length) return { tier: "H", matched };
  if (nounHit && matched >= tokens.length - 1) return { tier: "M", matched };
  if (nounHit) return { tier: "LOW", matched };
  return { tier: "LOW", matched };
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const start = process.argv[2] ? Number(process.argv[2]) : 0;
  const batchSize = process.argv[3] ? Number(process.argv[3]) : Infinity;
  let processedThisRun = 0;

  // State persistence (resumable)
  let done = {};
  try {
    done = JSON.parse(await readFile(RESULTS_FILE, "utf8"));
  } catch {
    /* first run */
  }

  const { rows } = await client.query(
    `SELECT name FROM foods WHERE is_active = TRUE AND image_url IS NULL GROUP BY name ORDER BY name`
  );
  const names = rows.map((r) => r.name);
  await log(`Total names needing images: ${names.length}`);

  // URLs already in use anywhere in the DB (incl. the 314 already imaged) + this run
  const used = new Set(
    (
      await client.query(`SELECT DISTINCT image_url FROM foods WHERE image_url IS NOT NULL`)
    ).rows.map((r) => r.image_url)
  );

  let assigned = 0;
  let needsReview = 0;
  let noResult = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (done[name]?.status === "done") continue;
    if (i < start) continue;

    const tokens = significantTokens(name);
    if (!tokens.length) {
      done[name] = { status: "needs-review", reason: "no significant tokens" };
      needsReview++;
      continue;
    }

    // Query list: full name first, then the dish noun + second-last-word combos.
    const full = parenthetical(name).replace(/\s+/g, " ").trim();
    const queries = [full];
    if (tokens.length >= 2) {
      queries.push(tokens.slice(-2).join(" "));
      queries.push(tokens[tokens.length - 1]);
    } else {
      queries.push(tokens[0]);
    }

    let best = null; // { url, title, tier, matched, query }
    const tried = new Set();
    for (const q of queries) {
      if (tried.has(q)) continue;
      tried.add(q);
      let candidates = [];
      try {
        candidates = await searchCommons(q, AbortSignal.timeout(15000));
      } catch {
        await sleep(400);
        continue;
      }
      candidates = candidates.filter(usable);
      for (const cand of candidates) {
        const score = scoreTitle(cand.title, tokens);
        if (!best || score.tier === "H" || (score.tier === best.tier && score.matched > best.matched)) {
          const info = cand.info;
          const url = info.thumburl || info.url;
          if (url && !used.has(url)) {
            best = { url, title: cand.title, tier: score.tier, matched: score.matched, query: q };
          }
          if (score.tier === "H" && best?.tier === "H" && best.url) break;
        }
      }
      if (best && best.tier === "H") break;
      await sleep(160);
    }

    if (!best) {
      done[name] = { status: "needs-review", reason: "no usable match found" };
      noResult++;
      needsReview++;
    } else if (best.tier === "LOW") {
      done[name] = {
        status: "needs-review",
        reason: "low-confidence match",
        candidate: { url: best.url, title: best.title, query: best.query },
      };
      needsReview++;
    } else {
      await client.query(
        `UPDATE foods SET image_url = $1, image_source = $2 WHERE name = $3 AND is_active = TRUE`,
        [best.url, `Wikimedia Commons (${best.title.replace(/^File:/, "")})${best.tier === "M" ? " — verify" : ""}`, name]
      );
      used.add(best.url);
      done[name] = { status: "done", url: best.url, title: best.title, tier: best.tier, query: best.query };
      assigned++;
    }

    processedThisRun++;
    if ((i + 1) % 25 === 0) await writeFile(RESULTS_FILE, JSON.stringify(done, null, 2));
    if (processedThisRun >= batchSize) {
      await writeFile(RESULTS_FILE, JSON.stringify(done, null, 2));
      await log(`Batch stopped at name #${i + 1} / ${names.length} (processed ${processedThisRun})`);
      await client.end();
      process.exit(0);
    }
  }

  await writeFile(RESULTS_FILE, JSON.stringify(done, null, 2));

  const stats = await client.query(
    `SELECT count(*) FILTER (WHERE image_url IS NULL) AS null_img,
            count(*) FILTER (WHERE image_url IS NOT NULL) AS with_img,
            count(*) AS total
       FROM foods WHERE is_active = TRUE`
  );
  await log(`Assigned: ${assigned} | needs-review: ${needsReview} | no-result: ${noResult}`);
  await log(`DB now — with image: ${stats.rows[0].with_img} | still null: ${stats.rows[0].null_img} | total: ${stats.rows[0].total}`);
  await log("Resolver finished.");

  await client.end();
}

main().catch(async (e) => {
  console.error("FATAL:", e.message);
  await client.end().catch(() => {});
  process.exit(1);
});
