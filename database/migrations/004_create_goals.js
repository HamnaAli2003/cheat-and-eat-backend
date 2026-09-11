export const up = (pgm) => {
  pgm.createTable("goals", {
    id: {
      type: "bigint",
      primaryKey: true,
      generated: "always",
      identity: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      unique: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    daily_calorie_goal: {
      type: "integer",
      notNull: true,
    },

    weight_loss_goal_kg: {
      type: "numeric(6,2)",
      notNull: false,
    },

    weight_loss_months: {
      type: "integer",
      notNull: false,
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

  pgm.addConstraint("goals", "goals_daily_calorie_goal_check", {
    check: "daily_calorie_goal > 0",
  });

  pgm.addConstraint("goals", "goals_weight_loss_goal_check", {
    check:
      "weight_loss_goal_kg IS NULL OR weight_loss_goal_kg BETWEEN 1 AND 100",
  });

  pgm.addConstraint("goals", "goals_weight_loss_months_check", {
    check:
      "weight_loss_months IS NULL OR weight_loss_months BETWEEN 1 AND 24",
  });
};

export const down = (pgm) => {
  pgm.dropTable("goals");
};