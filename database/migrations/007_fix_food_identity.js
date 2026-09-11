export const up = (pgm) => {
  /*
   * ============================================================
   * FIX FOOD SYSTEM IDENTITY COLUMNS
   * ============================================================
   *
   * Migration 006 created the food IDs as bigint primary keys,
   * but they were not configured as auto-generated PostgreSQL
   * identity columns.
   *
   * This migration fixes the existing tables without modifying
   * or recreating migration 006.
   */

  pgm.sql(`
    ALTER TABLE "food_categories"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "foods"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_servings"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_options"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_option_values"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_components"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);
};

export const down = (pgm) => {
  /*
   * Remove identity generation if this migration is rolled back.
   *
   * The columns themselves remain intact.
   */

  pgm.sql(`
    ALTER TABLE "food_categories"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "foods"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_servings"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_options"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_option_values"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "food_components"
    ALTER COLUMN "id"
    DROP IDENTITY
  `);
};