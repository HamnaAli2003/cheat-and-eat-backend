/*
 * ============================================================
 * FIX TRACKER FOOD ACCURACY
 * ============================================================
 *
 * Corrects accurate/non-placeholder nutrition for the foods the
 * frontend tracker acts on, driven by TRACKER_FOOD_FIXES.
 *
 *  - The combo rows Daal Chawal / Halwa Puri were 0 kcal on all
 *    macros (placeholders).
 *  - Distinct foods that shared copy-paste templates now get their
 *    real per-100g values (Puri vs Aloo Paratha, Sohan Halwa vs
 *    Gajar ka Halwa, Gol Gappe vs Dahi Bhalla, Apple/Orange/Guava).
 *  - Rows with NULL serving_g get a canonical typical serving so the
 *    API no longer falls back to a 100g serving silently.
 *
 * Base nutrition stays per 100g, as prepared; oil_g/oil_kcal remain
 * descriptive per-serving values.
 */

import { TRACKER_FOOD_FIXES } from "../seeds/trackerFoodFixes.js";

export const up = (pgm) => {
  for (const [slug, fix] of Object.entries(TRACKER_FOOD_FIXES)) {
    pgm.sql(
      `
        UPDATE foods
        SET
          base_calories = ${fix.baseCalories},
          base_protein = ${fix.baseProtein},
          base_carbs = ${fix.baseCarbs},
          base_fat = ${fix.baseFat},
          serving_g = ${fix.servingG},
          serving_label = ${`'${fix.servingLabel}'`},
          oil_g = ${fix.oilG},
          oil_kcal = ${fix.oilKcal},
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = '${slug}'
      `
    );
  }
};

export const down = (pgm) => {
  /*
   * Accuracy corrections are not reversible: prior values were
   * placeholders/templates and are intentionally replaced. Keeping a
   * no-op down avoids half-restoring pre-migration data.
   */
};