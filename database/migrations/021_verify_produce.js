/*
 * ============================================================
 * FRUIT / VEGETABLE / SABZI: GOOGLE-VERIFIED NUTRITION FIXES
 * ============================================================
 *
 * Sub-agent research compared the seeded template clusters against
 * USDA FoodData Central raw-vegetable/fruit references.
 *
 * The "78" vegetable template (2.67P / 9.33C / 3.33F) was stamped on
 * ~40 raw vegetables: fat was 6-10x too high and calories 2-5x too
 * high for watery vegetables (bottle gourd 15 kcal is the extreme).
 * The "99.33" starchy template had the same fat problem. Herbs
 * (garlic 149 kcal, ginger 80) were massively understated. The
 * "64.67" fruit template left melons/citrus overstated and tamarind
 * (239 kcal) catastrophically understated.
 *
 * Tracker/DB-verified values (Apple 52, Banana 89, Orange 47, Mango
 * 60, Aloo Gobi 110, Bhindi Masala 100, Fresh Garden Salad 24, all
 * nuts and dried fruits) were left untouched.
 */

const FRUIT = [
  /* slug, kcal, protein, carbs, fat, fiber */
  ["common-across-pakistan-fruit-guava", 68, 2.6, 14.3, 1.0, 5.4],
  ["common-across-pakistan-fruit-papaya", 43, 0.5, 10.8, 0.3, 1.7],
  ["khyber-pakhtunkhwa-fruit-swat-peach", 39, 0.9, 9.5, 0.3, 1.5],
  ["khyber-pakhtunkhwa-fruit-swat-plum", 46, 0.7, 11.4, 0.4, 1.4],
  ["punjab-fruit-persimmon", 70, 0.6, 18.6, 0.6, 3.6],
  ["common-across-pakistan-fruit-kinnow", 47, 0.8, 12.0, 0.4, 1.8],
  ["balochistan-fruit-quetta-grape", 69, 0.7, 18.1, 0.2, 0.9],
  ["common-across-pakistan-fruit-grapefruit", 42, 0.8, 10.7, 0.1, 1.6],
  ["common-across-pakistan-fruit-sapodilla", 83, 0.4, 19.9, 1.1, 5.3],
  ["common-across-pakistan-fruit-muskmelon", 34, 0.8, 8.2, 0.2, 0.9],
  ["punjab-fruit-honeydew", 36, 0.5, 9.1, 0.1, 0.8],
  ["common-across-pakistan-fruit-sweet-lime", 47, 0.8, 12.0, 0.4, 1.8],
  ["common-across-pakistan-fruit-amla", 60, 0.5, 13.7, 0.1, 4.3],
  ["common-across-pakistan-fruit-jamun", 66, 0.7, 15.6, 0.2, 1.0],
  ["common-across-pakistan-fruit-jujube", 79, 1.2, 20.2, 0.2, 5.0],
  ["common-across-pakistan-fruit-tamarind", 239, 2.8, 62.5, 0.6, 5.1],
  ["common-across-pakistan-fruit-wood-apple", 120, 1.9, 25.0, 0.6, 5.0],
  ["common-across-pakistan-fruit-mandarin", 47, 0.8, 12.0, 0.4, 1.8],
  ["common-across-pakistan-fruit-watermelon", 30, 0.6, 7.6, 0.2, 0.4],
  ["common-across-pakistan-fruit-pear", 57, 0.4, 15.2, 0.1, 3.1],
];

