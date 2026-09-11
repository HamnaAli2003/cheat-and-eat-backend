import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { scoreName, cleanTitle, titleFromUrl } from "./lib/imageMatch.js";

/*
 * ============================================================
 * FOOD IMAGE ASSIGNMENT (CLEAN PIPELINE)
 * ============================================================
 *
 * Replaces the old assignFoodImages.js + Pass2/3/4 token-pool scripts.
 *
 * Rules enforced here:
 *   1. Only ACTIVE foods with image_url NULL are considered.
 *   2. Never overwrite an existing image_url.
 *   3. No image-pool, no cross-food reuse, no random reuse.
 *   4. An image is auto-assigned ONLY when it is the specific food's
 *      own verified image (curated) or the best Openverse candidate is
 *      HIGH confidence and not definitively broken.
 *
 * Evidence priority per food:  curated-mappings.json
 *                              > Pass-1 previous URL (recovery, probed)
 *                              > best Openverse candidate (HIGH only)
 *
 * Without `--apply` this is a DRY RUN: it probes, plans, and writes a
 * change report but touches nothing.
 * With `--apply` it first writes a full backup snapshot, then performs
 * the UPDATEs, then writes the change log.
 *
 * Usage:
 *   node assignFoodImages.js                     # dry-run, full plan
 *   node assignFoodImages.js --recover-only      # dry-run, recovery only
 *   node assignFoodImages.js --search-only       # dry-run, curated+candidates only
 *   node assignFoodImages.js --apply             # backup + apply + log
 *   node assignFoodImages.js --no-probe          # skip reachability probes
 */

const OUT_DIR = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "reports/audit";
const APPLY = process.argv.includes("--apply");
const PROBE = !process.argv.includes("--no-probe");
const RECOVER_ONLY = process.argv.includes("--recover-only");
const SEARCH_ONLY = process.argv.includes("--search-only");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

fs.mkdirSync(OUT_DIR, { recursive: true });

const REACH_FILE = "scripts/.food_image_reach.json";
let reachCache = {};
try {
  reachCache = JSON.parse(fs.readFileSync(REACH_FILE, "utf8"));
} catch {}

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

