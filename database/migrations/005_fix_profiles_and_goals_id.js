export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE "profiles"
    ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;
  `);

  pgm.sql(`
    ALTER TABLE "goals"
    ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE "profiles"
    ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
  `);

  pgm.sql(`
    ALTER TABLE "goals"
    ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
  `);
};