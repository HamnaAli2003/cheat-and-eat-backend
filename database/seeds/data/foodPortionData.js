/**
 * foodPortionData.js
 * ---------------------------------------------------------------------------
 * Spec-accurate portion strategies for whole fruits.
 *
 * Grams are the internal standard. Each row is one selectable portion:
 *
 *   weight-based:  { amount_unit: 'g', amount: <whole weight> }
 *                  + edible_weight_g when the whole weight includes inedible
 *                  parts (peel, seeds, rind) — nutrition uses the edible value.
 *   count-based:   { amount_unit: 'count', amount: <pieces>,
 *                    per_unit_g: <grams per piece> }
 *   volume:        { amount_unit: 'ml', amount: <millilitres> }
 *
 * Portion weights are standard published reference weights (FAO/USDA and
 * produce-industry size classes). Per-100g nutrition always comes from the
 * foods table — this file never stores nutrition values.
 */
export const FRUIT_PORTIONS = [
  /* ── Banana (15) ─────────────────────────────────────────────── */
  { food_id: 15, name: 'Small (1 small)', unit: 'banana', amount: 90, amount_unit: 'g', edible_weight_g: 78, sort_order: 1 },
  { food_id: 15, name: 'Medium (1 medium)', unit: 'banana', amount: 118, amount_unit: 'g', edible_weight_g: 105, sort_order: 2, is_default: true },
  { food_id: 15, name: 'Large (1 large)', unit: 'banana', amount: 145, amount_unit: 'g', edible_weight_g: 130, sort_order: 3 },
  { food_id: 15, name: '1 cup sliced', unit: 'cup', amount: 150, amount_unit: 'g', sort_order: 4 },

  /* ── Mango (14) ──────────────────────────────────────────────── */
  { food_id: 14, name: 'Small (1 small)', unit: 'mango', amount: 200, amount_unit: 'g', edible_weight_g: 140, sort_order: 1 },
  { food_id: 14, name: 'Medium (1 medium)', unit: 'mango', amount: 300, amount_unit: 'g', edible_weight_g: 200, sort_order: 2, is_default: true },
  { food_id: 14, name: 'Large (1 large)', unit: 'mango', amount: 400, amount_unit: 'g', edible_weight_g: 270, sort_order: 3 },
  { food_id: 14, name: '1 cup diced', unit: 'cup', amount: 165, amount_unit: 'g', sort_order: 4 },

  /* ── Apple (1456) ────────────────────────────────────────────── */
  { food_id: 1456, name: 'Small (1 small)', unit: 'apple', amount: 149, amount_unit: 'g', edible_weight_g: 135, sort_order: 1 },
  { food_id: 1456, name: 'Medium (1 medium)', unit: 'apple', amount: 182, amount_unit: 'g', edible_weight_g: 165, sort_order: 2, is_default: true },
  { food_id: 1456, name: 'Large (1 large)', unit: 'apple', amount: 223, amount_unit: 'g', edible_weight_g: 200, sort_order: 3 },
  { food_id: 1456, name: '1 cup sliced', unit: 'cup', amount: 109, amount_unit: 'g', sort_order: 4 },

  /* ── Orange (1450) ───────────────────────────────────────────── */
  { food_id: 1450, name: 'Small (1 small)', unit: 'orange', amount: 130, amount_unit: 'g', edible_weight_g: 100, sort_order: 1 },
  { food_id: 1450, name: 'Medium (1 medium)', unit: 'orange', amount: 154, amount_unit: 'g', edible_weight_g: 120, sort_order: 2, is_default: true },
  { food_id: 1450, name: 'Large (1 large)', unit: 'orange', amount: 184, amount_unit: 'g', edible_weight_g: 140, sort_order: 3 },
  { food_id: 1450, name: '½ cup segments', unit: 'cup', amount: 90, amount_unit: 'g', sort_order: 4 },

  /* ── Kinnow (1451) ───────────────────────────────────────────── */
  { food_id: 1451, name: 'Medium (1 whole)', unit: 'kinnow', amount: 140, amount_unit: 'g', edible_weight_g: 95, sort_order: 1, is_default: true },
  { food_id: 1451, name: 'Large (1 whole)', unit: 'kinnow', amount: 170, amount_unit: 'g', edible_weight_g: 115, sort_order: 2 },
  { food_id: 1451, name: '1 cup segments', unit: 'cup', amount: 100, amount_unit: 'g', sort_order: 3 },
  { food_id: 1451, name: '½ cup segments', unit: 'cup', amount: 50, amount_unit: 'g', sort_order: 4 },

  /* ── Guava (1444) ────────────────────────────────────────────── */
  { food_id: 1444, name: 'Small (1 small)', unit: 'guava', amount: 90, amount_unit: 'g', edible_weight_g: 75, sort_order: 1 },
  { food_id: 1444, name: 'Medium (1 medium)', unit: 'guava', amount: 150, amount_unit: 'g', edible_weight_g: 130, sort_order: 2, is_default: true },
  { food_id: 1444, name: 'Large (1 large)', unit: 'guava', amount: 210, amount_unit: 'g', edible_weight_g: 180, sort_order: 3 },
  { food_id: 1444, name: '½ cup pieces', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 4 },

  /* ── Watermelon (1441) ───────────────────────────────────────── */
  { food_id: 1441, name: '½ small wedge', unit: 'wedge', amount: 150, amount_unit: 'g', edible_weight_g: 142, sort_order: 1 },
  { food_id: 1441, name: '1 cup diced', unit: 'cup', amount: 152, amount_unit: 'g', sort_order: 2, is_default: true },
  { food_id: 1441, name: '1 slice (1-in wedge)', unit: 'wedge', amount: 280, amount_unit: 'g', edible_weight_g: 265, sort_order: 3 },
  { food_id: 1441, name: '2 cups diced', unit: 'cup', amount: 305, amount_unit: 'g', sort_order: 4 },

  /* ── Muskmelon (1442) ────────────────────────────────────────── */
  { food_id: 1442, name: '1 slice', unit: 'slice', amount: 200, amount_unit: 'g', edible_weight_g: 180, sort_order: 1 },
  { food_id: 1442, name: '1 cup diced', unit: 'cup', amount: 160, amount_unit: 'g', sort_order: 2, is_default: true },
  { food_id: 1442, name: '½ cup diced', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 3 },
  { food_id: 1442, name: '¼ melon', unit: 'melon', amount: 260, amount_unit: 'g', edible_weight_g: 235, sort_order: 4 },

  /* ── Grapes (1399) — count-based ─────────────────────────────── */
  { food_id: 1399, name: '10 grapes', unit: 'grapes', amount: 10, amount_unit: 'count', per_unit_g: 5, sort_order: 1 },
  { food_id: 1399, name: '1 cup (~20 grapes)', unit: 'grapes', amount: 20, amount_unit: 'count', per_unit_g: 5, sort_order: 2, is_default: true },
  { food_id: 1399, name: '1 small bunch', unit: 'bunch', amount: 120, amount_unit: 'g', sort_order: 3 },
  { food_id: 1399, name: '2 cups (~40 grapes)', unit: 'grapes', amount: 40, amount_unit: 'count', per_unit_g: 5, sort_order: 4 },

  /* ── Pomegranate (1458) ──────────────────────────────────────── */
  { food_id: 1458, name: '¼ fruit', unit: 'fruit', amount: 140, amount_unit: 'g', edible_weight_g: 87, sort_order: 1 },
  { food_id: 1458, name: '1 medium fruit', unit: 'fruit', amount: 280, amount_unit: 'g', edible_weight_g: 174, sort_order: 2, is_default: true },
  { food_id: 1458, name: '½ cup arils', unit: 'cup', amount: 88, amount_unit: 'g', sort_order: 3 },
  { food_id: 1458, name: '100 g arils', unit: 'arils', amount: 100, amount_unit: 'g', sort_order: 4 },

  /* ── Dates (1460) — count-based ──────────────────────────────── */
  { food_id: 1460, name: '1 date', unit: 'dates', amount: 1, amount_unit: 'count', per_unit_g: 8, sort_order: 1 },
  { food_id: 1460, name: '2 dates', unit: 'dates', amount: 2, amount_unit: 'count', per_unit_g: 8, sort_order: 2, is_default: true },
  { food_id: 1460, name: '3 dates', unit: 'dates', amount: 3, amount_unit: 'count', per_unit_g: 8, sort_order: 3 },
  { food_id: 1460, name: '35 g (typical)', unit: 'serving', amount: 35, amount_unit: 'g', sort_order: 4 },

  /* ── Pear (1457) ─────────────────────────────────────────────── */
  { food_id: 1457, name: 'Small (1 small)', unit: 'pear', amount: 166, amount_unit: 'g', edible_weight_g: 150, sort_order: 1 },
  { food_id: 1457, name: 'Medium (1 medium)', unit: 'pear', amount: 178, amount_unit: 'g', edible_weight_g: 162, sort_order: 2, is_default: true },
  { food_id: 1457, name: 'Large (1 large)', unit: 'pear', amount: 230, amount_unit: 'g', edible_weight_g: 210, sort_order: 3 },
  { food_id: 1457, name: '1 cup sliced', unit: 'cup', amount: 140, amount_unit: 'g', sort_order: 4 },

  /* ── Peach (1369) ────────────────────────────────────────────── */
  { food_id: 1369, name: 'Small (1 small)', unit: 'peach', amount: 130, amount_unit: 'g', edible_weight_g: 120, sort_order: 1 },
  { food_id: 1369, name: 'Medium (1 medium)', unit: 'peach', amount: 150, amount_unit: 'g', edible_weight_g: 140, sort_order: 2, is_default: true },
  { food_id: 1369, name: 'Large (1 large)', unit: 'peach', amount: 175, amount_unit: 'g', edible_weight_g: 165, sort_order: 3 },
  { food_id: 1369, name: '1 cup sliced', unit: 'cup', amount: 154, amount_unit: 'g', sort_order: 4 },

  /* ── Plum (1370) — count-based ───────────────────────────────── */
  { food_id: 1370, name: '1 plum', unit: 'plums', amount: 1, amount_unit: 'count', per_unit_g: 66, sort_order: 1 },
  { food_id: 1370, name: '2 plums', unit: 'plums', amount: 2, amount_unit: 'count', per_unit_g: 66, sort_order: 2, is_default: true },
  { food_id: 1370, name: '3 plums', unit: 'plums', amount: 3, amount_unit: 'count', per_unit_g: 66, sort_order: 3 },
  { food_id: 1370, name: '100 g', unit: 'serving', amount: 100, amount_unit: 'g', sort_order: 4 },

  /* ── Papaya (1443) ───────────────────────────────────────────── */
  { food_id: 1443, name: '½ cup diced', unit: 'cup', amount: 72, amount_unit: 'g', sort_order: 1 },
  { food_id: 1443, name: '1 cup diced', unit: 'cup', amount: 145, amount_unit: 'g', sort_order: 2, is_default: true },
  { food_id: 1443, name: '½ small papaya', unit: 'papaya', amount: 150, amount_unit: 'g', edible_weight_g: 135, sort_order: 3 },
  { food_id: 1443, name: '2 cups diced', unit: 'cup', amount: 290, amount_unit: 'g', sort_order: 4 },

  /* ── Lychee (1445) — count-based ─────────────────────────────── */
  { food_id: 1445, name: '5 lychees', unit: 'lychees', amount: 5, amount_unit: 'count', per_unit_g: 14, sort_order: 1 },
  { food_id: 1445, name: '8 lychees', unit: 'lychees', amount: 8, amount_unit: 'count', per_unit_g: 14, sort_order: 2, is_default: true },
  { food_id: 1445, name: '10 lychees', unit: 'lychees', amount: 10, amount_unit: 'count', per_unit_g: 14, sort_order: 3 },
  { food_id: 1445, name: '100 g', unit: 'serving', amount: 100, amount_unit: 'g', sort_order: 4 },

  /* ── Sweet Lime (1455) ───────────────────────────────────────── */
  { food_id: 1455, name: 'Medium (1 whole)', unit: 'mousambi', amount: 150, amount_unit: 'g', edible_weight_g: 105, sort_order: 1, is_default: true },
  { food_id: 1455, name: 'Large (1 whole)', unit: 'mousambi', amount: 180, amount_unit: 'g', edible_weight_g: 125, sort_order: 2 },
  { food_id: 1455, name: '½ cup segments', unit: 'cup', amount: 60, amount_unit: 'g', sort_order: 3 },
  { food_id: 1455, name: '1 glass juice', unit: 'glass', amount: 200, amount_unit: 'ml', sort_order: 4 },

  /* ── Honeydew (1269) ─────────────────────────────────────────── */
  { food_id: 1269, name: '½ cup diced', unit: 'cup', amount: 80, amount_unit: 'g', sort_order: 1 },
  { food_id: 1269, name: '1 cup diced', unit: 'cup', amount: 160, amount_unit: 'g', sort_order: 2, is_default: true },
  { food_id: 1269, name: '1 slice', unit: 'slice', amount: 200, amount_unit: 'g', edible_weight_g: 190, sort_order: 3 },
  { food_id: 1269, name: '¼ melon', unit: 'melon', amount: 350, amount_unit: 'g', edible_weight_g: 330, sort_order: 4 },

  /* ── Mandarin (1452) ─────────────────────────────────────────── */
  { food_id: 1452, name: 'Small (1 small)', unit: 'mandarin', amount: 100, amount_unit: 'g', edible_weight_g: 75, sort_order: 1 },
  { food_id: 1452, name: 'Medium (1 medium)', unit: 'mandarin', amount: 130, amount_unit: 'g', edible_weight_g: 100, sort_order: 2, is_default: true },
  { food_id: 1452, name: 'Large (1 large)', unit: 'mandarin', amount: 150, amount_unit: 'g', edible_weight_g: 115, sort_order: 3 },
  { food_id: 1452, name: '1 cup segments', unit: 'cup', amount: 90, amount_unit: 'g', sort_order: 4 },
];

export const FRUIT_PORTION_FOOD_IDS = [
  ...new Set(FRUIT_PORTIONS.map((p) => p.food_id)),
];