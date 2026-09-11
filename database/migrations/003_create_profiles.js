export const up = (pgm) => {
  pgm.createTable("profiles", {
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

    age: {
      type: "integer",
      notNull: true,
    },

    gender: {
      type: "varchar(20)",
      notNull: true,
    },

    height_cm: {
      type: "numeric(5,2)",
      notNull: true,
    },

    weight_kg: {
      type: "numeric(6,2)",
      notNull: true,
    },

    activity: {
      type: "varchar(50)",
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

  pgm.addConstraint("profiles", "profiles_gender_check", {
    check: "gender IN ('male', 'female')",
  });

  pgm.addConstraint("profiles", "profiles_age_check", {
    check: "age BETWEEN 10 AND 100",
  });

  pgm.addConstraint("profiles", "profiles_height_check", {
    check: "height_cm BETWEEN 80 AND 250",
  });

  pgm.addConstraint("profiles", "profiles_weight_check", {
    check: "weight_kg BETWEEN 20 AND 300",
  });
};

export const down = (pgm) => {
  pgm.dropTable("profiles");
};