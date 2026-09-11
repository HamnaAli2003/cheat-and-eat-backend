/*
 * ============================================================
 * COLLAPSE REMAINING DUPLICATES & PLACE-NAMED STRAWLERS
 * ============================================================
 *
 * Migration 015 removed the regional/venue catalog noise (Lahori
 * Karahi duplicates, Burns Road items, etc.). After that pass a
 * handful of things still violate the "one dish on the menu"
 * rule:
 *
 *   - second-language duplicates: "Apple" + "Apple (Saib)",
 *     "Dates" + "Dates (Khajoor)", "Grapes" + "Grape",
 *     "Onions" + "Onion", "Gajar Halwa" + "Gajrela", etc.
 *   - place/city-branded leftovers that 015 did not catch:
 *     "Hollywood Café Drinks", "Bohri Gali Drinks/Snacks",
 *     "Do Darya Snacks", "Gwadar Date", "Turbat Banana/Mango",
 *     "Dampukht Gb" (sibling of "Dampukht"), "Lahori/Keema Chawal".
 *
 * For each duplicate GROUP the row whose name already equals the
 * canonical name wins (falls back to tracker-config slug, then best
 * data, then lowest id); every other row is soft-deactivated
 * (is_active = false). Nothing is hard-deleted, so past meals keep
 * their references and the change is reversible by flipping
 * is_active back.
 *
 * Not reversible automatically: the collapsed rows carried no
 * unique information beyond the kept row.
 */

import { TRACKER_KEEP_SLUGS } from "../seeds/trackerFoodDedup.js";

