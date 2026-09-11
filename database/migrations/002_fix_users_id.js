export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE "users"
    ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE "users"
    ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
  `);
};