import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

/*
 * ============================================================
 * FOOD IMAGE STATUS AUDIT (read-only, re-runnable)
 * ============================================================
 *
 * Classifies every ACTIVE food's image state:
 *   GOOD, LIKELY_WRONG, BROKEN_URL, MISSING_BUT_PREVIOUS_URL_AVAILABLE,
 *   MISSING_NO_CANDIDATE, NEEDS_MANUAL_REVIEW
 *
 * Reads: the database (SELECT only) + scripts/.food_image_results.json.
 * Writes: backend/reports/audit/image-status.csv + image-status.json.
 *
 * Never writes to the database. Optional `--probe` runs a slow, throttled
 * URL reachability sweep (1 req / ~1.2 s) to avoid Wikimedia 429s.
 */

const OUT_DIR = "reports/audit";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);

const tokens = (s) => new Set(norm(s));
const overlap = (a, b) => {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / ta.size;
};

const NON_FOOD = [
  "hotel", "restaurant", "restaurante", "cafe", "cafeteri", "diner", "tavern",
  "shop", "store", "bazaar", "mall", "supermarket", "outlet",
  "building", "tower", "bridge", "road", "street", "avenue", "square", "plaza",
  "mountain", "hill", "valley", "desert", "ocean", "sea", "river", "lake",
  "city", "village", "town", "metro", "railway", "station", "airport", "museum",
  "mosque", "temple", "church", "shrine", "palace", "monument", "statue",
  "cemetery", "cemetiere", "sign", "billboard", "poster", "banner", "logo",
  "map of", "icon", "cap", "bottle", "carton", "label",
  "flower", "rose", "water lily", "nymphaea", "bird", "parrot", "butterfly",
  "insect", "cat", "dog", "horse", "person", "people", "portrait", "man",
  "woman", "children", "selling", "display", "shelf", "stall", "cart",
  "hand", "hands", "convention centre", "rock wells", "performing", "promo",
  "launch", "madonna", "devi", "machida", "grilled saba", "skyline", "sunset",
  "painting", "drawing", "independent dates",
];

const titleFromSource = (src) => {
  if (!src) return null;
  const m = src.match(/\(([^)]+)\)\s*(?:★|\s—\s*query:.*)?$/);
  if (m) return m[1].trim();
  const fallback = src.match(/\(([^)]+)\)/);
  return fallback ? fallback[1].trim() : null;
};

const titleFromUrl = (url) => {
  if (!url) return null;
  const last = decodeURIComponent(url.split("/").pop() || "")
    .replace(/\.(jpe?g|png|gif|webp|svg|jfif|bmp|tiff?)$/i, "")
    .replace(/_/g, " ")
    .trim();
  if (!last || /^special:filepath/i.test(last)) return null;
  return last;
};

const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const REACH_FILE = "scripts/.food_image_reach.json";
const reachCache = JSON.parse(fs.readFileSync(REACH_FILE, "utf8").length ? fs.readFileSync(REACH_FILE, "utf8") : "{}");
const persistReach = () => fs.writeFileSync(REACH_FILE, JSON.stringify(reachCache, null, 2));

async function probeUrl(url) {
  if (reachCache[url]) return reachCache[url];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        await sleep(1200);
        continue;
      }
      reachCache[url] = { ok: res.ok, status: String(res.status), definitiveBroken: !res.ok };
      return reachCache[url];
    } catch (e) {
      reachCache[url] = { ok: false, status: `error:${e.name || "ERR"}`, definitiveBroken: true };
      return reachCache[url];
    }
  }
  reachCache[url] = { ok: false, status: "429", definitiveBroken: false, unverified: true };
  return reachCache[url];
}

const shouldProbe = process.argv.includes("--probe");