/* [raw active name, canonical name] — canonical rows included too. */
const GROUPS = [
  /* ---- Fruit ---- */
  ["Apple (Saib)", "Apple"],
  ["Apple", "Apple"],
  ["Almond (Baadaam)", "Almond"],
  ["Almond", "Almond"],
  ["Apricot (Khubani)", "Apricot"],
  ["Apricot", "Apricot"],
  ["Amla (Amla)", "Amla"],
  ["Amla", "Amla"],
  ["Banana (Kela)", "Banana"],
  ["Banana", "Banana"],
  ["Bael (Bel)", "Wood Apple"],
  ["Wood Apple (Bel)", "Wood Apple"],
  ["Wood Apple", "Wood Apple"],
  ["Ber (Bor)", "Jujube"],
  ["Jujube (Bair)", "Jujube"],
  ["Jujube", "Jujube"],
  ["Cherries (Cherry)", "Cherry"],
  ["Cherry (Cherry)", "Cherry"],
  ["Cherry", "Cherry"],
  ["Coconut (Nariyal)", "Coconut"],
  ["Coconut", "Coconut"],
  ["Dates (Khajoor)", "Dates"],
  ["Dates", "Dates"],
  ["Falsa (Phalsa)", "Falsa"],
  ["Falsa", "Falsa"],
  ["Figs (Anjeer)", "Figs"],
  ["Figs", "Figs"],
  ["Grape", "Grape"],
  ["Grapes", "Grape"],
  ["Grapes (Angoor)", "Grape"],
  ["Grapefruit (Chakotra)", "Grapefruit"],
  ["Grapefruit", "Grapefruit"],
  ["Guava (Amrood)", "Guava"],
  ["Guava", "Guava"],
  ["Honeydew (Garma)", "Honeydew"],
  ["Honeydew", "Honeydew"],
  ["Jamun (Jaman)", "Jamun"],
  ["Jamun", "Jamun"],
  ["Kinnow (Kinoo)", "Kinnow"],
  ["Kinnow", "Kinnow"],
  ["Lemon (Limbu)", "Lemon"],
  ["Lemon", "Lemon"],
  ["Lychee (Litchi)", "Lychee"],
  ["Lychee", "Lychee"],
  ["Mandarin (Suntara)", "Mandarin"],
  ["Mandarin", "Mandarin"],
  ["Mango (Aam)", "Mango"],
  ["Mango", "Mango"],
  ["Mulberry (Tut)", "Mulberry"],
  ["Mulberry", "Mulberry"],
  ["Muskmelon (Kharbooz)", "Muskmelon"],
  ["Muskmelon", "Muskmelon"],
  ["Orange (Malta)", "Orange"],
  ["Orange", "Orange"],
  ["Papaya (Papeeta)", "Papaya"],
  ["Papaya", "Papaya"],
  ["Peach (Aaroo)", "Peach"],
  ["Peach", "Peach"],
  ["Pear (Nakh)", "Pear"],
  ["Pear", "Pear"],
  ["Persimmon (Amlook)", "Persimmon"],
  ["Persimmon", "Persimmon"],
  ["Plum (Aloo Bukhara)", "Plum"],
  ["Plum", "Plum"],
  ["Pomegranate (Anar)", "Pomegranate"],
  ["Pomegranate", "Pomegranate"],
  ["Quince (Bihī)", "Quince"],
  ["Quince", "Quince"],
  ["Sapodilla (Chiku)", "Sapodilla"],
  ["Sapodilla", "Sapodilla"],
  ["Sweet Lime (Mousambi)", "Sweet Lime"],
  ["Sweet Lime", "Sweet Lime"],
  ["Tamarind (Imli)", "Tamarind"],
  ["Tamarind", "Tamarind"],
  ["Walnut (Akhrot)", "Walnut"],
  ["Walnut", "Walnut"],
  ["Watermelon (Tarbooz)", "Watermelon"],
  ["Watermelon", "Watermelon"],

  /* ---- Vegetables ---- */
  ["Onions", "Onion"],
  ["Onion", "Onion"],
  ["Potatoes", "Potato"],
  ["Potato", "Potato"],
  ["Tomatoes", "Tomato"],
  ["Tomato", "Tomato"],
  ["Turnips", "Turnip"],
  ["Turnip", "Turnip"],
  ["Carrots", "Carrot"],
  ["Carrot", "Carrot"],
  ["Eggplant / Brinjal", "Eggplant"],
  ["Eggplant", "Eggplant"],
  ["Okra / Ladyfinger", "Okra"],
  ["Okra", "Okra"],
  ["Coriander Leaves", "Coriander"],
  ["Coriander", "Coriander"],
  ["Fenugreek Leaves", "Fenugreek Leaves"],
  ["Fenugreek", "Fenugreek Leaves"],
  ["Arvi (Colocasia)", "Colocasia"],
  ["Colocasia", "Colocasia"],

  /* ---- Grains, rice, desserts, drinks ---- */
  ["Plain Steamed Rice", "Plain Rice"],
  ["Plain Rice", "Plain Rice"],
  ["Pulao / Pilaf", "Pulao"],
  ["Pulao", "Pulao"],
  ["Sweet Rice (Meethe Chawal)", "Sweet Rice"],
  ["Meethe Chawal", "Sweet Rice"],
  ["Sweet Rice", "Sweet Rice"],
  ["Gajar Ka Halwa", "Gajar Halwa"],
  ["Gajrela", "Gajar Halwa"],
  ["Gajrella", "Gajar Halwa"],
  ["Gajar Halwa", "Gajar Halwa"],
  ["Firni", "Phirni"],
  ["Firni / Phirni", "Phirni"],
  ["Phirni", "Phirni"],
  ["Kheer", "Rice Kheer"],
  ["Rice Kheer", "Rice Kheer"],
  ["Zeera Rice", "Jeera Rice"],
  ["Jeera Rice", "Jeera Rice"],
  ["Biryani (Chicken/Mutton/Beef/Veg)", "Biryani"],
  ["Biryani", "Biryani"],
  ["Paratha", "Plain Paratha"],
  ["Plain Paratha", "Plain Paratha"],
  ["Lassi (Plain)", "Lassi"],
  ["Lassi", "Lassi"],
  ["Gur Ka Sharbat", "Gur Sharbat"],
  ["Gur Sharbat", "Gur Sharbat"],
  ["Jamun Ka Sharbat", "Jamun Sharbat"],
  ["Jamun Sharbat", "Jamun Sharbat"],
  ["Imli Ka Sharbat", "Imli Sharbat"],
  ["Imli Sharbat", "Imli Sharbat"],
  ["Doodh Patti", "Doodh Patti Chai"],
  ["Doodh Patti Chai", "Doodh Patti Chai"],
  ["Chai (Noon Chai)", "Noon Chai"],
  ["Noon Chai", "Noon Chai"],
  ["Mixed Shake", "Mixed Fruit Shake"],
  ["Mixed Fruit Shake", "Mixed Fruit Shake"],
  ["Pedu", "Peda"],
  ["Peda", "Peda"],
  ["Rice With Sajji", "Sajji Chawal"],
  ["Sajji Chawal", "Sajji Chawal"],
];