const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT id, name, image_url, image_source, is_active
     FROM foods
    WHERE is_active = TRUE
    ORDER BY name`
);

const pass1 = JSON.parse(fs.readFileSync("scripts/.food_image_results.json", "utf8"));
const curated = JSON.parse(fs.readFileSync("scripts/curated-mappings.json", "utf8"));
let candidates = {};
try {
  candidates = JSON.parse(fs.readFileSync("scripts/.food_image_candidates.json", "utf8"));
} catch {}
let forbidden = {};
try {
  forbidden = JSON.parse(fs.readFileSync("scripts/.forbidden_images.json", "utf8"));
} catch {}
const isForbidden = (name, url) => (forbidden[name] || []).includes(url);

const targets = rows.filter((r) => !r.image_url);
console.log(`Active foods: ${rows.length} | already have image: ${rows.length - targets.length} | MISSING: ${targets.length}`);

// ----- plan -----------------------------------------------------------------
const plan = [];
for (const r of targets) {
  const name = r.name;
  const prevRec = pass1[name] || null;
  const candList = candidates[name] || [];
  const bestCand = candList.find((c) => c.level === "HIGH" && !isForbidden(name, c.url)) || null;
  const cur = curated[name] || null;

  let decision = { name, id: r.id, approach: null, url: null, title: null, license: null, level: null, conf: null, reason: null, flags: [], reach: null };

  const hasRecovery = !!prevRec && !!prevRec.url;
  const recScored = hasRecovery ? scoreName(name, prevRec.title || titleFromUrl(prevRec.url) || "", prevRec.license || "cc0") : null;
  const recoveryOk = recScored && recScored.level === "HIGH";

  const considerCurated = !RECOVER_ONLY && !SEARCH_ONLY && !!cur;
  const considerRecovery = !SEARCH_ONLY && hasRecovery && recoveryOk;
  const considerCandidate = !RECOVER_ONLY && bestCand && bestCand.level === "HIGH";

  // 1) curated (human-verified map; highest trust)
  if (considerCurated && !isForbidden(name, cur.url)) {
    decision = {
      ...decision,
      approach: "curated",
      url: cur.url,
      title: cleanTitle(cur.title),
      license: cur.license || "cc0",
      level: "HIGH",
      conf: 1,
      reason: "curated-mappings.json (human verified)",
    };
  }

  // 2) recovery (Pass-1 previous URL, same food, title HIGH confidence)
  if (!decision.url && considerRecovery && !isForbidden(name, prevRec.url)) {
    decision = {
      ...decision,
      approach: "recovery",
      url: prevRec.url,
      title: cleanTitle(prevRec.title || titleFromUrl(prevRec.url) || ""),
      license: prevRec.license || "cc0",
      level: "HIGH",
      conf: recScored.conf,
      reason: "restore same food's Pass-1 URL",
    };
  }

  // 3) Openverse candidate (HIGH only; skipped by --recover-only)
  if (!decision.url && considerCandidate && !isForbidden(name, bestCand.url)) {
    decision = {
      ...decision,
      approach: "candidate",
      url: bestCand.url,
      title: cleanTitle(bestCand.title),
      license: bestCand.license,
      level: "HIGH",
      conf: bestCand.conf,
      reason: `Openverse best (${bestCand.reason})`,
    };
  }

  if (!decision.url) {
    const status =
      !SEARCH_ONLY && hasRecovery && !recoveryOk
        ? { level: "REVIEW", reason: "recovery URL available but title/name confidence below HIGH" }
        : bestCand
          ? { level: "REVIEW", reason: `best candidate is ${bestCand.level} (${bestCand.conf}) — not auto-assignable` }
          : { level: "REVIEW", reason: "no curated/recovery/candidate source" };
    decision.level = status.level;
    decision.reason = decision.reason ? decision.reason + "; " + status.reason : status.reason;
  }

  plan.push(decision);
}

const planned = plan.filter((d) => d.url);
console.log(`Plan (before probes): ${planned.length} auto-eligible | ${plan.length - planned.length} review`);

// ----- one-image-per-food rule ----------------------------------------------
// A machine-driven (recovery/candidate) URL may be auto-assigned to only ONE
// food per run. Other foods referencing the same URL drop to REVIEW, so no
// duplicate-image reuse ever happens. Curated mappings are human-approved and
// deliberately exempt (they intentionally map the same dish once).
const demote = (d, keeper) => {
  d.level = "REVIEW";
  d.reason = `${d.reason}; duplicate image_url shared with "${keeper.name}" — kept for that food instead`;
  d.flags.push("dup-url");
};
{
  const keepers = new Map();
  const pri = (a) => (a.approach === "recovery" ? 0 : a.approach === "candidate" ? 1 : 2);
  for (const d of plan) {
    if (!d.url || d.approach === "curated") continue;
    const prev = keepers.get(d.url);
    if (!prev) {
      keepers.set(d.url, d);
    } else if (pri(d) < pri(prev)) {
      demote(prev, d);
      keepers.set(d.url, d);
    } else {
      demote(d, prev);
    }
  }
}

// ----- probes (throttled) ----------------------------------------------------
if (PROBE) {
  const urls = [...new Set(planned.map((d) => d.url))];
  const toProbe = urls.filter((u) => !reachCache[u]);
  console.log(`Probing ${toProbe.length}/${urls.length} unique URLs (cached: ${urls.length - toProbe.length}, throttled ~1.2 s)...`);
  let i = 0;
  for (const u of toProbe) {
    await probeUrl(u);
    await sleep(1000);
    i += 1;
    if (i % 25 === 0) { persistReach(); console.log(`  probed ${i}/${toProbe.length}`); }
  }
  persistReach();
  for (const d of planned) {
    const p = reachCache[d.url];
    d.reach = p.status;
    if (p.ok) {
      d.flags.push("reachable");
    } else if (p.definitiveBroken) {
      d.level = "REVIEW";
      d.reason += `; url definitively broken (${p.status})`;
      d.flags.push("ur-broken");
    } else if (p.unverified) {
      d.reason += `; reachability unverified (${p.status})`;
      d.flags.push("probe-ratelimited");
    }
  }
}

const apply = plan.filter((d) => d.url && d.level === "HIGH");
const review = plan.filter((d) => !d.url || d.level !== "HIGH");

console.log("\n=== ASSIGNMENT PLAN (dry-run preview) ===");
const byApproach = {};
for (const d of apply) byApproach[d.approach] = (byApproach[d.approach] || 0) + 1;
console.log(JSON.stringify({ autoAssign: apply.length, review: review.length, byApproach }, null, 2));

// ----- outputs ---------------------------------------------------------------
const tsv = [
  ["id", "name", "approach", "level", "conf", "url", "title", "license", "reach", "flags", "reason"].join("\t"),
  ...[...plan]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => [d.id, d.name, d.approach || "", d.level || "", d.conf ?? "", d.url || "", d.title || "", d.license || "", d.reach || "", d.flags.join(";"), d.reason || ""].join("\t")),
].join("\n");

if (APPLY) {
  // ----- backup ------------------------------------------------------------
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(OUT_DIR, `_food_image_backup.${stamp}.json`);
  const backup = rows.map((r) => ({ id: r.id, name: r.name, image_url: r.image_url, image_source: r.image_source, is_active: r.is_active }));
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  await client.query("BEGIN");
  const log = [];
  let updated = 0;
  for (const d of apply) {
    const newSource =
      d.approach === "curated"
        ? `Wikimedia Commons via Openverse (${d.title})`
        : d.approach === "candidate"
          ? `Wikimedia Commons via Openverse (${d.title}) — query: ${d.name}`
          : d.approach === "recovery"
            ? (rows.find((x) => x.id === d.id)?.image_source || `Wikimedia Commons via Openverse (${d.title})`)
            : null;
    const oldRow = rows.find((x) => x.id === d.id);
    const res = await client.query(
      `UPDATE foods SET image_url = $1, image_source = $2
        WHERE id = $3 AND image_url IS NULL AND is_active = TRUE`,
      [d.url, newSource, d.id]
    );
    if (res.rowCount === 1) {
      updated += 1;
      log.push({ id: d.id, name: d.name, approach: d.approach, oldUrl: oldRow?.image_url ?? null, newUrl: d.url, oldSource: oldRow?.image_source ?? null, newSource, reach: d.reach || "", level: d.level });
    }
  }
  await client.query("COMMIT");

  const logFile = path.join(OUT_DIR, "image-change-log.csv");
  const logLines = [
    ["id", "name", "approach", "old_url", "new_url", "old_source", "new_source", "reach"].join(","),
    ...log.map((r) => [r.id, r.name, r.approach, esc(r.oldUrl), esc(r.newUrl), esc(r.oldSource), esc(r.newSource), r.reach].join(",")),
  ].join("\n");
  fs.writeFileSync(logFile, logLines);

  console.log(`\n[APPLY] backup: ${backupFile}`);
  console.log(`[APPLY] rows updated: ${updated} | log: ${logFile}`);
} else {
  const planFile = path.join(OUT_DIR, "image-assignment-plan.tsv");
  fs.writeFileSync(planFile, tsv);
  console.log(`\nDry run — no DB changes. Plan written to: ${planFile}`);
  console.log("Re-run with --apply to write; a full backup + change log will be produced first.");
}

await client.end();