import prisma from "../config/prisma.js";
export const findFoods = async ({
  page = 1,
  limit = 20,
  search = "",
  category = "",
  region = "",
  tag = "",
  minCalories,
  maxCalories,
  minProtein,
  maxProtein,
  minCarbs,
  maxCarbs,
  minFat,
  maxFat,
  minFiber,
  maxFiber,
  sort = "name",
  order = "asc",
}) => {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedCategory = category.trim();
  const normalizedRegion = region.trim();
  const normalizedTag = tag.trim().toLowerCase();

  const foods = await prisma.foods.findMany({
    where: {
      is_active: true,

      ...(normalizedCategory
        ? {
            food_categories: {
              slug: normalizedCategory,
            },
          }
        : {}),

      ...(normalizedRegion
        ? {
            region: normalizedRegion,
          }
        : {}),
    },

    include: {
      food_categories: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      food_metadata: {
        select: {
          cooking_method: true,
          ingredients: true,
          tags: true,
          notes: true,
        },
      },
    },
  });

  let filteredFoods = foods.filter((food) => {
    if (normalizedSearch) {
      const searchableText = [
        food.name,
        food.description,
        food.urdu_name,
        food.subcategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(normalizedSearch)) {
        return false;
      }
    }

    if (normalizedTag) {
      const tags = Array.isArray(food.food_metadata?.tags)
        ? food.food_metadata.tags
        : [];

      const hasTag = tags.some(
        (item) =>
          String(item).trim().toLowerCase() === normalizedTag
      );

      if (!hasTag) {
        return false;
      }
    }

    const calories = Number(food.base_calories);
    const protein = Number(food.base_protein);
    const carbs = Number(food.base_carbs);
    const fat = Number(food.base_fat);
    const fiber = Number(food.base_fiber);

    if (
      minCalories !== undefined &&
      calories < Number(minCalories)
    ) {
      return false;
    }

    if (
      maxCalories !== undefined &&
      calories > Number(maxCalories)
    ) {
      return false;
    }

    if (
      minProtein !== undefined &&
      protein < Number(minProtein)
    ) {
      return false;
    }

    if (
      maxProtein !== undefined &&
      protein > Number(maxProtein)
    ) {
      return false;
    }

    if (
      minCarbs !== undefined &&
      carbs < Number(minCarbs)
    ) {
      return false;
    }

    if (
      maxCarbs !== undefined &&
      carbs > Number(maxCarbs)
    ) {
      return false;
    }

    if (
      minFat !== undefined &&
      fat < Number(minFat)
    ) {
      return false;
    }

    if (
      maxFat !== undefined &&
      fat > Number(maxFat)
    ) {
      return false;
    }

    if (
      minFiber !== undefined &&
      fiber < Number(minFiber)
    ) {
      return false;
    }

    if (
      maxFiber !== undefined &&
      fiber > Number(maxFiber)
    ) {
      return false;
    }

    return true;
  });

  const sortDirection = order.toLowerCase() === "desc" ? -1 : 1;

  filteredFoods.sort((a, b) => {
    if (sort === "calories") {
      return (
        (Number(a.base_calories) - Number(b.base_calories)) *
        sortDirection
      );
    }

    if (sort === "protein") {
      return (
        (Number(a.base_protein) - Number(b.base_protein)) *
        sortDirection
      );
    }

    if (sort === "carbs") {
      return (
        (Number(a.base_carbs) - Number(b.base_carbs)) *
        sortDirection
      );
    }

    if (sort === "fat") {
      return (
        (Number(a.base_fat) - Number(b.base_fat)) *
        sortDirection
      );
    }

    if (sort === "fiber") {
      return (
        (Number(a.base_fiber) - Number(b.base_fiber)) *
        sortDirection
      );
    }

    if (sort === "created_at") {
      return (
        (new Date(a.created_at) - new Date(b.created_at)) *
        sortDirection
      );
    }

    const nameComparison = a.name.localeCompare(b.name);

    if (nameComparison !== 0) {
      return nameComparison * sortDirection;
    }

    if (normalizedSearch) {
      const aStarts = a.name
        .toLowerCase()
        .startsWith(normalizedSearch);

      const bStarts = b.name
        .toLowerCase()
        .startsWith(normalizedSearch);

      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }
    }

    return Number(a.id) - Number(b.id);
  });

  const total = filteredFoods.length;

  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 20, 1);

  const offset = (normalizedPage - 1) * normalizedLimit;

  const paginatedFoods = filteredFoods.slice(
    offset,
    offset + normalizedLimit
  );

  const mappedFoods = paginatedFoods.map((food) => ({
    id: food.id.toString(),
    category_id: food.category_id.toString(),
    name: food.name,
    slug: food.slug,
    description: food.description,
    image_url: food.image_url,
    base_calories: food.base_calories,
    base_protein: food.base_protein,
    base_carbs: food.base_carbs,
    base_fat: food.base_fat,
    base_fiber: food.base_fiber,
    is_active: food.is_active,
    created_at: food.created_at,
    updated_at: food.updated_at,
    urdu_name: food.urdu_name,
    region: food.region,
    subcategory: food.subcategory,
    image_source: food.image_source,
    nutrition_basis: food.nutrition_basis,
    serving_g: food.serving_g,
    serving_label: food.serving_label,
    oil_g: food.oil_g,
    oil_kcal: food.oil_kcal,
    meat_grams: food.meat_grams,

    category: food.food_categories
      ? {
          id: food.food_categories.id.toString(),
          name: food.food_categories.name,
          slug: food.food_categories.slug,
        }
      : null,

    metadata: food.food_metadata
      ? {
          cooking_method: food.food_metadata.cooking_method,
          ingredients:
            Array.isArray(food.food_metadata.ingredients) &&
            food.food_metadata.ingredients.length === 0
              ? null
              : food.food_metadata.ingredients,
          tags: Array.isArray(food.food_metadata.tags)
            ? food.food_metadata.tags
            : [],
          notes: food.food_metadata.notes,
        }
      : null,
  }));

  return {
    foods: mappedFoods,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages: Math.ceil(total / normalizedLimit),
  };
};