/* Place/city-branded rows that 015's regex did not match. */
const PLACE_NAMES = [
  "Hollywood Café Drinks",
  "Bohri Gali Drinks",
  "Bohri Gali Snacks",
  "Do Darya Snacks",
  "Gwadar Date",
  "Turbat Banana",
  "Turbat Mango",
  "Dampukht Gb",
];

export const up = (pgm) => {
  pgm.sql(`
    CREATE TEMP TABLE collapse_groups (
      raw_name text,
      canonical text
    ) ON COMMIT DROP;
    INSERT INTO collapse_groups (raw_name, canonical) VALUES
      ${GROUPS.map(([raw, canon]) => `('${raw.replace(/'/g, "''")}', '${canon.replace(/'/g, "''")}')`).join(",\n      ")};
  `);

  pgm.sql(`
    ALTER TABLE collapse_groups ADD COLUMN keep_id bigint
  `);

  pgm.sql(`
    UPDATE collapse_groups g
    SET keep_id = k.keep_id
    FROM (
      SELECT
        g2.canonical,
        FIRST_VALUE(f.id) OVER (
          PARTITION BY g2.canonical
          ORDER BY
            (LOWER(f.name) = LOWER(g2.canonical)) DESC,
            CASE WHEN f.slug IN (${TRACKER_KEEP_SLUGS.map((s) => `'${s}'`).join(", ")}) THEN 0 ELSE 1 END,
            (f.description IS NOT NULL) DESC,
            (f.image_url IS NOT NULL) DESC,
            f.id
        ) AS keep_id
      FROM collapse_groups g2
      INNER JOIN foods f ON LOWER(f.name) = LOWER(g2.raw_name)
    ) k
    WHERE k.canonical = g.canonical
      AND g.keep_id IS NULL
  `);

  pgm.sql(`
    UPDATE foods f
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    FROM collapse_groups g
    WHERE f.is_active
      AND LOWER(f.name) = LOWER(g.raw_name)
      AND f.id <> g.keep_id
  `);

  pgm.sql(`
    UPDATE foods f
    SET name = g.canonical, updated_at = CURRENT_TIMESTAMP
    FROM collapse_groups g
    WHERE f.id = g.keep_id
      AND LOWER(f.name) <> LOWER(g.canonical)
  `);

  pgm.sql(`
    UPDATE foods
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE is_active
      AND LOWER(name) IN (${PLACE_NAMES.map((n) => `'${n.toLowerCase()}'`).join(", ")})
  `);

  pgm.sql(`
    UPDATE foods
    SET name = 'Keema Chawal', updated_at = CURRENT_TIMESTAMP
    WHERE name = 'Lahori/Keema Chawal'
  `);
};

export const down = (pgm) => {
  /*
   * Not reversible automatically: collapsed rows carried no unique
   * information beyond the kept row. Restoring them would re-create
   * the duplication this migration removes.
   */
};