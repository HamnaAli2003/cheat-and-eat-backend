/*
 * ============================================================
 * CURRY & KEBAB / DESSERT / DRINKS: VERIFIED NUTRITION FIXES
 * ============================================================
 *
 * Sub-agent research verified every food in these categories and
 * compared the seeded template clusters against USDA, FatSecret,
 * Calorique, SnapCalorie, Tarla Dalal, nutriscan, clearcals, IFCT
 * and product labels. All foods below were riding a WRONG shared
 * template and corrected to reference-based per-100g values.
 *
 * Curries/kebabs: broth dishes (yakhni), haleem (wheat+lentil),
 * trotter dishes (paye) and rice/kebab mixes had impossible macros.
 * Desserts: hard mithai (chikki/gajak/rewri/sohan papdi/mysore pak)
 * were far too low; khoa/mawa/barfi family corrected; gajar halwa
 * and falooda were too high.
 * Drinks: kulfi falooda, rabri doodh/falooda, badam doodh were
 * underestimated at plain-milk template; watermelon juice too high;
 * salted lassi (no sugar) corrected.
 *
 * Tracker-verified values (Butter Chicken, Shami/Seekh Kebab,
 * Mutton Karahi, Beef Nihari, Besan Laddu, Jalebi, Gulab Jamun,
 * Seviyan, Sheer Khurma, Ras Malai, Rice Kheer, Khowa-already? no)
 * were left untouched.
 */

const FIX = [
  /* slug, kcal, protein, carbs, fat, fiber */

  /* ---- curry & kebab ---- */
  ["sindh-curry-kebab-kachchi-biryani", 160, 8, 22, 5, 1],
  ["azad-kashmir-gilgit-baltistan-curry-kebab-chicken-yakhni", 99, 10.7, 0.8, 6.1, 0],
  ["azad-kashmir-gilgit-baltistan-curry-kebab-mutton-yakhni", 104, 8.3, 0.8, 7.7, 0],
  ["punjab-curry-kebab-beef-haleem", 160, 11, 15, 7, 4],
  ["common-across-pakistan-curry-kebab-chicken-haleem", 160, 11, 15, 7, 4],
  ["common-across-pakistan-curry-kebab-mutton-haleem", 160, 11, 15, 7, 4],
  ["common-across-pakistan-curry-kebab-beef-paye", 180, 13, 5, 13, 0],
  ["common-across-pakistan-curry-kebab-mutton-paye", 180, 13, 5, 13, 0],
  ["common-across-pakistan-curry-kebab-mutton-nihari", 215, 16, 5, 15, 0.5],
  ["punjab-curry-kebab-mutton-rogan-josh", 155, 12, 5, 10, 1],
  ["azad-kashmir-gilgit-baltistan-curry-kebab-chicken-rogan-josh", 155, 12, 5, 9, 1],
  ["punjab-curry-kebab-beef-seekh-kebab", 210, 17, 4, 14, 1],
  ["punjab-curry-kebab-shami-boti", 210, 15.5, 8, 13, 1.5],
  ["common-across-pakistan-curry-kebab-reshmi-roll", 240, 13, 26, 10, 1.5],
  ["common-across-pakistan-curry-kebab-bbq-platter", 220, 16, 4, 13, 0.5],
  ["azad-kashmir-gilgit-baltistan-curry-kebab-tabak-maaz", 270, 16, 1, 22, 0],
  ["khyber-pakhtunkhwa-curry-kebab-dampukht", 215, 15, 6, 15, 1],
  ["sindh-curry-kebab-mutton-kunna", 215, 15, 6, 15, 1],
  ["punjab-curry-kebab-bong-paye", 195, 14, 5, 14, 0],
  ["sindh-curry-kebab-paya-nihari", 195, 14, 5, 14, 0],
  ["sindh-curry-kebab-chicken-manchurian", 190, 12, 10, 11, 0.5],

  /* ---- dessert ---- */
  ["common-across-pakistan-dessert-barfi", 285, 7, 39, 12, 0.5],
  ["punjab-dessert-chikki", 500, 15, 52, 26, 4],
  ["punjab-dessert-gajak", 470, 10, 55, 22, 4],
  ["punjab-dessert-rewri", 420, 8, 60, 16, 3],
  ["sindh-dessert-coconut-barfi", 480, 5, 45, 28, 5],
  ["common-across-pakistan-dessert-coconut-laddu", 470, 5, 45, 27, 5],
  ["punjab-dessert-sohan-papdi", 500, 5, 67, 22, 1],
  ["punjab-dessert-mysore-pak", 590, 4, 50, 42, 2],
  ["common-across-pakistan-dessert-gajar-halwa", 250, 4, 28, 13, 2],
  ["punjab-dessert-khoa", 380, 15, 25, 28, 0],
  ["punjab-dessert-mawa", 380, 13, 25, 28, 0],
  ["common-across-pakistan-dessert-kalakand", 330, 9, 38, 14, 0],
  ["common-across-pakistan-dessert-falooda", 180, 4, 28, 5, 1],
  ["sindh-dessert-besan-barfi", 370, 8, 45, 18, 3],
  ["sindh-dessert-mohanthal", 320, 8, 40, 14, 3],

  /* ---- drinks ---- */
  ["common-across-pakistan-drink-watermelon-juice", 30, 0.6, 7.6, 0.2, 0.3],
  ["common-across-pakistan-drink-kulfi-falooda", 220, 5, 26, 12, 0.5],
  ["common-across-pakistan-drink-badam-doodh", 108, 3.8, 10.5, 5.6, 0.2],
  ["common-across-pakistan-drink-salted-lassi", 50, 3.2, 5.5, 2.0, 0.1],
  ["common-across-pakistan-drink-rabri-doodh", 120, 4, 14, 6, 0.2],
  ["punjab-drink-rabri-falooda", 140, 4, 20, 5, 0.4],
  ["common-across-pakistan-drink-noon-chai", 60, 2, 6, 3, 0.1],
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