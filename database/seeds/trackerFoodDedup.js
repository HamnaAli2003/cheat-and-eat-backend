/*
 * trackerFoodDedup.js — canonical-row selection for the catalog dedupe.
 *
 * The catalog was seeded with the same dish once per region, producing
 * hundreds of identical rows (same name + same nutrition, only the
 * `region` differs). Migration 012 collapses every (name, category)
 * duplicate down to ONE canonical row.
 *
 * Keep priority, in order:
 *   1. Rows the frontend tracker configs map to (TRACKER_KEEP_SLUGS) —
 *      their nutrition/value set is the one we curated in 010/011.
 *   2. The "Common Across Pakistan" regional row (the national version).
 *   3. The legacy generic row (region IS NULL).
 *   4. The lowest id (any remaining region variant).
 *
 * The same priority is used to dedupe image_url: when several distinct
 * items share the same photo, the image stays on the highest-priority
 * row and is cleared from the rest, so no image is repeated.
 */

export const TRACKER_KEEP_SLUGS = [
  "chicken-biryani",
  "common-across-pakistan-curry-kebab-mutton-karahi",
  "beef-nihari",
  "common-across-pakistan-curry-kebab-butter-chicken",
  "punjab-rice-lahori-mutton-biryani",
  "common-across-pakistan-curry-kebab-seekh-kebab",
  "daal-chawal",
  "bhindi-masala",
  "aloo-gobi",
  "common-across-pakistan-curry-kebab-mutton-paye",
  "punjab-rice-lahori-beef-biryani",
  "roti",
  "plain-paratha",
  "common-across-pakistan-bread-garlic-naan",
  "common-across-pakistan-bread-puri",
  "common-across-pakistan-bread-mooli-paratha",
  "common-across-pakistan-bread-aloo-paratha",
  "chicken-pulao",
  "common-across-pakistan-snack-aloo-samosa",
  "common-across-pakistan-snack-chana-chaat",
  "common-across-pakistan-snack-dahi-bhalla",
  "common-across-pakistan-snack-gol-gappe",
  "common-across-pakistan-curry-kebab-shami-kebab",
  "common-across-pakistan-dessert-gulab-jamun",
  "common-across-pakistan-dessert-jalebi",
  "rice-kheer",
  "common-across-pakistan-dessert-ras-malai",
  "common-across-pakistan-dessert-barfi",
  "punjab-dessert-gajar-ka-halwa",
  "common-across-pakistan-dessert-sohan-halwa",
  "common-across-pakistan-dessert-seviyan",
  "common-across-pakistan-dessert-sheer-khurma",
  "mango",
  "banana",
  "common-across-pakistan-fruit-apple",
  "common-across-pakistan-fruit-orange",
  "azad-kashmir-gilgit-baltistan-fruit-guava",
  "doodh-patti-chai",
  "sweet-lassi",
  "common-across-pakistan-drink-rooh-afza",
  "halwa-puri",
  "common-across-pakistan-dessert-besan-laddu",
];

export const TRACKER_KEEP_SLUG_SET = new Set(TRACKER_KEEP_SLUGS);

/**
 * Pick the canonical row index out of a list of candidate rows that share
 * the same (name, category). Implements the keep priority documented above.
 *
 * @param {Array<{slug: string, region: string|null, id: number}>} rows
 * @returns {number} index of the canonical row
 */
export function pickKeeper(rows) {
  let best = 0;
  let bestRank = Infinity;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rank = TRACKER_KEEP_SLUG_SET.has(r.slug)
      ? 0
      : r.region === "Common Across Pakistan"
        ? 1
        : r.region == null
          ? 2
          : 3;
    if (rank < bestRank || (rank === bestRank && r.id < rows[best].id)) {
      best = i;
      bestRank = rank;
    }
  }
  return best;
}