export const findFoodRegions = async () => {
  const foods = await prisma.foods.findMany({
    where: {
      is_active: true,
      region: {
        not: null,
      },
    },
    select: {
      region: true,
    },
  });

  const regionCounts = new Map();

  for (const food of foods) {
    const region = food.region?.trim();

    if (!region) {
      continue;
    }

    regionCounts.set(
      region,
      (regionCounts.get(region) || 0) + 1
    );
  }

  return Array.from(regionCounts.entries())
    .map(([region, foodCount]) => ({
      region,
      foodCount,
    }))
    .sort((a, b) => {
      if (b.foodCount !== a.foodCount) {
        return b.foodCount - a.foodCount;
      }

      return a.region.localeCompare(b.region);
    });
};

export const findFoodCategories = async (region = "") => {
  const normalizedRegion = region.trim();

  const foods = await prisma.foods.findMany({
    where: {
      is_active: true,

      ...(normalizedRegion
        ? {
            region: normalizedRegion,
          }
        : {}),
    },

    select: {
      category_id: true,
    },
  });

  const categoryCounts = new Map();

  for (const food of foods) {
    const categoryId = food.category_id.toString();

    categoryCounts.set(
      categoryId,
      (categoryCounts.get(categoryId) || 0) + 1
    );
  }

  const categories = await prisma.food_categories.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return categories
    .filter((category) => {
      const count =
        categoryCounts.get(category.id.toString()) || 0;

      return count > 0;
    })
    .map((category) => ({
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      food_count:
        categoryCounts.get(category.id.toString()) || 0,
    }))
    .sort((a, b) => {
      if (b.food_count !== a.food_count) {
        return b.food_count - a.food_count;
      }

      return a.name.localeCompare(b.name);
    });
};

