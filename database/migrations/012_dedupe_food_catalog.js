/*
 * ============================================================
 * DEDUPE FOOD CATALOG
 * ============================================================
 *
 * The seed shipped the same dish once per region (e.g. Aloo Paratha in
 * all six regions plus the national version), so searches and rails
 * repeated identical items. This collapses every (name, category)
 * duplicate group to ONE canonical row using the priority from
 * trackerFoodDedup.js:
 *
 *   1. rows the frontend tracker configs map to (TRACKER_KEEP_SLUGS),
 *   2. the "Common Across Pakistan" row,
 *   3. the legacy null-region row,
 *   4. the lowest id.
 *
 * It also clears image_url on every row that shares its photo with a
 * higher-priority surviving row, so a single image is never repeated
 * across distinct items.
 *
 * food_components referencing a doomed row are removed first
 * (component_food_id has ON DELETE RESTRICT). All other child rows
 * (servings, metadata, options) cascade. Applied by migration 012.
 */

import { TRACKER_KEEP_SLUGS } from "../seeds/trackerFoodDedup.js";

const KEEP_PRIORITY = `
  CASE
    WHEN f.slug IN (${TRACKER_KEEP_SLUGS.map((s) => `'${s}'`).join(", ")}) THEN 0
    WHEN f.region = 'Common Across Pakistan' THEN 1
    WHEN f.region IS NULL THEN 2
    ELSE 3
  END
`;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TEMP TABLE food_keeper ON COMMIT DROP AS
    SELECT name, category_id
    FROM foods
    GROUP BY name, category_id
    HAVING COUNT(*) > 1
  `);

  pgm.sql(`
    ALTER TABLE food_keeper ADD COLUMN keep_id bigint
  `);

  pgm.sql(`
    UPDATE food_keeper k
    SET keep_id = (
      SELECT f.id
      FROM foods f
      WHERE f.name = k.name
        AND f.category_id = k.category_id
      ORDER BY ${KEEP_PRIORITY}, f.id
      LIMIT 1
    )
  `);

  pgm.sql(`
    DELETE FROM food_components
    WHERE component_food_id IN (
      SELECT f.id
      FROM foods f
      JOIN food_keeper k
        ON k.name = f.name
       AND k.category_id = f.category_id
      WHERE f.id <> k.keep_id
    )
  `);

  pgm.sql(`
    DELETE FROM foods f
    USING food_keeper k
    WHERE k.name = f.name
      AND k.category_id = f.category_id
      AND f.id <> k.keep_id
  `);

  pgm.sql(`
    UPDATE foods f
    SET image_url = NULL
    WHERE f.image_url IS NOT NULL
      AND f.id <> (
        SELECT f2.id
        FROM foods f2
        WHERE f2.image_url = f.image_url
        ORDER BY
          CASE
            WHEN f2.slug IN (${TRACKER_KEEP_SLUGS.map((s) => `'${s}'`).join(", ")}) THEN 0
            ELSE 1
          END,
          f2.id
        LIMIT 1
      )
  `);
};

export const down = (pgm) => {
  /*
   * Not reversible: deleted rows carried no unique information beyond the
   * kept canonical row, and re-inserting 700 exact copies would restore the
   * duplication this migration removes.
   */
};