/*
 * ============================================================
 * RICE CATEGORY: GOOGLE-VERIFIED NUTRITION FIXES
 * ============================================================
 *
 * Findings from the dump + references (Arise, SnapCalorie, Tarla
 * Dalal, Pakistani recipe sites for zarda, USDA basmati):
 *
 * A) The "145.60" vegetable-pulao template was incorrectly applied
 *    to meat/seafood rice dishes -> Keema Chawal, Murgh Chawal,
 *    Prawn Pulao were showing 3.2g protein.
 * B) Kabuli Pulao (lamb + carrots + raisins) had inherited the
 *    sweet-rice "128.80" template -> real ~140-202/100g.
 * C) Plain basmati/sela rice should match Plain Rice (130). Sela
 *    is parboiled basmati (slightly fewer carbs).
 * D) The sweet-rice cluster (Zarda/Shahi Zarda/Sweet Rice/Seero/
 *    Shir Khurma Chawal) at 128.8 is far too low - zarda is rice +
 *    ~1:1 sugar + ghee + nuts (~290-420 per 100g).
 * E) Chana (chickpea) rice dishes and khichdi had too little protein.
 *
 * Kept: biryani family (196.4), meat-chawal family (172.4),
 * Chicken Biryani 190, Chicken Pulao 180, Egg Fried Rice 168,
 * Jeera Rice 165, vegetable pulao family (145.6, now applied to
 * genuinely vegetarian rice dishes only).
 */

const FIX = [
  /* slug, kcal, protein, carbs, fat, fiber */
  ["punjab-rice-basmati-rice", 130, 2.7, 28, 0.3, 0.4],
  ["punjab-rice-sela-rice", 128, 2.7, 27, 0.3, 0.4],

  /* meat/seafood rice dishes (were tagged as vegetable) */
  ["sindh-rice-lahori-keema-chawal", 190, 9, 24, 7, 1.5],
  ["common-across-pakistan-rice-murgh-chawal", 180, 9, 24, 5.5, 1.5],
  ["sindh-rice-prawn-pulao", 160, 8, 23, 4.5, 1],

  /* Kabuli Pulao (lamb/carrot/raisin) */
  ["khyber-pakhtunkhwa-rice-kabuli-pulao", 190, 7.5, 26, 6, 2],

  /* chickpea rice & khichdi (protein bump) */
  ["sindh-rice-chana-chawal", 160, 6, 24, 4, 3],
  ["common-across-pakistan-rice-chana-pulao", 160, 6, 24, 4, 3],
  ["common-across-pakistan-rice-khichdi", 135, 5, 24, 3, 2],

  /* sweet rice family (was far too low) */
  ["common-across-pakistan-rice-zarda", 360, 5, 64, 9, 1],
  ["khyber-pakhtunkhwa-rice-shahi-zarda", 360, 5, 64, 9, 1],
  ["common-across-pakistan-rice-sweet-rice", 360, 5, 64, 9, 1],
  ["sindh-rice-shir-khurma-chawal", 245, 5, 42, 6, 1],
  ["sindh-rice-sindhi-seero", 385, 4, 62, 13, 1],
];

export const up = (pgm) => {
  for (const [slug, kcal, protein, carbs, fat, fiber] of FIX) {
    pgm.sql(`
      UPDATE foods
      SET base_calories = ${kcal},
          base_protein = ${protein},
          base_carbs = ${carbs},
          base_fat = ${fat},
          base_fiber = ${fiber},
          updated_at = CURRENT_TIMESTAMP
      WHERE slug = '${slug}'
    `);
  }
};

export const down = (pgm) => {
  /* Previous values captured in git; not reversible automatically. */
};