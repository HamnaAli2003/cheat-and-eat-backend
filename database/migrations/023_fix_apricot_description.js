/*
 * ============================================================
 * SWAT APRICOT: DESCRIPTION CONSISTENCY FIX
 * ============================================================
 *
 * The "Apricot" row (khyber-pakhtunkhwa-fruit-swat-apricot) described
 * itself as "Sweet dried apricots" while its per-100g macros (48.6
 * kcal / 1.43 P / 11.14 C / 0.29 F) are the RAW fresh-apricot values
 * (USDA raw apricot = 48 kcal/100g). The catalog already has a
 * separate "Dried Apricot" (240 kcal, common-across-pakistan). To
 * avoid two conflicting dried-apricot rows, this row now correctly
 * represents FRESH apricots and the description is aligned with its
 * values.
 */

export const up = (pgm) => {
  pgm.sql(`
    UPDATE foods
    SET description = 'Sweet, sun-ripened fresh apricots from the Swat valley',
        updated_at = CURRENT_TIMESTAMP
    WHERE slug = 'khyber-pakhtunkhwa-fruit-swat-apricot'
  `);
};

export const down = (pgm) => {
  /* Previous value captured in git; not reversible automatically. */
};