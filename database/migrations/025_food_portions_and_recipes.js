/*
 * ============================================================
 * 025 — FOOD PORTIONS & RECIPES
 * ============================================================
 *
 * Extends the food system for the spec-accurate calculation engine:
 *
 * 1. food_servings gains:
 *    - edible_weight_g  → nutrition grams when the whole portion includes
 *                         inedible parts (peel, seeds, rind, bone).
 *    - per_unit_g       → grams per single unit for COUNT-based servings
 *                         (e.g. "10 grapes" = 10 × ~5 g).
 *    - amount_unit  widened to also allow 'piece' and 'count' (was g/ml).
 *
 * 2. recipes + recipe_ingredients → ingredient-level recipe definitions.
 *    A recipe binds to its dish food (foods.id). Each ingredient either
 *    references an existing food row (per-100g comes from foods.*) or carries
 *    its own per-100g values (per100 JSONB) for items not in the catalog.
 *    Every recipe is flagged estimated until spot-checked against a lab plate.
 *
 * Grams remain the internal standard; per-100g values are the only source of
 * per-food nutrition.
 */

export const up = (pgm) => {
  /* ------------------------------------------------------------------ *
   * 1. food_servings — portion strategy columns
   * ------------------------------------------------------------------ */

  pgm.addColumns("food_servings", {
    /*
     * Nutrition grams when `amount` covers inedible parts too.
     * Example: "1 medium mango (300 g whole)" → amount 300, edible 200.
     */
    edible_weight_g: {
      type: "numeric(8,2)",
    },

    /*
     * Grams per single unit for count-based servings.
     * Example: "10 grapes" → amount 10, per_unit_g 5, total 50 g.
     */
    per_unit_g: {
      type: "numeric(8,2)",
    },
  });

  // Widen amount_unit to support piece/count portion strategies.
  pgm.dropConstraint("food_servings", "food_servings_amount_unit_check");
  pgm.addConstraint(
    "food_servings",
    "food_servings_amount_unit_check",
    "CHECK (amount_unit IN ('g', 'ml', 'piece', 'count'))"
  );

  pgm.addConstraint(
    "food_servings",
    "food_servings_count_unit_has_per_unit",
    "CHECK (amount_unit <> 'count' OR per_unit_g IS NOT NULL)"
  );

  pgm.addConstraint(
    "food_servings",
    "food_servings_edible_positive",
    "CHECK (edible_weight_g IS NULL OR edible_weight_g > 0)"
  );

  pgm.addConstraint(
    "food_servings",
    "food_servings_per_unit_positive",
    "CHECK (per_unit_g IS NULL OR per_unit_g > 0)"
  );

  /* ------------------------------------------------------------------ *
   * 2. recipes — a dish food may have one ingredient-based recipe
   * ------------------------------------------------------------------ */

  pgm.createTable("recipes", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    food_id: {
      type: "bigint",
      notNull: true,
      unique: true,
      references: "foods",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    name: {
      type: "varchar(150)",
      notNull: true,
    },

    description: {
      type: "text",
    },

    /*
     * How many eaters the listed ingredient quantities produce.
     */
    default_servings: {
      type: "numeric(6,2)",
      notNull: true,
      default: 1,
    },

    /*
     * true until the recipe has been verified against a weighed preparation.
     * UI should present recipe totals as estimates when this is true.
     */
    estimated: {
      type: "boolean",
      notNull: true,
      default: true,
    },

    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
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

  /* ------------------------------------------------------------------ *
   * 3. recipe_ingredients
   * ------------------------------------------------------------------ */

  pgm.createTable("recipe_ingredients", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    recipe_id: {
      type: "bigint",
      notNull: true,
      references: "recipes",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    /*
     * Optional link to an existing food row. When present, per-100g values
     * come from foods.base_* (authoritative). Otherwise per100 must be set.
     */
    food_id: {
      type: "bigint",
      references: "foods",
      onDelete: "set null",
      onUpdate: "cascade",
    },

    name: {
      type: "varchar(150)",
      notNull: true,
    },

    /*
     * Quantity of the ingredient. For 'g'/'ml' this is grams/ml; for
     * 'count' it is the number of pieces (grams come from per100 only, so
     * count pieces are converted via per100 × 1 average piece weight —
     * engines should use the food's servings per_unit_g when linked).
     */
    quantity: {
      type: "numeric(8,2)",
      notNull: true,
    },

    unit: {
      type: "varchar(10)",
      notNull: true,
      default: "g",
    },

    /*
     * Self-contained per-100g nutrition for ingredients not in the catalog.
     * Shape: { calories, protein, carbs, fat, fiber }.
     */
    per100: {
      type: "jsonb",
    },

    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    is_optional: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint(
    "recipe_ingredients",
    "recipe_ingredients_quantity_positive",
    "CHECK (quantity > 0)"
  );

  pgm.addConstraint(
    "recipe_ingredients",
    "recipe_ingredients_unit_check",
    "CHECK (unit IN ('g', 'ml', 'piece', 'count'))"
  );

  pgm.addConstraint(
    "recipe_ingredients",
    "recipe_ingredients_food_or_per100",
    "CHECK (food_id IS NOT NULL OR per100 IS NOT NULL)"
  );

  pgm.createIndex("recipe_ingredients", "recipe_id", {
    name: "idx_recipe_ingredients_recipe_id",
  });
};

export const down = (pgm) => {
  pgm.dropTable("recipe_ingredients");
  pgm.dropTable("recipes");

  pgm.dropConstraint("food_servings", "food_servings_per_unit_positive");
  pgm.dropConstraint("food_servings", "food_servings_edible_positive");
  pgm.dropConstraint("food_servings", "food_servings_count_unit_has_per_unit");
  pgm.dropConstraint("food_servings", "food_servings_amount_unit_check");
  pgm.addConstraint(
    "food_servings",
    "food_servings_amount_unit_check",
    "CHECK (amount_unit IN ('g', 'ml'))"
  );

  pgm.dropColumns("food_servings", ["per_unit_g", "edible_weight_g"]);
};