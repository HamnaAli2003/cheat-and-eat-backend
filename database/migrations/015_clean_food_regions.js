/*
 * ============================================================
 * CLEAN FOOD CATALOG (regions, venue items, duplicates, images)
 * ============================================================
 *
 * The large catalog was seeded like a restaurant menu — every dish
 * repeated once per region (Lahori/Sindhi/Peshawari/Quetta/Karachi/
 * Balochi/Kashmiri/Swat/Multani variants) plus venue/brand-named
 * items (Burns Road, Food Street, Fort Road, Jinnah Road, Qissa
 * Khwani, Anarkali Bazaar, Port Grand, Sarafi, Charsi...). A calorie
 * tracker should not behave like that, so this migration:
 *
 *   1. DEACTIVATES venue/brand-named rows (is_active = false).
 *   2. STRIPS region/city prefixes from names and collapses each
 *      cleaned-name group (e.g. "Naan", "Sindhi Naan", "Lahori
 *      Naan", "Quetta Naan"...) to ONE canonical kept row, renaming
 *      it to the plain dish name. Keeper priority:
 *        - row whose name already equals the cleaned name,
 *        - has a description,
 *        - has an image,
 *        - was the "Common Across Pakistan" row,
 *        - lowest id.
 *      Other rows in the group are deactivated (soft delete), so
 *      meals that reference them keep their references.
 *   3. NULLS the region column everywhere (the region dropdown and
 *      region filter only list non-null regions, so they empty out
 *      with zero frontend changes).
 *   4. NULLS irrelevant or wrong images: any photo shared by more
 *      than one active food, and any whose source title is clearly
 *      not food (lighthouse, coat of arms, people, laboratory
 *      photos, plants, band photos, etc.). What remains are
 *      single-use, food-specific photos.
 *   5. REBUILDS tags on food_metadata to the cultural set
 *      ["desi", "pakistani", <category slug>] — dropping region
 *      tokens and any nutrition/nutrient-style tags — and clears
 *      empty ingredients arrays ([] -> NULL).
 *   6. NULLS obviously wrong descriptions (mangled text, or a
 *      description that merely repeats the name).
 *
 * Slug is left untouched (unique, stable) so nothing else breaks.
 *
 * Not reversible: collapsed rows carried no unique information
 * beyond the kept canonical row, and restoring 100+ regional copies
 * would re-create the duplication this migration removes.
 */

const VENUE_RE =
  "burns road|food street|jinnah road|fort road|qissa khwani|" +
  "anarkali bazaar|port grand|sarafi|charsi";

const REGION_FIRST_WORD =
  "lahore|lahori|sindhi|sindh|peshawari|peshwari|peshawar|" +
  "quetta|balochi|balochistan|karachi|multani|kashmiri|swat|" +
  "gilgit|gb|murree|muree|azad|khyber";

const BAD_IMAGE_RE = [
  "coat of arms",
  "lighthouse",
  "hashim",
  "black eyed peas",
  "karlie",
  "zakheera",
  "arvis",
  "titration",
  "makra",
  "khush mahal",
  "beetle on flower",
  "dorymyrmex",
  "brunneus",
  "maxillaria",
  "yarg",
  "smashing pumpkins",
  "600px horizontal",
].join("|");

export const up = (pgm) => {
  /*
   * 0. Allow ingredients to be NULL so empty ingredient lists are
   * dropped entirely instead of being stored as '[]'::jsonb.
   */
  pgm.sql(`
    ALTER TABLE food_metadata
      ALTER COLUMN ingredients DROP NOT NULL,
      ALTER COLUMN ingredients SET DEFAULT NULL
  `);

  /* 1. Deactivate venue/brand-named rows. */
  pgm.sql(`
    UPDATE foods
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE is_active
      AND LOWER(name) ~ '${VENUE_RE}'
  `);

  /* 2. Rename keepers and deactivate duplicate regions. */
  pgm.sql(`
    CREATE TEMP TABLE food_catalog_cleanup ON COMMIT DROP AS
    SELECT
      f.id,
      f.name,
      f.description,
      f.image_url,
      f.region,
      REGEXP_REPLACE(
        LOWER(f.name),
        '^(${REGION_FIRST_WORD})\\s+',
        ''
      ) AS cleaned,
      (LOWER(f.name) = REGEXP_REPLACE(
        LOWER(f.name),
        '^(${REGION_FIRST_WORD})\\s+',
        ''
      )) AS is_base
    FROM foods f
    WHERE f.is_active
  `);

  pgm.sql(`
    ALTER TABLE food_catalog_cleanup ADD COLUMN keep_id bigint
  `);

  pgm.sql(`
    UPDATE food_catalog_cleanup c
    SET keep_id = q.keep_id
    FROM (
      SELECT
        id,
        FIRST_VALUE(id) OVER (
          PARTITION BY cleaned
          ORDER BY
            is_base DESC,
            (description IS NOT NULL) DESC,
            (image_url IS NOT NULL) DESC,
            (region = 'Common Across Pakistan') DESC,
            id
        ) AS keep_id
      FROM food_catalog_cleanup
    ) q
    WHERE c.id = q.id
  `);

  pgm.sql(`
    UPDATE foods f
    SET name = INITCAP(c.cleaned),
        region = NULL,
        updated_at = CURRENT_TIMESTAMP
    FROM food_catalog_cleanup c
    WHERE c.id = f.id
      AND c.id = c.keep_id
  `);

  pgm.sql(`
    UPDATE foods f
    SET is_active = false,
        updated_at = CURRENT_TIMESTAMP
    FROM food_catalog_cleanup c
    WHERE c.id = f.id
      AND c.id <> c.keep_id
  `);

  /* 3. Drop the region concept entirely. */
  pgm.sql(`
    UPDATE foods
    SET region = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE region IS NOT NULL
  `);

  /* 4. Null shared and obviously non-food images. */
  pgm.sql(`
    UPDATE foods f
    SET image_url = NULL, image_source = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE f.is_active
      AND f.image_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM foods f2
        WHERE f2.image_url = f.image_url
          AND f2.id <> f.id
          AND f2.is_active
      )
  `);

  pgm.sql(`
    UPDATE foods
    SET image_url = NULL, image_source = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE is_active
      AND image_source IS NOT NULL
      AND LOWER(image_source) ~ '${BAD_IMAGE_RE}'
  `);

  /* 5. Cultural tags + clear empty ingredient arrays. */
  pgm.sql(`
    UPDATE food_metadata m
    SET tags = to_jsonb(ARRAY['desi', 'pakistani', c.slug]),
        ingredients = CASE
          WHEN jsonb_array_length(m.ingredients) = 0 THEN NULL
          ELSE m.ingredients
        END,
        updated_at = CURRENT_TIMESTAMP
    FROM foods f
    JOIN food_categories c ON c.id = f.category_id
    WHERE f.is_active
      AND m.food_id = f.id
  `);

  /* 6. Null obviously wrong descriptions. */
  pgm.sql(`
    UPDATE foods
    SET description = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE is_active
      AND (
        LOWER(description) = LOWER(name)
        OR description = 'Watermelon ke chotay tamatar'
      )
  `);
};

export const down = (pgm) => {
  /*
   * Not reversible: collapsed rows carried no unique information
   * beyond the kept canonical row, and re-inserting 100+ regional
   * copies would restore the duplication this migration removes.
   */
};