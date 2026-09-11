export const up = (pgm) => {
  /*
   * ============================================================
   * ADD MEAT GRAMS TO FOODS
   * ============================================================
   *
   * Standard approximate meat weight per serving for gravies /
   * meat dishes (e.g. Bong Paye 120g, Mutton Paye 100g, Beef Paye
   * 100g). Mirrors oil_g/oil_kcal: it is stored per serving and
   * exposed to the frontend so the UI can show a "meat (approx)"
   * figure alongside the protein macro.
   */

  pgm.addColumns("foods", {
    /*
     * Approximate meat weight per serving, in grams.
     */
    meat_grams: {
      type: "numeric(8,2)",
    },
  });

  pgm.addConstraint(
    "foods",
    "foods_meat_grams_non_negative",
    "CHECK (meat_grams IS NULL OR meat_grams >= 0)"
  );
};

export const down = (pgm) => {
  pgm.dropConstraint("foods", "foods_meat_grams_non_negative");

  pgm.dropColumns("foods", ["meat_grams"]);
};