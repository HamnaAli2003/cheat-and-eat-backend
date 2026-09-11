export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "bigint",
      primaryKey: true,
      generated: "always",
      identity: true,
    },

    name: {
      type: "varchar(100)",
      notNull: true,
    },

    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },

    password_hash: {
      type: "text",
      notNull: true,
    },

    role: {
      type: "varchar(20)",
      notNull: true,
      default: "user",
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

  pgm.addConstraint("users", "users_role_check", {
    check: "role IN ('user', 'admin')",
  });
};

export const down = (pgm) => {
  pgm.dropTable("users");
};