export const up = (pgm) => {
  /*
   * ============================================================
   * ADD FOOD SEED FIELDS
   * ============================================================
   *
   * The large food catalog seed ships richer descriptive data
   * than the original foods table.
   *
   * Base nutrition (per 100g) already lives in:
   *   base_calories, base_protein, base_carbs, base_fat, base_fiber
   *
   * This migration adds supporting metadata and the canonical
   * "typical serving" for each food so the API can present the
   * seed's per-serving nutrition alongside the per-100g base.
   *
   * Per-serving nutrition (kcal, protein, etc.) is derived
   * at read time from the base + serving_g. See foodService.
   *
   * oil_g/oil_kcal describe the added cooking oil per serving
   * (oil_kcal = oil_g * 9).
   */

  pgm.addColumns("foods", {
    urdu_name: {
      type: "varchar(200)",
    },

    region: {
      type: "varchar(100)",
    },

    subcategory: {
      type: "varchar(150)",
    },

    image_source: {
      type: "text",
    },

    /*
     * Free-form basis string from the seed, e.g.
     * "per 1 typical serving".
     */
    nutrition_basis: {
      type: "text",
    },

    /*
     * Canonical typical serving for this food, in grams.
     */
    serving_g: {
      type: "numeric(8,2)",
    },

    /*
     * Label for that serving, e.g. "1 typical serving (150g)".
     */
    serving_label: {
      type: "varchar(200)",
    },

    /*
     * Added cooking oil per serving.
     */
    oil_g: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    /*
     * Calories contributed by that oil (oil_g * 9).
     */
    oil_kcal: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },
  });

  pgm.addConstraint(
    "foods",
    "foods_serving_g_non_negative",
    "CHECK (serving_g IS NULL OR serving_g >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_oil_g_non_negative",
    "CHECK (oil_g >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_oil_kcal_non_negative",
    "CHECK (oil_kcal >= 0)"
  );

  pgm.createIndex("foods", "region", {
    name: "idx_foods_region",
  });

  pgm.createIndex("foods", "subcategory", {
    name: "idx_foods_subcategory",
  });
};

export const down = (pgm) => {
  pgm.dropIndex("foods", "subcategory", {
    name: "idx_foods_subcategory",
  });

  pgm.dropIndex("foods", "region", {
    name: "idx_foods_region",
  });

  pgm.dropConstraint(
    "foods",
    "foods_oil_kcal_non_negative"
  );

  pgm.dropConstraint(
    "foods",
    "foods_oil_g_non_negative"
  );

  pgm.dropConstraint(
    "foods",
    "foods_serving_g_non_negative"
  );

  /*
   * Drop in the sequence added.
   */
  pgm.dropColumns("foods", [
    "urdu_name",
    "region",
    "subcategory",
    "image_source",
    "nutrition_basis",
    "serving_g",
    "serving_label",
    "oil_g",
    "oil_kcal",
  ]);
};