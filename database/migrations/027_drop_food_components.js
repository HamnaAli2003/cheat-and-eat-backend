export const up = (pgm) => {
  /*
   * ============================================================
   * DROP FOOD COMPONENTS
   * ============================================================
   *
   * The food_components table (created in migration 006) was meant
   * to model combo/mixed dishes (e.g. Daal Chawal -> Daal + Rice).
   *
   * It is empty (0 rows) and unused: the frontend's combo system is
   * driven entirely by the local tracker config (src/data/food.js),
   * and normalizeBackendFood never maps this table's rows into the
   * tracker shape. Dropping it removes dead weight from the schema.
   */

  pgm.dropTable("food_components", {
    // cascade: also drop the indexes / FK-dependent objects created on it
    cascade: false,
  });
};

export const down = (pgm) => {
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

  pgm.sql(`
    ALTER TABLE "food_components"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

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

  pgm.addConstraint(
    "food_components",
    "food_components_food_component_unique",
    "UNIQUE (food_id, component_food_id)"
  );

  pgm.createIndex("food_components", "food_id", {
    name: "idx_food_components_food_id",
  });

  pgm.createIndex("food_components", "component_food_id", {
    name: "idx_food_components_component_food_id",
  });
};