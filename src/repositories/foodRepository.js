import { query } from "../config/database.js";

/*
 * ============================================================
 * FOOD REPOSITORY
 * ============================================================
 *
 * Database-only layer for foods.
 *
 * Repository purpose:
 * - PostgreSQL queries
 * - Food list
 * - Categories
 * - Single food detail
 *
 * Business logic is handled by the service layer.
 * ============================================================
 */


/**
 * Get paginated foods with optional filters.
 *
 * Supported:
 * - search
 * - category
 * - tag
 * - sort
 * - pagination
 */
export const findFoods = async ({
  search = "",
  category = "",
  tag = "",
  region = "",
  sort = "",
  minCalories,
  maxCalories,
  minProtein,
  maxProtein,
  minOil,
  maxOil,
  page = 1,
  limit = 24,
}) => {
  const conditions = [`f.is_active = TRUE`];
  const params = [];
  let searchPrefixIdx = null;

  /*
   * Search by food name or description
   */
  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    params.push(`${search.trim()}%`);
    searchPrefixIdx = params.length;

    conditions.push(`
      (
        f.name ILIKE $${params.length - 1}
        OR f.description ILIKE $${params.length - 1}
      )
    `);
  }

  /*
   * Filter by category slug
   */
  if (category.trim()) {
    params.push(category.trim().toLowerCase());

    conditions.push(`
      c.slug = $${params.length}
    `);
  }

  /*
   * Filter by region.
   *
   * Regions are human-friendly labels (e.g. "Punjab"), matched exactly.
   * Null-region foods are not included in region-filtered results.
   */
  if (region.trim()) {
    params.push(region.trim());

    conditions.push(`
      f.region = $${params.length}
    `);
  }

  /*
   * Filter by metadata tag.
   *
   * tags are stored as JSONB array.
   */
  if (tag.trim()) {
    params.push(tag.trim().toLowerCase());

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          COALESCE(fm.tags, '[]'::jsonb)
        ) AS food_tag
        WHERE LOWER(food_tag) = $${params.length}
      )
    `);
  }

  /*
   * Nutrition threshold filters (rail criteria).
   *
   * calories/protein are PER SERVING: base_* is per 100g, so we scale by the
   * serving weight (falling back to 100g when serving_g is NULL).
   * oil_kcal is already stored per serving.
   */
  if (minCalories != null) {
    params.push(minCalories);
    conditions.push(`(f.base_calories * COALESCE(f.serving_g, 100) / 100) >= $${params.length}`);
  }
  if (maxCalories != null) {
    params.push(maxCalories);
    conditions.push(`(f.base_calories * COALESCE(f.serving_g, 100) / 100) <= $${params.length}`);
  }
  if (minProtein != null) {
    params.push(minProtein);
    conditions.push(`(f.base_protein * COALESCE(f.serving_g, 100) / 100) >= $${params.length}`);
  }
  if (maxProtein != null) {
    params.push(maxProtein);
    conditions.push(`(f.base_protein * COALESCE(f.serving_g, 100) / 100) <= $${params.length}`);
  }
  if (minOil != null) {
    params.push(minOil);
    conditions.push(`f.oil_kcal >= $${params.length}`);
  }
  if (maxOil != null) {
    params.push(maxOil);
    conditions.push(`f.oil_kcal <= $${params.length}`);
  }

  /*
   * Safe sorting.
   *
   * IMPORTANT:
   * User input is NOT directly inserted into SQL.
   */
  let orderBy = "f.name ASC";

 if (sort === "low-calories") {
  orderBy = "f.base_calories ASC, f.name ASC";
}
if (sort === "high-calories") {
  orderBy = "f.base_calories DESC, f.name ASC";
}
if (sort === "high-protein") {
  orderBy = "f.base_protein DESC, f.name ASC";
}
if (sort === "low-protein") {
  orderBy = "f.base_protein ASC, f.name ASC";
}
if (sort === "high-oil") {
  orderBy = "f.oil_kcal DESC, f.name ASC";
}
if (sort === "low-oil") {
  orderBy = "f.oil_kcal ASC, f.name ASC";
}

  const prefixClause = searchPrefixIdx != null
    ? `(CASE WHEN f.name ILIKE $${searchPrefixIdx} THEN 0 ELSE 1 END), `
    : "";

  /*
   * Pagination
   */
  const offset = (page - 1) * limit;

  params.push(limit);
  const limitParam = params.length;

  params.push(offset);
  const offsetParam = params.length;

  const whereClause = conditions.join(" AND ");

  /*
   * Get foods
   */
  const foodsResult = await query(
    `
      SELECT
        f.id,
        f.name,
        f.slug,
        f.description,
        f.image_url,
        f.base_calories,
        f.base_protein,
        f.base_carbs,
        f.base_fat,
        f.base_fiber,
        f.serving_g,
        f.oil_g,
        f.oil_kcal,
        f.meat_grams,
        f.region,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(fm.cooking_method, NULL) AS cooking_method,
        NULLIF(fm.ingredients, '[]'::jsonb) AS ingredients,
        COALESCE(fm.tags, '[]'::jsonb) AS tags,
        COALESCE(fm.notes, NULL) AS notes
      FROM foods f
      INNER JOIN food_categories c
        ON c.id = f.category_id
      LEFT JOIN food_metadata fm
        ON fm.food_id = f.id
      WHERE ${whereClause}
      ORDER BY ${prefixClause}${orderBy}
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    params
  );

  /*
   * Get total count separately.
   *
   * this is necessary for pagination, as we need to know the total number of items
   * that match the filters, regardless of the current page and limit.
   *
   * We use the same WHERE clause and parameters as the main query, but we exclude
   * the LIMIT and OFFSET.
   */
  const countParams = [];
  for (let i = 0; i < params.length; i++) {
    // skip the search-prefix placeholder (used only by the main query's ORDER BY,
    // never by the COUNT query) and the pagination placeholder
    if (i === searchPrefixIdx - 1) continue;
    if (i >= params.length - 2) continue;
    countParams.push(params[i]);
  }

  const countResult = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM foods f
      INNER JOIN food_categories c
        ON c.id = f.category_id
      LEFT JOIN food_metadata fm
        ON fm.food_id = f.id
      WHERE ${whereClause}
    `,
    countParams
  );

  return {
    foods: foodsResult.rows,
    total: countResult.rows[0].total,
    page,
    limit,
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  };
};


/**
 * Get all active food regions with item counts.
 *
 * Returns distinct, non-null regions with the number of active foods in each,
 * ordered by count descending. Used to populate the region dropdown.
 */
export const findFoodRegions = async () => {
  const result = await query(
    `
      SELECT
        region,
        COUNT(*)::int AS foodCount
      FROM foods
      WHERE is_active = TRUE
        AND region IS NOT NULL
        AND TRIM(region) <> ''
      GROUP BY region
      ORDER BY foodCount DESC, region ASC
    `
  );

  return result.rows;
};


/**
 * Get active food categories with item counts.
 *
 * When `region` is provided, only categories that have at least one active food
 * in that region are returned (with the region-scoped count). Otherwise returns
 * every category with its global count.
 */
export const findFoodCategories = async (region = "") => {
  const params = [];
  let whereClause = "";
  let havingClause = "HAVING COUNT(f.id) > 0";

  if (region.trim()) {
    params.push(region.trim());
    whereClause = `AND f.region = $${params.length}`;
  }

  const result = await query(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(f.id)::int AS food_count
      FROM food_categories c
      LEFT JOIN foods f
        ON f.category_id = c.id
        AND f.is_active = TRUE
        ${whereClause}
      GROUP BY c.id, c.name, c.slug
      ${havingClause}
      ORDER BY food_count DESC, c.name ASC
    `,
    params
  );

  return result.rows;
};


