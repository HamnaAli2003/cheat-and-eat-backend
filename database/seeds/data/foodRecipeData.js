/**
 * foodRecipeData.js
 * ---------------------------------------------------------------------------
 * Ingredient-based recipes for selected dishes.
 *
 * Rules honoured here:
 *   - Every ingredient is either linked to an existing food row (food_id → its
 *     per-100g values are authoritative) or carries its own per100 JSONB for
 *     staples that are not in the catalog (rice/atta/oil/raw meat/spices).
 *   - Quantities are the real batch amounts; default_servings splits the batch
 *     into per-serving totals.
 *   - estimated: true on every recipe until the plate has been weighed against
 *     a real preparation — the UI must present these as estimates.
 *   - No value is "invented": staple per-100g figures are widely published
 *     reference values; where a figure is approximate it is still flagged via
 *     the recipe-level estimate.
 */
export const RECIPES = [
  {
    food_id: 2, // Chicken Biryani
    name: 'Chicken Biryani',
    description:
      'Basmati rice layered with marinated bone-in chicken, browned onions, and warm spices.',
    default_servings: 4,
    estimated: true,
    ingredients: [
      { name: 'Basmati Rice (cooked)', quantity: 300, unit: 'g', per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 } },
      { name: 'Chicken (bone-in, raw)', quantity: 400, unit: 'g', per100: { calories: 150, protein: 18, carbs: 0, fat: 8.3, fiber: 0 } },
      { name: 'Dahi (Yogurt)', quantity: 100, unit: 'g', per100: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 } },
      { name: 'Onion (sliced)', quantity: 100, unit: 'g', per100: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 } },
      { name: 'Tomato', quantity: 50, unit: 'g', per100: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 } },
      { name: 'Cooking Oil', quantity: 60, unit: 'g', per100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Ginger Garin Paste', quantity: 20, unit: 'g', per100: { calories: 124, protein: 4, carbs: 19, fat: 4, fiber: 3 } },
      { name: 'Green Chili', quantity: 10, unit: 'g', per100: { calories: 40, protein: 1.8, carbs: 8.9, fat: 0.6, fiber: 2.8 } },
      { name: 'Biryani / Garam Masala', quantity: 10, unit: 'g', per100: { calories: 299, protein: 12, carbs: 50, fat: 8, fiber: 20 } },
      { name: 'Mint & Coriander', quantity: 15, unit: 'g', per100: { calories: 33, protein: 2.5, carbs: 5.6, fat: 0.7, fiber: 4.5 } },
    ],
  },

  {
    food_id: 309, // Kachchi Biryani (Chicken)
    name: 'Kachchi Biryani (Chicken)',
    description:
      'Raw chicken marinated overnight in yogurt-spice mix, layered with rice and slow-steamed (dum).',
    default_servings: 4,
    estimated: true,
    ingredients: [
      { name: 'Basmati Rice (cooked)', quantity: 300, unit: 'g', per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 } },
      { name: 'Chicken (bone-in, raw)', quantity: 400, unit: 'g', per100: { calories: 150, protein: 18, carbs: 0, fat: 8.3, fiber: 0 } },
      { name: 'Dahi (Yogurt)', quantity: 150, unit: 'g', per100: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 } },
      { name: 'Onion (sliced)', quantity: 120, unit: 'g', per100: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 } },
      { name: 'Tomato', quantity: 60, unit: 'g', per100: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 } },
      { name: 'Cooking Oil', quantity: 65, unit: 'g', per100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Ginger Garlic Paste', quantity: 25, unit: 'g', per100: { calories: 124, protein: 4, carbs: 19, fat: 4, fiber: 3 } },
      { name: 'Green Chili', quantity: 10, unit: 'g', per100: { calories: 40, protein: 1.8, carbs: 8.9, fat: 0.6, fiber: 2.8 } },
      { name: 'Biryani / Garam Masala', quantity: 12, unit: 'g', per100: { calories: 299, protein: 12, carbs: 50, fat: 8, fiber: 20 } },
      { name: 'Mint & Coriander', quantity: 15, unit: 'g', per100: { calories: 33, protein: 2.5, carbs: 5.6, fat: 0.7, fiber: 4.5 } },
    ],
  },

  {
    food_id: 246, // Mutton Pulao
    name: 'Mutton Pulao',
    description: 'Fragrant rice cooked with tender mutton, yogurt, and whole spices.',
    default_servings: 4,
    estimated: true,
    ingredients: [
      { name: 'Mutton (bone-in)', quantity: 350, unit: 'g', per100: { calories: 145, protein: 20, carbs: 0, fat: 7, fiber: 0 } },
      { name: 'Basmati Rice (cooked)', quantity: 250, unit: 'g', per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 } },
      { name: 'Onion (sliced)', quantity: 80, unit: 'g', per100: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 } },
      { name: 'Dahi (Yogurt)', quantity: 60, unit: 'g', per100: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 } },
      { name: 'Cooking Oil', quantity: 45, unit: 'g', per100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Ginger Garlic Paste', quantity: 15, unit: 'g', per100: { calories: 124, protein: 4, carbs: 19, fat: 4, fiber: 3 } },
      { name: 'Whole Spices / Masala', quantity: 8, unit: 'g', per100: { calories: 299, protein: 12, carbs: 50, fat: 8, fiber: 20 } },
      { name: 'Green Chili', quantity: 8, unit: 'g', per100: { calories: 40, protein: 1.8, carbs: 8.9, fat: 0.6, fiber: 2.8 } },
    ],
  },

  {
    food_id: 4, // Chicken Karahi
    name: 'Chicken Karahi',
    description: 'Tomato-forward simmered chicken with ginger juliennes, chilies, and black pepper.',
    default_servings: 3,
    estimated: true,
    ingredients: [
      { name: 'Chicken (bone-in, raw)', quantity: 500, unit: 'g', per100: { calories: 150, protein: 18, carbs: 0, fat: 8.3, fiber: 0 } },
      { name: 'Tomato (diced)', quantity: 200, unit: 'g', per100: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 } },
      { name: 'Cooking Oil', quantity: 50, unit: 'g', per100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Ginger (julienne)', quantity: 25, unit: 'g', per100: { calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2 } },
      { name: 'Green Chili', quantity: 15, unit: 'g', per100: { calories: 40, protein: 1.8, carbs: 8.9, fat: 0.6, fiber: 2.8 } },
      { name: 'Dahi (Yogurt)', quantity: 50, unit: 'g', per100: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 } },
      { name: 'Black Pepper & Spices', quantity: 5, unit: 'g', per100: { calories: 251, protein: 10, carbs: 64, fat: 3, fiber: 25 } },
    ],
  },

  {
    food_id: 979, // Aloo Paratha
    name: 'Aloo Paratha',
    description: 'Whole-wheat flatbread stuffed with spiced boiled potato, cooked on a griddle.',
    default_servings: 1,
    estimated: true,
    ingredients: [
      { name: 'Whole Wheat Atta (raw)', quantity: 50, unit: 'g', per100: { calories: 364, protein: 13.2, carbs: 72.6, fat: 2.5, fiber: 10.7 } },
      { name: 'Boiled Potato', quantity: 60, unit: 'g', per100: { calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8 } },
      { name: 'Desi Ghee (cooking)', quantity: 8, unit: 'g', per100: { calories: 902, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Ajwain / Spices', quantity: 2, unit: 'g', per100: { calories: 289, protein: 15, carbs: 49, fat: 9.9, fiber: 38 } },
    ],
  },

  {
    food_id: 20, // Daal Chawal
    name: 'Daal Chawal',
    description: 'Masoor daal with plain rice, a light onion-chili tarka.',
    default_servings: 1,
    estimated: true,
    ingredients: [
      { food_id: 1, name: 'Plain Rice', quantity: 150, unit: 'g' },
      { food_id: 8, name: 'Daal Masoor', quantity: 150, unit: 'g' },
      { name: 'Onion (sliced)', quantity: 20, unit: 'g', per100: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 } },
      { name: 'Cooking Oil (tarka)', quantity: 10, unit: 'g', per100: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
      { name: 'Green Chili', quantity: 5, unit: 'g', per100: { calories: 40, protein: 1.8, carbs: 8.9, fat: 0.6, fiber: 2.8 } },
      { name: 'Cumin & Spices', quantity: 3, unit: 'g', per100: { calories: 375, protein: 17.8, carbs: 44.2, fat: 22.3, fiber: 10.5 } },
    ],
  },
];

export const RECIPE_FOOD_IDS = RECIPES.map((r) => r.food_id);