export const findFoodById = async (foodId) => {
  const food = await prisma.foods.findFirst({
    where: {
      id: BigInt(foodId),
      is_active: true,
    },

    select: {
      id: true,
      category_id: true,
      name: true,
      slug: true,
      description: true,
      image_url: true,
      base_calories: true,
      base_protein: true,
      base_carbs: true,
      base_fat: true,
      base_fiber: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      urdu_name: true,
      region: true,
      subcategory: true,
      image_source: true,
      nutrition_basis: true,
      serving_g: true,
      serving_label: true,
      oil_g: true,
      oil_kcal: true,
      meat_grams: true,

      food_categories: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      food_metadata: {
        select: {
          cooking_method: true,
          ingredients: true,
          tags: true,
          notes: true,
        },
      },

      food_servings: {
        orderBy: [
          {
            sort_order: "asc",
          },
          {
            id: "asc",
          },
        ],
      },

      food_options: {
        orderBy: [
          {
            sort_order: "asc",
          },
          {
            id: "asc",
          },
        ],

        include: {
          food_option_values: {
            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          },
        },
      },

      recipes: {
        where: {
          is_active: true,
        },

        include: {
          recipe_ingredients: {
            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          },
        },
      },
    },
  });

  if (!food) {
    return null;
  }

  return {
    id: food.id.toString(),
    category_id: food.category_id.toString(),
    name: food.name,
    slug: food.slug,
    description: food.description,
    image_url: food.image_url,
    base_calories: food.base_calories,
    base_protein: food.base_protein,
    base_carbs: food.base_carbs,
    base_fat: food.base_fat,
    base_fiber: food.base_fiber,
    is_active: food.is_active,
    created_at: food.created_at,
    updated_at: food.updated_at,
    urdu_name: food.urdu_name,
    region: food.region,
    subcategory: food.subcategory,
    image_source: food.image_source,
    nutrition_basis: food.nutrition_basis,
    serving_g: food.serving_g,
    serving_label: food.serving_label,
    oil_g: food.oil_g,
    oil_kcal: food.oil_kcal,
    meat_grams: food.meat_grams,

    category: food.food_categories
      ? {
          id: food.food_categories.id.toString(),
          name: food.food_categories.name,
          slug: food.food_categories.slug,
        }
      : null,

    metadata: food.food_metadata
      ? {
          cooking_method: food.food_metadata.cooking_method,
          ingredients:
            Array.isArray(food.food_metadata.ingredients) &&
            food.food_metadata.ingredients.length === 0
              ? null
              : food.food_metadata.ingredients,
          tags: Array.isArray(food.food_metadata.tags)
            ? food.food_metadata.tags
            : [],
          notes: food.food_metadata.notes,
        }
      : null,

    servings: food.food_servings.map((serving) => ({
      id: serving.id.toString(),
      food_id: serving.food_id.toString(),
      name: serving.name,
      unit: serving.unit,
      amount: serving.amount,
      amount_unit: serving.amount_unit,
      sort_order: serving.sort_order,
      is_default: serving.is_default,
      created_at: serving.created_at,
      edible_weight_g: serving.edible_weight_g,
      per_unit_g: serving.per_unit_g,
    })),

    options: food.food_options.map((option) => ({
      id: option.id.toString(),
      food_id: option.food_id.toString(),
      key: option.key,
      label: option.label,
      inputType: option.input_type,
      isRequired: option.is_required,
      sortOrder: option.sort_order,
      createdAt: option.created_at,

      values: option.food_option_values.map((value) => ({
        id: value.id.toString(),
        optionId: value.option_id.toString(),
        key: value.key,
        label: value.label,
        caloriesDelta: value.calories_delta,
        proteinDelta: value.protein_delta,
        carbsDelta: value.carbs_delta,
        fatDelta: value.fat_delta,
        fiberDelta: value.fiber_delta,
        amount: value.amount,
        amountUnit: value.amount_unit,
        sortOrder: value.sort_order,
        isDefault: value.is_default,
        createdAt: value.created_at,
      })),
    })),

    recipe: food.recipes
      ? [
          {
            id: food.recipes.id.toString(),
            food_id: food.recipes.food_id.toString(),
            name: food.recipes.name,
            description: food.recipes.description,
            default_servings: food.recipes.default_servings,
            estimated: food.recipes.estimated,

            ingredients:
              food.recipes.recipe_ingredients.map((ingredient) => ({
                id: ingredient.id.toString(),
                name: ingredient.name,
                foodId: ingredient.food_id
                  ? ingredient.food_id.toString()
                  : null,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                per100: ingredient.per100,
                sortOrder: ingredient.sort_order,
                isOptional: ingredient.is_optional,
              })),
          },
        ]
      : [],
  };
};