fs.mkdirSync(OUT_DIR, { recursive: true });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT f.id, f.name, f.image_url, f.image_source, f.region,
          c.name AS category
     FROM foods f
     JOIN food_categories c ON c.id = f.category_id
    WHERE f.is_active = TRUE
    ORDER BY f.name`
);

const pass1 = JSON.parse(fs.readFileSync("scripts/.food_image_results.json", "utf8"));

const records = rows.map((r) => {
  const pass1rec = pass1[r.name] || null;
  const srcTitle = titleFromSource(r.image_source);
  const urlTitle = titleFromUrl(r.image_url);
  const title = srcTitle || urlTitle || null;
  const isPlaceholder = /Special:FilePath/.test(r.image_source || "") || /Special:FilePath/.test(r.image_url || "");
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    region: r.region || null,
    imageUrl: r.image_url || null,
    imageSource: r.image_source || null,
    title,
    isPlaceholder,
    prevUrl: pass1rec ? pass1rec.url : null,
    prevTitle: pass1rec ? pass1rec.title : null,
    prevLicense: pass1rec ? pass1rec.license : null,
    status: null,
    reason: null,
    score: null,
    flags: [],
    reach: null,
  };
});

const urlToNames = new Map();
for (const r of records) {
  if (!r.imageUrl) continue;
  if (!urlToNames.has(r.imageUrl)) urlToNames.set(r.imageUrl, []);
  urlToNames.get(r.imageUrl).push(r.name);
}

const nonFoodHit = (t) => (t ? NON_FOOD.find((k) => t.toLowerCase().includes(k)) : null);

for (const r of records) {
  if (r.isPlaceholder) {
    r.status = "NEEDS_MANUAL_REVIEW";
    r.reason = "generic Special:FilePath placeholder";
    r.flags.push("placeholder");
    continue;
  }
  if (r.imageUrl) {
    if (r.title && norm(r.title).length > 0) {
      const sc = overlap(r.name, r.title);
      const nfk = nonFoodHit(r.title);
      r.score = Math.round(sc * 100) / 100;
      if (nfk) r.flags.push("non-food:" + nfk);
      if (sc === 0 || (nfk && sc < 0.5)) {
        r.status = "LIKELY_WRONG";
        r.reason = sc === 0 ? "no title/name overlap" : `weak overlap + non-food keyword "${nfk}"`;
        if (nfk) r.flags.push("unrelated-title");
      } else {
        r.status = "GOOD";
        r.reason = "title overlaps name";
      }
    } else {
      r.status = "NEEDS_MANUAL_REVIEW";
      r.reason = "image present but title unparseable";
      r.flags.push("no-title");
    }
  } else {
    if (r.prevUrl) {
      r.status = "MISSING_BUT_PREVIOUS_URL_AVAILABLE";
      r.reason = "source present, image_url NULL, Pass-1 URL exists";
      r.flags.push("prev-url-available");
    } else {
      r.status = "MISSING_NO_CANDIDATE";
      r.reason = r.imageSource ? "source present but no Pass-1 URL recorded" : "no image and no source";
      r.flags.push("no-candidate");
    }
  }
}

for (const [u, names] of urlToNames) {
  if (names.length > 1) {
    for (const n of names) {
      const r = records.find((x) => x.name === n);
      r.status = "NEEDS_MANUAL_REVIEW";
      r.reason = `exact duplicate image_url shared with: ${names.filter((x) => x !== n).join(", ")}`;
      r.flags.push("dup-url");
    }
  }
}

// Optional slow reachability sweep
if (shouldProbe) {
  const targets = new Set();
  for (const r of records) {
    if (r.imageUrl) targets.add(r.imageUrl);
    if (!r.imageUrl && r.prevUrl) targets.add(r.prevUrl);
  }
  const list = [...targets];
  const toProbe = list.filter((u) => !reachCache[u]);
  console.log(`Probing ${toProbe.length}/${list.length} unique URLs (cached: ${list.length - toProbe.length}, throttled ~1.2s each)...`);
  for (let i = 0; i < toProbe.length; i += 1) {
    await probeUrl(toProbe[i]);
    await sleep(1000);
    if ((i + 1) % 25 === 0) { persistReach(); console.log(`  probed ${i + 1}/${toProbe.length}`); }
  }
  persistReach();
  fs.writeFileSync(path.join(OUT_DIR, "image-reach-latest.json"), JSON.stringify(reachCache, null, 2));

  for (const r of records) {
    if (!r.imageUrl) continue;
    const p = reachCache[r.imageUrl];
    r.reach = p ? p.status : null;
    if (p && p.ok) {
      if (r.status === "GOOD") r.reason += `; reachable(${p.status})`;
      else r.reason += `; reachable(${p.status})`;
      r.flags.push("reachable");
    } else if (p && p.status === "429") {
      r.reason += "; reachability UNVERIFIED (429)";
      r.flags.push("probe-ratelimited");
    } else {
      r.status = r.status === "GOOD" || r.status === "LIKELY_WRONG" || r.status === "NEEDS_MANUAL_REVIEW" ? r.status : "BROKEN_URL";
      if (r.status === "LIKELY_WRONG") {
        r.reason += `; url UNREACHABLE (${p ? p.status : "?"})`;
        r.flags.push("unreachable");
      } else {
        r.status = "BROKEN_URL";
        r.reason = `url not reachable (${p ? p.status : "no probe"})`;
        r.flags.push("network-error");
      }
    }
  }
  for (const r of records) {
    if (!r.imageUrl && r.prevUrl) {
      const p = reachCache[r.prevUrl];
      r.prevUrlReachable = p ? p.ok : false;
      r.prevUrlStatus = p ? p.status : "error";
    }
  }
}

const counts = {};
for (const r of records) counts[r.status] = (counts[r.status] || 0) + 1;

const header = ["id", "name", "category", "region", "status", "reason", "image_url", "image_source", "title", "score", "prev_url", "prev_url_reachable", "prev_title", "flags"];
const lines = [header.join(",")];
for (const r of records) {
  lines.push(
    [r.id, r.name, r.category, r.region, r.status, r.reason, r.imageUrl, r.imageSource, r.title, r.score ?? "", r.prevUrl, r.prevUrlReachable ?? "", r.prevTitle || "", r.flags.join(";")].map(esc).join(",")
  );
}
fs.writeFileSync(path.join(OUT_DIR, "image-status.csv"), lines.join("\n"));
fs.writeFileSync(path.join(OUT_DIR, "image-status.json"), JSON.stringify({ generatedAt: new Date().toISOString(), counts, records }, null, 2));

console.log("\n=== IMAGE STATUS AUDIT ===");
console.log(JSON.stringify(counts, null, 2));
console.log(`\nCSV: ${OUT_DIR}/image-status.csv`);
console.log(`JSON: ${OUT_DIR}/image-status.json`);

await client.end();