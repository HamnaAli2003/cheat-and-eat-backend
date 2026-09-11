/*
 * ============================================================
 * TOP-40 TRACKED FOODS: GOOGLE-VERIFIED NUTRITION + IMAGE FIXES
 * ============================================================
 *
 * The ~40 foods hard-linked to the tracker (TRACKER_KEEP_SLUGS)
 * were audited dish-by-dish against published web references
 * (USDA/FatSecret, CalorieKing-style trackers, Clearcals,
 * business product labels, University of Leeds South-Asian data).
 *
 * 1) NUTRITION
 *    A few values were blobs copied from a template row, so their
 *    macros disagreed with every published reference:
 *
 *      Mooli Paratha   was 374  (template paratha fat) -> 225
 *      Besan Laddu     was 391  (copy of Barfi)         -> 455
 *      Seviyan         was 278  (copy of Gulab Jamun)   -> 200
 *      Sheer Khurma    was 278  (copy of Gulab Jamun)   -> 289
 *      Gulab Jamun     was 278  (refs 290-350)          -> 310
 *      Shami Kebab     was 173  (copy of Seekh)         -> 215
 *      Seekh Kebab     was 173  -> 210
 *      Puri            was 478  (refs ~296)             -> 296
 *      Ras Malai       was 270  (refs ~160-200)         -> 200
 *      Dahi Bhalla     was 208  (refs ~150-170)         -> 170
 *      Butter Chicken  was 229  (refs 120-200)          -> 205
 *
 *    Values kept (within published ranges): Jalebi 370,
 *    Gol Gappe 182, Chana Chaat 150, Daal Chawal 159,
 *    Aloo Gobi 110, Halwa Puri 348, Bhindi Masala 100,
 *    Mutton Karahi 199, Beef Nihari 210, Apple 52, Banana 89,
 *    Orange 47, Mango 60, Roti 297, Plain Paratha 320.
 *
 * 2) IMAGES
 *    Wrong "Openverse" picks (photo does not match the dish,
 *    or one photo was reused across several dishes) are nulled;
 *    the UI falls back to its category placeholder. Represented
 *    dishes keep their verified single-use photos.
 */

const NUTRITION = [
  /* slug, calories, protein, carbs, fat, fiber */
  ["common-across-pakistan-bread-mooli-paratha", 225, 6, 34, 7.5, 3],
  ["common-across-pakistan-dessert-besan-laddu", 455, 11, 53, 22, 5],
  ["common-across-pakistan-dessert-seviyan", 200, 4.5, 30, 7, 1],
  ["common-across-pakistan-dessert-sheer-khurma", 289, 5, 35, 14, 2.5],
  ["common-across-pakistan-dessert-gulab-jamun", 310, 5, 42, 12, 0.5],
  ["common-across-pakistan-curry-kebab-shami-kebab", 215, 15.5, 9, 14, 1.5],
  ["common-across-pakistan-curry-kebab-seekh-kebab", 210, 17, 4, 14, 1],
  ["common-across-pakistan-bread-puri", 296, 7.5, 46.7, 9.4, 4.7],
  ["common-across-pakistan-dessert-ras-malai", 200, 6.5, 25, 8.5, 0.1],
  ["common-across-pakistan-snack-dahi-bhalla", 170, 5.5, 20, 10, 1.5],
  ["common-across-pakistan-curry-kebab-butter-chicken", 205, 14, 7, 15, 1],
];

/* Images proven wrong or shared across multiple foods. */
const NULL_IMAGES = [
  "common-across-pakistan-bread-aloo-paratha",
  "punjab-bread-pyaz-paratha",
  "punjab-bread-malabar-paratha",
  "punjab-bread-gobi-mooli-paratha",
  "common-across-pakistan-vegetable-tomato",
  "punjab-vegetable-cherry-tomato",
  "common-across-pakistan-vegetable-carrot",
  "common-across-pakistan-drink-chai",
  "punjab-vegetable-mint",
  "punjab-vegetable-sweet-potato",
  "common-across-pakistan-drink-strawberry-shake",
  "chicken-roll",
  "common-across-pakistan-rice-sweet-rice",
  "common-across-pakistan-fruit-pear",
  "mango",
  "plain-paratha",
  "common-across-pakistan-dessert-ras-malai",
];

export const up = (pgm) => {
  for (const [slug, kcal, protein, carbs, fat, fiber] of NUTRITION) {
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

  for (const slug of NULL_IMAGES) {
    pgm.sql(`
      UPDATE foods
      SET image_url = NULL, image_source = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE slug = '${slug}' AND image_url IS NOT NULL
    `);
  }
};

export const down = (pgm) => {
  /* Not reversible automatically: previous values are captured in git. */
};