/*
 * ============================================================
 * ADD TRACKER FOODS
 * ============================================================
 *
 * Inserts the foods the frontend tracker configs reference for which
 * no accurate backend row existed (see TRACKER_FOOD_ADDITIONS). Every
 * name is new to the catalog, so no food is duplicated.
 *
 * Also adds the "breakfast" category (the catalog had none) so the
 * new breakfast staples (omelette, chilla, oatmeal, poha) have an
 * accurate home. Nutrition is per 100g, as prepared; oil_g/oil_kcal
 * are descriptive per-serving values. Idempotent via slug conflicts.
 */

import { TRACKER_FOOD_ADDITIONS } from "../seeds/trackerFoodAdditions.js";

export const up = (pgm) => {
  pgm.sql(`
    INSERT INTO food_categories (name, slug)
    VALUES ('Breakfast', 'breakfast')
    ON CONFLICT (slug)
    DO UPDATE SET name = EXCLUDED.name
  `);

  pgm.sql(`
    INSERT INTO foods (
      category_id,
      name,
      slug,
      description,
      base_calories,
      base_protein,
      base_carbs,
      base_fat,
      base_fiber,
      region,
      subcategory,
      nutrition_basis,
      serving_g,
      serving_label,
      oil_g,
      oil_kcal
    )
    VALUES
      ${TRACKER_FOOD_ADDITIONS.map(
        (f) => `(
          (SELECT id FROM food_categories WHERE slug = '${f.category}'),
          '${f.name}',
          '${f.slug}',
          '${f.description}',
          ${f.baseCalories},
          ${f.baseProtein},
          ${f.baseCarbs},
          ${f.baseFat},
          0,
          'Common Across Pakistan',
          '${f.name}',
          'per typical serving',
          ${f.servingG},
          '${f.servingLabel}',
          ${f.oilG},
          ${f.oilKcal}
        )`
      ).join(",\n")}
    ON CONFLICT (slug)
    DO UPDATE SET
      category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      base_calories = EXCLUDED.base_calories,
      base_protein = EXCLUDED.base_protein,
      base_carbs = EXCLUDED.base_carbs,
      base_fat = EXCLUDED.base_fat,
      region = EXCLUDED.region,
      subcategory = EXCLUDED.subcategory,
      nutrition_basis = EXCLUDED.nutrition_basis,
      serving_g = EXCLUDED.serving_g,
      serving_label = EXCLUDED.serving_label,
      oil_g = EXCLUDED.oil_g,
      oil_kcal = EXCLUDED.oil_kcal,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const f of TRACKER_FOOD_ADDITIONS) {
    pgm.sql(`
      INSERT INTO food_servings (
        food_id,
        name,
        unit,
        amount,
        amount_unit,
        sort_order,
        is_default
      )
      SELECT id, '${f.servingLabel}', 'serving', serving_g, 'g', 1, TRUE
      FROM foods
      WHERE slug = '${f.slug}'
      ON CONFLICT (food_id, name)
      DO NOTHING
    `);

    pgm.sql(`
      INSERT INTO food_metadata (
        food_id,
        ingredients,
        tags
      )
      SELECT id, '[]'::jsonb,
        to_jsonb(ARRAY['desi', 'pakistani', '${f.category}'])
      FROM foods
      WHERE slug = '${f.slug}'
      ON CONFLICT (food_id)
      DO NOTHING
    `);
  }
};

export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM foods
    WHERE slug IN (${TRACKER_FOOD_ADDITIONS.map((f) => `'${f.slug}'`).join(", ")})
  `);

  pgm.sql(`
    DELETE FROM food_categories
    WHERE slug = 'breakfast'
  `);
};