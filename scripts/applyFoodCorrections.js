import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

/*
 * ============================================================
 * FOOD CORRECTIONS (wrong/mismatched images, descriptions)
 * ============================================================
 *
 * Applies the manifest in scripts/corrections/food-corrections.json.
 * Two kinds of changes are supported:
 *   1. image_clears  -> set image_url = NULL, image_source = NULL and
 *                       record that URL in scripts/.forbidden_images.json
 *                       so the assignment pipeline can never re-add it.
 *   2. description_fixes -> overwrite the food's description text.
 *
 * Data safety:
 *   - Always writes a full backup snapshot before any change.
 *   - Never touches is_active, region, category, nutrition or slugs.
 *   - Without `--apply` this is a DRY RUN only.
 *
 * Usage:
 *   node applyFoodCorrections.js             # dry-run plan
 *   node applyFoodCorrections.js --apply     # backup + apply + log
 */

const APPLY = process.argv.includes("--apply");
const OUT_DIR = "reports/audit";

fs.mkdirSync(OUT_DIR, { recursive: true });

const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const manifest = JSON.parse(fs.readFileSync("scripts/corrections/food-corrections.json", "utf8"));
const { rows } = await client.query(
  `SELECT id, name, image_url, image_source, description, is_active FROM foods ORDER BY id`
);
const byId = new Map(rows.map((r) => [String(r.id), r]));

// ----- resolve plan ----------------------------------------------------------
const clears = [];
for (const c of manifest.image_clears) {
  const r = byId.get(String(c.id));
  if (!r) {
    console.log(`[WARN] image_clear id ${c.id} ("${c.name}") not found in foods — skipped`);
    continue;
  }
  clears.push({
    id: r.id,
    name: r.name,
    currentUrl: r.image_url,
    currentSource: r.image_source,
    reason: c.reason,
    active: r.is_active,
  });
}

const descFixes = [];
for (const [id, text] of Object.entries(manifest.description_fixes || {})) {
  const r = byId.get(String(id));
  if (!r) {
    console.log(`[WARN] description_fix id ${id} not found — skipped`);
    continue;
  }
  descFixes.push({ id: r.id, name: r.name, old: r.description, next: text, active: r.is_active });
}

console.log("=== CORRECTION PLAN (dry-run preview) ===");
let clearCount = 0;
for (const c of clears) {
  if (c.currentUrl) {
    clearCount += 1;
    console.log(`  CLEAR  ${c.id} ${c.name.padEnd(22)} ${(c.currentUrl || "").slice(0, 60)}`);
  } else {
    console.log(`  CLEAR  ${c.id} ${c.name.padEnd(22)} (already NULL — no-op)`);
  }
}
for (const d of descFixes) {
  console.log(`  DESCFIX ${d.id} ${d.name.padEnd(22)} "${String(d.old || "").slice(0, 50)}" -> "${String(d.next).slice(0, 50)}"`);
}
console.log(`Plan: ${clearCount} image clears will write | ${descFixes.length} description fixes`);

if (!APPLY) {
  console.log("\nDry run — no DB changes. Re-run with --apply to write (backup + change log produced first).");
  await client.end();
  process.exit(0);
}

// ----- backup ----------------------------------------------------------------
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(OUT_DIR, `_correction_backup.${stamp}.json`);
fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
console.log(`\n[APPLY] backup: ${backupFile}`);

// forbidden map: name -> [urls] (merge with existing)
const FORBIDDEN_FILE = "scripts/.forbidden_images.json";
let forbidden = {};
try {
  forbidden = JSON.parse(fs.readFileSync(FORBIDDEN_FILE, "utf8"));
} catch {}

const log = [];
await client.query("BEGIN");
try {
  for (const c of clears) {
    if (!c.currentUrl) continue;
    await client.query(
      `UPDATE foods SET image_url = NULL, image_source = NULL WHERE id = $1`,
      [c.id]
    );
    forbidden[c.name] = [...new Set([...(forbidden[c.name] || []), c.currentUrl])];
    log.push({ id: c.id, name: c.name, kind: "image_clear", old: c.currentUrl, next: "NULL", reason: c.reason });
  }
  for (const d of descFixes) {
    await client.query(`UPDATE foods SET description = $1 WHERE id = $2`, [d.next, d.id]);
    log.push({ id: d.id, name: d.name, kind: "description", old: d.old, next: d.next, reason: "reviewer description fix" });
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
}

fs.writeFileSync(FORBIDDEN_FILE, JSON.stringify(forbidden, null, 2));

const logFile = path.join(OUT_DIR, "correction-change-log.csv");
const logLines = [
  ["id", "name", "kind", "old", "new", "reason"].join(","),
  ...log.map((r) => [r.id, r.name, r.kind, esc(r.old), esc(r.next), esc(r.reason)].join(",")),
].join("\n");
fs.writeFileSync(logFile, logLines);

console.log(`[APPLY] changes: ${log.length} | log: ${logFile}`);
console.log(`[APPLY] forbidden images map updated: ${Object.keys(forbidden).length} foods`);

await client.end();