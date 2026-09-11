export const up = (pgm) => {
  /*
   * Migration 013 created meals, daily_tips and goal_changes with bigint
   * primary keys, but the columns were not configured as auto-generated
   * PostgreSQL identity columns (same issue the earlier fix migrations
   * solved for users/profiles/goals/food tables).
   *
   * This migration fixes the new tables in place.
   */

  pgm.sql(`
    ALTER TABLE "meals"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "daily_tips"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);

  pgm.sql(`
    ALTER TABLE "goal_changes"
    ALTER COLUMN "id"
    ADD GENERATED ALWAYS AS IDENTITY
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE "meals"
    ALTER COLUMN "id"
    DROP IDENTITY IF EXISTS
  `);

  pgm.sql(`
    ALTER TABLE "daily_tips"
    ALTER COLUMN "id"
    DROP IDENTITY IF EXISTS
  `);

  pgm.sql(`
    ALTER TABLE "goal_changes"
    ALTER COLUMN "id"
    DROP IDENTITY IF EXISTS
  `);
};