const VEG = [
  /* slug, kcal, protein, carbs, fat, fiber */
  ["common-across-pakistan-vegetable-tomato", 18, 0.9, 3.9, 0.2, 1.2],
  ["punjab-vegetable-cherry-tomato", 18, 0.9, 3.9, 0.2, 1.2],
  ["common-across-pakistan-vegetable-carrot", 41, 0.9, 9.6, 0.2, 2.8],
  ["common-across-pakistan-vegetable-okra", 33, 1.9, 7.5, 0.2, 3.2],
  ["common-across-pakistan-vegetable-eggplant", 25, 1.0, 5.9, 0.2, 3.0],
  ["common-across-pakistan-vegetable-bitter-gourd", 21, 1.0, 4.7, 0.2, 2.8],
  ["common-across-pakistan-vegetable-cabbage", 25, 1.3, 5.8, 0.1, 2.5],
  ["common-across-pakistan-vegetable-cauliflower", 25, 1.9, 5.0, 0.3, 2.0],
  ["common-across-pakistan-vegetable-bottle-gourd", 15, 0.6, 3.6, 0.1, 0.6],
  ["common-across-pakistan-vegetable-spinach", 23, 2.9, 3.6, 0.4, 2.2],
  ["common-across-pakistan-vegetable-onion", 40, 1.1, 9.3, 0.1, 1.7],
  ["common-across-pakistan-vegetable-potato", 77, 2.0, 17.5, 0.1, 2.2],
  ["common-across-pakistan-vegetable-peas", 81, 5.4, 14.5, 0.4, 5.7],
  ["punjab-vegetable-sweet-potato", 86, 1.6, 20.1, 0.1, 3.0],
  ["punjab-vegetable-yam", 118, 1.5, 27.9, 0.2, 4.1],
  ["sindh-vegetable-raw-banana", 122, 1.3, 32.3, 0.4, 2.3],
  ["punjab-vegetable-colocasia", 112, 1.5, 26.5, 0.2, 4.1],
  ["common-across-pakistan-vegetable-radish", 16, 0.7, 3.4, 0.1, 1.6],
  ["punjab-vegetable-ridge-gourd", 20, 1.2, 4.4, 0.2, 0.6],
  ["sindh-vegetable-snake-gourd", 18, 0.9, 3.5, 0.2, 0.9],
  ["punjab-vegetable-tinda", 21, 1.0, 4.0, 0.2, 0.6],
  ["punjab-vegetable-cluster-beans", 30, 2.0, 5.0, 0.3, 3.0],
  ["sindh-vegetable-ivy-gourd", 30, 1.5, 6.0, 0.2, 1.0],
  ["sindh-vegetable-dedhri", 33, 1.9, 7.5, 0.2, 3.2],
  ["balochistan-vegetable-wild-okra", 33, 1.9, 7.5, 0.2, 3.2],
  ["sindh-vegetable-yardlong-beans", 30, 2.0, 5.5, 0.2, 3.0],
  ["punjab-vegetable-drumsticks", 37, 2.1, 8.5, 0.2, 4.0],
  ["sindh-vegetable-green-mango", 60, 0.7, 15.3, 0.3, 1.8],
  ["sindh-vegetable-sponge-gourd", 20, 1.0, 4.0, 0.2, 0.6],
  ["common-across-pakistan-vegetable-turnip", 28, 0.9, 6.4, 0.1, 1.8],
  ["common-across-pakistan-vegetable-pumpkin", 26, 1.0, 6.5, 0.1, 0.5],
  ["common-across-pakistan-vegetable-coriander", 23, 2.1, 3.7, 0.5, 2.8],
  ["punjab-vegetable-collard-greens", 32, 3.0, 5.4, 0.6, 4.0],
  ["punjab-vegetable-fenugreek-leaves", 49, 4.4, 6.0, 0.9, 3.7],
  ["khyber-pakhtunkhwa-vegetable-turnip-greens", 20, 1.5, 4.2, 0.3, 3.0],
  ["khyber-pakhtunkhwa-vegetable-wild-spinach", 23, 2.9, 3.6, 0.4, 2.2],
  ["azad-kashmir-gilgit-baltistan-vegetable-wild-greens", 25, 2.5, 4.0, 0.4, 2.5],
  ["sindh-vegetable-curry-leaves", 40, 4.0, 8.0, 1.0, 3.0],
  ["khyber-pakhtunkhwa-vegetable-fiddlehead-ferns", 34, 4.6, 5.5, 0.4, 0.6],
  ["common-across-pakistan-vegetable-garlic", 149, 6.4, 33.1, 0.5, 2.1],
  ["common-across-pakistan-vegetable-ginger", 80, 1.8, 17.8, 0.8, 2.0],
  ["common-across-pakistan-vegetable-green-chili", 40, 2.0, 8.8, 0.4, 1.6],
  ["punjab-vegetable-lemon", 29, 1.1, 9.3, 0.3, 2.8],
  ["punjab-vegetable-mint", 44, 3.3, 8.4, 0.7, 8.0],
  ["khyber-pakhtunkhwa-vegetable-wild-garlic", 40, 3.0, 7.0, 0.5, 2.0],
];

const SABZI = [
  ["palak-paneer", 145, 7.2, 7.5, 9.6, 2.0],
];

const ALL = [...FRUIT, ...VEG, ...SABZI];

export const up = (pgm) => {
  for (const [slug, kcal, protein, carbs, fat, fiber] of ALL) {
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