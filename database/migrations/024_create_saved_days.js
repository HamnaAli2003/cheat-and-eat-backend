export const up = (pgm) => {
  pgm.createTable("saved_days", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    eaten_on: {
      type: "date",
      notNull: true,
    },

    calories: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    protein: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    carbs: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    fat: {
      type: "numeric(8,2)",
      notNull: true,
      default: 0,
    },

    fiber: {
      type: "numeric(8,2)",
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

  pgm.addConstraint("saved_days", "saved_days_unique_user_date", {
    unique: ["user_id", "eaten_on"],
  });

  pgm.addConstraint("saved_days", "saved_days_calories_non_negative_check", {
    check: "calories >= 0",
  });

  pgm.addConstraint("saved_days", "saved_days_macros_non_negative_check", {
    check: "protein >= 0 AND carbs >= 0 AND fat >= 0 AND fiber >= 0",
  });

  pgm.createIndex("saved_days", ["user_id", "eaten_on"]);
};

export const down = (pgm) => {
  pgm.dropTable("saved_days");
};