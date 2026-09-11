export const up = (pgm) => {
  pgm.createTable("meals", {
    id: {
      type: "bigint",
      primaryKey: true,
      generated: "always",
      identity: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    food_id: {
      type: "bigint",
      notNull: false,
      references: '"foods"',
      onDelete: "SET NULL",
    },

    name: {
      type: "varchar(200)",
      notNull: true,
    },

    image_url: {
      type: "text",
      notNull: false,
    },

    portion: {
      type: "varchar(200)",
      notNull: false,
    },

    meal_type: {
      type: "varchar(20)",
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

    eaten_on: {
      type: "date",
      notNull: true,
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

  pgm.addConstraint("meals", "meals_meal_type_check", {
    check: "meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')",
  });

  pgm.addConstraint("meals", "meals_calories_non_negative_check", {
    check: "calories >= 0",
  });

  pgm.addConstraint("meals", "meals_macros_non_negative_check", {
    check: "protein >= 0 AND carbs >= 0 AND fat >= 0 AND fiber >= 0",
  });

  pgm.createIndex("meals", ["user_id", "eaten_on", "id"]);

  pgm.createTable("daily_tips", {
    id: {
      type: "bigint",
      primaryKey: true,
      generated: "always",
      identity: true,
    },

    text: {
      type: "text",
      notNull: true,
    },

    icon: {
      type: "varchar(20)",
      notNull: false,
    },

    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
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

  pgm.createTable("goal_changes", {
    id: {
      type: "bigint",
      primaryKey: true,
      generated: "always",
      identity: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    daily_calorie_goal: {
      type: "integer",
      notNull: true,
    },

    changed_on: {
      type: "date",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint("goal_changes", "goal_changes_goal_check", {
    check: "daily_calorie_goal > 0",
  });

  pgm.createIndex("goal_changes", ["user_id", "changed_on"]);
};

export const down = (pgm) => {
  pgm.dropTable("goal_changes");
  pgm.dropTable("daily_tips");
  pgm.dropTable("meals");
};