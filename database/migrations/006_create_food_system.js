export const up = (pgm) => {
  /*
   * ============================================================
   * FOOD CATEGORIES
   * ============================================================
   *
   * Examples:
   * Rice, Meat, Daal, Sabzi, Bread, Fruit, Drink, Sweet, Combo
   *
   * These are categories, NOT individual food configuration.
   */
  pgm.createTable("food_categories", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    name: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },

    slug: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  /*
   * ============================================================
   * FOODS
   * ============================================================
   *
   * Nutrition is stored per 100g.
   *
   * This gives us a consistent internal calculation base.
   *
   * Example:
   * Plain Rice:
   *   calories = 130
   *   protein  = 2.7
   *   carbs    = 28
   *   fat      = 0.3
   *
   * A serving can then define its actual grams.
   */
  pgm.createTable("foods", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    category_id: {
      type: "bigint",
      notNull: true,
      references: "food_categories",
      onDelete: "restrict",
      onUpdate: "cascade",
    },

    name: {
      type: "varchar(150)",
      notNull: true,
    },

    slug: {
      type: "varchar(180)",
      notNull: true,
      unique: true,
    },

    description: {
      type: "text",
    },

    image_url: {
      type: "text",
    },

    /*
     * Base nutrition per 100g.
     */
    base_calories: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    base_protein: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    base_carbs: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    base_fat: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    base_fiber: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    /*
     * Allows us to hide a food without deleting it.
     */
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

  /*
   * ============================================================
   * FOOD SERVINGS
   * ============================================================
   *
   * This defines how users normally select a food.
   *
   * Examples:
   *
   * Plain Rice:
   *   1 small bowl = 150g
   *   1 medium bowl = 200g
   *   1 large bowl = 300g
   *
   * Mango:
   *   1 small = food-specific grams
   *   1 medium = food-specific grams
   *
   * Drink:
   *   250ml
   *   500ml
   *
   * We NEVER assume universal grams.
   */
  pgm.createTable("food_servings", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    food_id: {
      type: "bigint",
      notNull: true,
      references: "foods",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    name: {
      type: "varchar(100)",
      notNull: true,
    },

    unit: {
      type: "varchar(30)",
      notNull: true,
    },

    /*
     * Actual base weight/volume represented by this serving.
     *
     * For solids this is normally grams.
     * For drinks this can be ml.
     */
    amount: {
      type: "numeric(8,2)",
      notNull: true,
    },

    /*
     * g or ml
     */
    amount_unit: {
      type: "varchar(10)",
      notNull: true,
    },

    /*
     * Useful for ordering UI:
     * Small -> Medium -> Large
     */
    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    is_default: {
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

  /*
   * ============================================================
   * FOOD OPTIONS
   * ============================================================
   *
   * These are optional configurable attributes.
   *
   * Examples:
   *
   * oil
   * sugar
   * meat_type
   * meat_cut
   * topping
   * ghee
   *
   * A food only gets the options that actually apply to it.
   */
  pgm.createTable("food_options", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    food_id: {
      type: "bigint",
      notNull: true,
      references: "foods",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    key: {
      type: "varchar(80)",
      notNull: true,
    },

    label: {
      type: "varchar(100)",
      notNull: true,
    },

    input_type: {
      type: "varchar(30)",
      notNull: true,
    },

    is_required: {
      type: "boolean",
      notNull: true,
      default: false,
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
  });

  /*
   * ============================================================
   * FOOD OPTION VALUES
   * ============================================================
   *
   * Actual choices for an option.
   *
   * Example:
   *
   * food_option:
   *   key = oil
   *
   * values:
   *   none
   *   less
   *   normal
   *   extra
   *
   * Nutritional changes belong to the value.
   */
  pgm.createTable("food_option_values", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    option_id: {
      type: "bigint",
      notNull: true,
      references: "food_options",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    key: {
      type: "varchar(80)",
      notNull: true,
    },

    label: {
      type: "varchar(100)",
      notNull: true,
    },

    /*
     * Nutrition delta for this option value.
     *
     * Example:
     * Extra oil can add calories + fat.
     *
     * These are absolute values for the selected option,
     * not percentages.
     */
    calories_delta: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    protein_delta: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    carbs_delta: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    fat_delta: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    fiber_delta: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    /*
     * Optional standardized quantity.
     *
     * Example:
     * oil = 10g
     */
    amount: {
      type: "numeric(8,2)",
    },

    amount_unit: {
      type: "varchar(10)",
    },

    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    is_default: {
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

  /*
   * ============================================================
   * FOOD COMPONENTS
   * ============================================================
   *
   * Used for combo/mixed foods.
   *
   * Example:
   *
   * Daal Chawal
   *   -> Daal
   *   -> Rice
   *
   * Halwa Puri
   *   -> Halwa
   *   -> Puri
   *
   * This is NOT limited to one specific combo.
   */
  pgm.createTable("food_components", {
    id: {
      type: "bigint",
      primaryKey: true,
    },

    food_id: {
      type: "bigint",
      notNull: true,
      references: "foods",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    component_food_id: {
      type: "bigint",
      notNull: true,
      references: "foods",
      onDelete: "restrict",
      onUpdate: "cascade",
    },

    name: {
      type: "varchar(100)",
      notNull: true,
    },

    unit: {
      type: "varchar(30)",
      notNull: true,
    },

    default_amount: {
      type: "numeric(8,2)",
      notNull: true,
    },

    amount_unit: {
      type: "varchar(10)",
      notNull: true,
    },

    min_amount: {
      type: "numeric(8,2)",
    },

    max_amount: {
      type: "numeric(8,2)",
    },

    step_amount: {
      type: "numeric(8,2)",
    },

    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    is_required: {
      type: "boolean",
      notNull: true,
      default: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  /*
   * ============================================================
   * FOOD METADATA
   * ============================================================
   *
   * Additional descriptive information.
   */
  pgm.createTable("food_metadata", {
    food_id: {
      type: "bigint",
      primaryKey: true,
      references: "foods",
      onDelete: "cascade",
      onUpdate: "cascade",
    },

    cooking_method: {
      type: "varchar(100)",
    },

    ingredients: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },

    tags: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },

    notes: {
      type: "text",
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
   * ============================================================
   * CONSTRAINTS
   * ============================================================
   */

  pgm.addConstraint(
    "foods",
    "foods_base_calories_non_negative",
    "CHECK (base_calories >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_base_protein_non_negative",
    "CHECK (base_protein >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_base_carbs_non_negative",
    "CHECK (base_carbs >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_base_fat_non_negative",
    "CHECK (base_fat >= 0)"
  );

  pgm.addConstraint(
    "foods",
    "foods_base_fiber_non_negative",
    "CHECK (base_fiber >= 0)"
  );

  pgm.addConstraint(
    "food_servings",
    "food_servings_amount_positive",
    "CHECK (amount > 0)"
  );

  pgm.addConstraint(
    "food_servings",
    "food_servings_amount_unit_check",
    "CHECK (amount_unit IN ('g', 'ml'))"
  );

  pgm.addConstraint(
    "food_option_values",
    "food_option_values_amount_positive",
    "CHECK (amount IS NULL OR amount > 0)"
  );

  pgm.addConstraint(
    "food_components",
    "food_components_default_amount_positive",
    "CHECK (default_amount > 0)"
  );

  pgm.addConstraint(
    "food_components",
    "food_components_amount_unit_check",
    "CHECK (amount_unit IN ('g', 'ml', 'piece', 'serving'))"
  );

  /*
   * ============================================================
   * UNIQUE CONSTRAINTS
   * ============================================================
   */

  pgm.addConstraint(
    "food_servings",
    "food_servings_food_name_unique",
    "UNIQUE (food_id, name)"
  );

  pgm.addConstraint(
    "food_options",
    "food_options_food_key_unique",
    "UNIQUE (food_id, key)"
  );

  pgm.addConstraint(
    "food_option_values",
    "food_option_values_option_key_unique",
    "UNIQUE (option_id, key)"
  );

  pgm.addConstraint(
    "food_components",
    "food_components_food_component_unique",
    "UNIQUE (food_id, component_food_id)"
  );

  /*
   * ============================================================
   * INDEXES
   * ============================================================
   */

  pgm.createIndex("foods", "category_id", {
    name: "idx_foods_category_id",
  });

  pgm.createIndex("foods", "is_active", {
    name: "idx_foods_is_active",
  });

  pgm.createIndex("foods", "name", {
    name: "idx_foods_name",
  });

  pgm.createIndex("food_servings", "food_id", {
    name: "idx_food_servings_food_id",
  });

  pgm.createIndex("food_options", "food_id", {
    name: "idx_food_options_food_id",
  });

  pgm.createIndex("food_option_values", "option_id", {
    name: "idx_food_option_values_option_id",
  });

  pgm.createIndex("food_components", "food_id", {
    name: "idx_food_components_food_id",
  });

  pgm.createIndex("food_components", "component_food_id", {
    name: "idx_food_components_component_food_id",
  });

  /*
   * PostgreSQL doesn't use a normal B-tree index efficiently
   * for arbitrary ILIKE '%search%'.
   *
   * For the first version we'll keep name indexed.
   * Later, if the catalog becomes very large, we'll add
   * pg_trgm/full-text search deliberately.
   */
};

export const down = (pgm) => {
  /*
   * Drop in reverse dependency order.
   */
  pgm.dropTable("food_metadata");
  pgm.dropTable("food_components");
  pgm.dropTable("food_option_values");
  pgm.dropTable("food_options");
  pgm.dropTable("food_servings");
  pgm.dropTable("foods");
  pgm.dropTable("food_categories");
};