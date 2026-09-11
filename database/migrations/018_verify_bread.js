/*
 * ============================================================
 * BREAD CATEGORY: GOOGLE-VERIFIED NUTRITION FIXES
 * ============================================================
 *
 * The bread rows were seeded from shared per-category templates, so
 * almost everything carried one of ~4 identical macro sets. Two were
 * clearly wrong vs published references (USDA / FatSecret / Calorique
 * / NutriScan / Tarla Dalal / product labels):
 *
 * A) "135.56" plain-roti cluster (13 foods)  — ~50% too low.
 *    Real values per 100g: wheat chapati/roti ~297-299,
 *    millet rotis ~240-360, gram-flour rotis ~285-300.
 * B) "305.56" cluster mixed baked & DEEP-FRIED breads — the fried
 *    ones (bhatura ~345, pyaz/dal kachori ~330-340) were under-fatted.
 * C) Kulcha/Aloo Kulcha were tagged at the rich "paratha 374" value,
 *    but kulcha is tandoor-baked (~258-300) -> ~290/310.
 *
 * Naan row stays at 304.44 (USDA ~262-300); butter/garlic/roghni and
 * stuffed naans pushed slightly up for their ghee/filling.
 *
 * Kept: Puri 296, Plain Paratha 320, Roti 297 (already verified),
 * paratha family 374 (layered/stuffed w/ ghee), rich sweet breads
 * Sheermal/Taftan/Bakarkhani, Mooli Paratha 225, Aloo Paratha 298.
 */

const FIX = [
  /* slug, kcal, protein, carbs, fat, fiber */
  /* ---- plain wheat rotis ---- */
  ["common-across-pakistan-bread-chapati", 297, 11, 55, 4, 3],
  ["common-across-pakistan-bread-tandoori-roti", 297, 11, 55, 4, 3],
  ["common-across-pakistan-bread-dosti-roti", 297, 11, 55, 4, 3],
  ["punjab-bread-dalhi-roti", 297, 11, 55, 4, 3],
  ["common-across-pakistan-bread-khamiri-roti", 297, 11, 55, 4, 3],

  /* ---- specialty-flour rotis ---- */
  ["punjab-bread-besan-roti", 290, 13, 40, 8, 5],
  ["common-across-pakistan-bread-sattu-roti", 300, 13, 45, 7, 6],
  ["common-across-pakistan-bread-missi-roti", 285, 12, 42, 7, 5],
  ["punjab-bread-akki-roti", 200, 4, 40, 5, 2],
  ["common-across-pakistan-bread-makki-ki-roti", 240, 4, 38, 8, 4],
  ["common-across-pakistan-bread-bajra-ki-roti", 355, 11, 67, 5, 8],
  ["punjab-bread-jowar-roti", 349, 10, 72, 3, 6],
  ["punjab-bread-ragi-roti", 330, 7, 72, 2, 6],

  /* ---- kulcha (baked, not rich) ---- */
  ["common-across-pakistan-bread-kulcha", 290, 8, 48, 7, 2],
  ["punjab-bread-aloo-kulcha", 310, 8, 48, 9, 2],

  /* ---- naan: plain unchanged, brushed/stuffed higher ---- */
  ["common-across-pakistan-bread-butter-naan", 330, 9, 49, 11, 2],
  ["common-across-pakistan-bread-garlic-naan", 330, 9, 49, 11, 2],
  ["common-across-pakistan-bread-roghni-naan", 335, 9, 49, 11, 2],
  ["common-across-pakistan-bread-aloo-naan", 330, 8, 46, 12, 2],
  ["common-across-pakistan-bread-cheese-naan", 360, 12, 44, 15, 1],
  ["azad-kashmir-gilgit-baltistan-bread-dry-fruit-naan", 380, 10, 50, 15, 3],
  ["common-across-pakistan-bread-keema-naan", 350, 14, 44, 13, 2],
  ["common-across-pakistan-bread-paneer-naan", 340, 12, 45, 13, 2],
  ["khyber-pakhtunkhwa-bread-tikka-naan", 345, 13, 45, 13, 2],

  /* ---- deep-fried / pan-fried breads (were under-fatted) ---- */
  ["common-across-pakistan-bread-bhatura", 345, 8, 42, 16, 2],
  ["common-across-pakistan-bread-dal-kachori", 330, 6, 38, 14, 2],
  ["common-across-pakistan-bread-pyaaz-kachori", 340, 6, 34, 20, 2],
  ["common-across-pakistan-bread-khasta-kachori", 400, 8, 40, 22, 2],
  ["common-across-pakistan-bread-koki", 350, 9, 48, 14, 3],
  ["common-across-pakistan-bread-dhebra", 350, 9, 46, 15, 4],
  ["sindh-bread-sindhi-karel", 350, 9, 46, 15, 3],
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