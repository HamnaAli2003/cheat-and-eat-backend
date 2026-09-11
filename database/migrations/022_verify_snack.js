/*
 * ============================================================
 * SNACK: GOOGLE-VERIFIED NUTRITION FIXES
 * ============================================================
 *
 * Sub-agent research confirmed the snack category was seeded from
 * three templates (267.5 / 235 / 150) regardless of the actual
 * dish. The biggest errors:
 *  - Meat snacks (sajji, tikka, chapli, malai boti, reshmi, galouti)
 *    carried the 5.83g-protein fried-snack template -> real grilled
 *    meat is 175-224 kcal / 16-28g protein.
 *  - Light chaat (pani puri, dahi vada, kadhi pakora, bhel puri)
 *    carried the deep-fried template -> real 130-204 kcal.
 *  - Samosa family aligned to the tracker-verified Samosa (280).
 *  - Pani Puri matched its duplicate dish Gol Gappe (182, tracker
 *    verified).
 *  - Dense fried items corrected to IFCT/FatSecret values (kachori
 *    355, sev puri 295). Sweet corn/masala corn left the chana
 *    chaat template for USDA 86/110.
 *
 * KEPT: Chana Chaat 150, Gol Gappe 182, Dahi Bhalla 170, pakora
 * family, Vegetable Pakora 248, Aloo Chaat, Lahori Chaat, Papri
 * Chaat, Chicken Roll 282, kebab/seekh/shami rolls, generic
 * "Snack" and "Wazwan Snacks" (no single real dish).
 */

const FIX = [
  /* slug, kcal, protein, carbs, fat, fiber */

  /* samosa family -> tracker-verified Samosa 280 */
  ["common-across-pakistan-snack-samosa", 280, 5, 29, 14, 2],
  ["common-across-pakistan-snack-aloo-samosa", 280, 5, 29, 14, 2],
  ["punjab-snack-aloo-samosa-chaat", 280, 5, 29, 14, 2],
  ["punjab-snack-chana-samosa", 280, 5, 29, 14, 2],
  ["common-across-pakistan-snack-samosa-chaat", 280, 5, 29, 14, 2],
  ["common-across-pakistan-snack-chicken-samosa", 280, 7, 27, 13, 1.5],
  ["common-across-pakistan-snack-paneer-samosa", 280, 7, 25, 16, 1.5],
  ["punjab-snack-sweet-samosa", 300, 5, 35, 15, 1],
  ["common-across-pakistan-snack-keema-samosa", 275, 7, 27, 13, 1.5],

  /* pakora family */
  ["common-across-pakistan-snack-pakora", 235, 5, 24, 13, 2],
  ["common-across-pakistan-snack-bread-pakora", 300, 6.5, 32, 16.5, 1.5],
  ["common-across-pakistan-snack-paneer-pakora", 320, 14, 20, 22, 1],

  /* kachori / puri */
  ["common-across-pakistan-snack-kachori", 355, 7, 35, 18, 2],
  ["punjab-snack-kachori-puri", 355, 7, 35, 18, 2],
  ["punjab-snack-kadhi-pakora", 130, 5, 15, 6, 1],

  /* chaat family (light) */
  ["common-across-pakistan-snack-bhel-puri", 200, 4.4, 35.6, 5, 2.5],
  ["common-across-pakistan-snack-pani-puri", 182, 4.1, 26.3, 6.1, 1],
  ["punjab-snack-pani-puri-chaat", 190, 5, 26, 7, 1.5],
  ["common-across-pakistan-snack-dahi-puri", 204, 4, 22, 10, 1],
  ["punjab-snack-dahi-vada", 170, 5.5, 20, 8, 1],
  ["common-across-pakistan-snack-sev-puri", 295, 5, 30, 16, 1.5],
  ["common-across-pakistan-snack-aloo-tikki", 185, 3, 22, 10, 2],
  ["punjab-snack-aloo-tikki-chaat", 200, 4, 24, 9, 2],
  ["punjab-snack-dahi-bhalla-chaat", 175, 6, 21, 8, 1],
  ["punjab-snack-chana-tikki", 170, 5, 22, 7, 3],
  ["punjab-snack-ghugni", 180, 9, 24, 6, 6],

  /* grilled/roasted meats (real macros) */
  ["balochistan-snack-beef-sajji", 200, 24, 0, 12, 0],
  ["balochistan-snack-chicken-sajji", 175, 27, 2.5, 8, 0],
  ["balochistan-snack-sajji", 210, 23, 0, 13, 0],
  ["common-across-pakistan-snack-chicken-tikka", 189, 28, 5.3, 6.5, 1],
  ["common-across-pakistan-snack-tikka-boti", 189, 28, 5.3, 6.5, 1],
  ["common-across-pakistan-snack-malai-boti", 175, 28, 2, 7, 1],
  ["common-across-pakistan-snack-reshmi-kebab", 210, 22, 4, 11, 1],
  ["common-across-pakistan-snack-galouti-kebab", 230, 18, 8, 14, 1],
  ["khyber-pakhtunkhwa-snack-peshawari-chapli", 224, 16, 9, 13, 2],
  ["common-across-pakistan-snack-chapli-kebab", 224, 16, 9, 13, 2],
  ["punjab-snack-tandoori-chicken", 175, 24, 2.5, 8, 1],
  ["punjab-snack-tikka-platter", 185, 25, 4, 8, 1],

  /* rolls (kebab + paratha) */
  ["common-across-pakistan-snack-chapli-roll", 280, 10, 28, 14, 2],
  ["common-across-pakistan-snack-malai-boti-roll", 290, 12, 30, 14, 1],
  ["common-across-pakistan-snack-tikka-roll", 280, 10, 28, 14, 2],
  ["common-across-pakistan-snack-bun-kebab", 295, 12, 48, 6, 3],

  /* other */
  ["punjab-snack-beguni", 220, 5, 22, 13, 3],
  ["common-across-pakistan-snack-ragda-pattice", 210, 5, 25, 10, 2],
  ["common-across-pakistan-snack-masala-corn", 110, 3.5, 22, 1.5, 2.5],
  ["common-across-pakistan-snack-sweet-corn", 86, 3.3, 18.7, 1.4, 2.2],
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