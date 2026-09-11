export const up = (pgm) => {
  /*
   * ============================================================
   * HEALTH FORMULAS
   * ============================================================
   *
   * Source of truth for the body-stat / goal math that the
   * frontend (src/utils/health.js) currently hard-codes:
   *
   *   - Mifflin-St Jeor BMR
   *   - TDEE (BMR × activity multiplier)
   *   - BMI + categories
   *   - Ideal weight (Devine / Robinson / Miller blend)
   *   - Safe calorie floors
   *   - 7,700 kcal per kg of body fat
   *   - Activity multipliers
   *
   * Storing them in the database lets the API serve the exact
   * formulas, constants and parameters the app uses, while
   * keeping a single editable reference.
   */

  pgm.createTable("health_formulas", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    /*
     * Stable machine key, e.g. "bmr", "tdee", "bmi".
     */
    key: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },

    /*
     * Human-readable title, e.g. "BMR — Mifflin-St Jeor".
     */
    name: {
      type: "varchar(200)",
      notNull: true,
    },

    /*
     * Grouping, e.g. "calorie", "weight", "safety", "activity".
     */
    category: {
      type: "varchar(100)",
      notNull: true,
    },

    description: {
      type: "text",
    },

    /*
     * Human-readable formula/expression.
     */
    formula: {
      type: "text",
    },

    /*
     * Parameter names the formula expects.
     */
    params: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },

    /*
     * Named constants / lookup tables used by the formula.
     */
    constants: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },

    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  /*
   * The original createTable identity option does not emit a real
   * PostgreSQL identity column (see migration 007), so add it
   * explicitly.
   */
  pgm.sql(`
    ALTER TABLE "health_formulas"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);
};

export const down = (pgm) => {
  pgm.dropTable("health_formulas");
};