/**
 * Get one food with its complete configuration.
 *
 * Includes:
 * - basic food data
 * - metadata
 * - servings
 * - options
 * - option values
 * - components
 */
export const findFoodById = async (foodId) => {
  const foodResult = await query(
    `
      SELECT
        f.id,
        f.name,
        f.slug,
        f.description,
        f.image_url,
        f.base_calories,
        f.base_protein,
        f.base_carbs,
        f.base_fat,
        f.base_fiber,
        f.serving_g,
        f.oil_g,
        f.oil_kcal,
        f.meat_grams,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        fm.cooking_method,
        NULLIF(fm.ingredients, '[]'::jsonb) AS ingredients,
        COALESCE(fm.tags, '[]'::jsonb) AS tags,
        fm.notes

      FROM foods f

      INNER JOIN food_categories c
        ON c.id = f.category_id

      LEFT JOIN food_metadata fm
        ON fm.food_id = f.id

      WHERE f.id = $1
        AND f.is_active = TRUE
    `,
    [foodId]
  );

  const food = foodResult.rows[0];

  if (!food) {
    return null;
  }

  /*
   * Servings
   */
  const servingsResult = await query(
    `
      SELECT
        id,
        name,
        unit,
        amount,
        amount_unit,
        edible_weight_g,
        per_unit_g,
        sort_order,
        is_default
      FROM food_servings
      WHERE food_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [foodId]
  );

  /*
   * Options + values
   */
  const optionsResult = await query(
    `
      SELECT
        o.id,
        o.key,
        o.label,
        o.input_type,
        o.is_required,
        o.sort_order,

        COALESCE(
          json_agg(
            json_build_object(
              'id', ov.id,
              'key', ov.key,
              'label', ov.label,
              'caloriesDelta', ov.calories_delta,
              'proteinDelta', ov.protein_delta,
              'carbsDelta', ov.carbs_delta,
              'fatDelta', ov.fat_delta,
              'fiberDelta', ov.fiber_delta,
              'amount', ov.amount,
              'amountUnit', ov.amount_unit,
              'sortOrder', ov.sort_order,
              'isDefault', ov.is_default
            )
            ORDER BY ov.sort_order ASC, ov.id ASC
          ) FILTER (WHERE ov.id IS NOT NULL),
          '[]'::json
        ) AS values

      FROM food_options o

      LEFT JOIN food_option_values ov
        ON ov.option_id = o.id

      WHERE o.food_id = $1

      GROUP BY
        o.id,
        o.key,
        o.label,
        o.input_type,
        o.is_required,
        o.sort_order

      ORDER BY o.sort_order ASC, o.id ASC
    `,
    [foodId]
  );

  /*
   * Recipe (ingredient-level breakdown), if the dish has one.
   */
  const recipeResult = await query(
    `
      SELECT
        r.id,
        r.food_id,
        r.name,
        r.description,
        r.default_servings,
        r.estimated,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ri.id,
              'name', ri.name,
              'foodId', ri.food_id,
              'quantity', ri.quantity,
              'unit', ri.unit,
              'per100', ri.per100,
              'sortOrder', ri.sort_order,
              'isOptional', ri.is_optional
            )
            ORDER BY ri.sort_order ASC, ri.id ASC
          ) FILTER (WHERE ri.id IS NOT NULL),
          '[]'::json
        ) AS ingredients
      FROM recipes r
      LEFT JOIN recipe_ingredients ri
        ON ri.recipe_id = r.id
      WHERE r.food_id = $1
        AND r.is_active = TRUE
      GROUP BY
        r.id,
        r.food_id,
        r.name,
        r.description,
        r.default_servings,
        r.estimated
    `,
    [foodId]
  );

return {
    ...food,
    servings: servingsResult.rows,
    options: optionsResult.rows,
    recipe: recipeResult.rows,
  };
};