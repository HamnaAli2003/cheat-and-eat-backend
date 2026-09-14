import prisma from "../config/prisma.js";

const mapMeal = (meal) => ({
  id: meal.id.toString(),
  user_id: meal.user_id.toString(),
  food_id: meal.food_id ? meal.food_id.toString() : null,
  name: meal.name,
  image_url: meal.image_url,
  portion: meal.portion,
  meal_type: meal.meal_type,
  calories: Number(meal.calories),
  protein: Number(meal.protein),
  carbs: Number(meal.carbs),
  fat: Number(meal.fat),
  fiber: Number(meal.fiber),
  eaten_on:
    meal.eaten_on instanceof Date
      ? meal.eaten_on.toISOString().slice(0, 10)
      : String(meal.eaten_on),
  created_at: meal.created_at,
});

export const insertMeal = async (
  {
    userId,
    foodId = null,
    name,
    imageUrl = null,
    portion = null,
    mealType,
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    fiber = 0,
    eatenOn,
  },
  client
) => {
  const meal = await prisma.meals.create({
    data: {
      user_id: BigInt(userId),
      food_id: foodId !== null ? BigInt(foodId) : null,
      name,
      image_url: imageUrl,
      portion,
      meal_type: mealType,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
    },
  });

  return mapMeal(meal);
};

export const findMeals = async (
  { userId, date, from, to, limit = 48, offset = 0 },
  client
) => {
  const where = {
    user_id: BigInt(userId),
  };

  if (date) {
    where.eaten_on = new Date(`${date}T00:00:00.000Z`);
  } else {
    if (from || to) {
      where.eaten_on = {};

      if (from) {
        where.eaten_on.gte = new Date(
          `${from}T00:00:00.000Z`
        );
      }

      if (to) {
        where.eaten_on.lte = new Date(
          `${to}T00:00:00.000Z`
        );
      }
    }
  }

  const meals = await prisma.meals.findMany({
    where,
    orderBy: [
      {
        eaten_on: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: Number(limit),
    skip: Number(offset),
  });

  return meals.map(mapMeal);
};

export const deleteMealById = async ({ id, userId }, client) => {
  const meal = await prisma.meals.deleteMany({
    where: {
      id: BigInt(id),
      user_id: BigInt(userId),
    },
  });

  if (meal.count === 0) {
    return null;
  }

  return {
    id: BigInt(id).toString(),
  };
};

export const findMealById = async ({ id, userId }, client) => {
  const meal = await prisma.meals.findFirst({
    where: {
      id: BigInt(id),
      user_id: BigInt(userId),
    },
  });

  return meal ? mapMeal(meal) : null;
};

export const deleteMealsByDate = async (
  { userId, eatenOn },
  client
) => {
  const meals = await prisma.meals.findMany({
    where: {
      user_id: BigInt(userId),
      eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
    },
    select: {
      id: true,
    },
  });

  if (meals.length === 0) {
    return [];
  }

  await prisma.meals.deleteMany({
    where: {
      user_id: BigInt(userId),
      eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
    },
  });

  return meals.map((meal) => ({
    id: meal.id.toString(),
  }));
};

export const sumMealsByDate = async (
  { userId, eatenOn },
  client
) => {
  const result = await prisma.meals.aggregate({
    where: {
      user_id: BigInt(userId),
      eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
    },
    _sum: {
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    calories: Number(result._sum.calories || 0),
    protein: Number(result._sum.protein || 0),
    carbs: Number(result._sum.carbs || 0),
    fat: Number(result._sum.fat || 0),
    fiber: Number(result._sum.fiber || 0),
    meal_count: result._count._all,
  };
};

export const findDailyMealAggregates = async (
  { userId, from, to },
  client
) => {
  const meals = await prisma.meals.findMany({
    where: {
      user_id: BigInt(userId),
      eaten_on: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T00:00:00.000Z`),
      },
    },
    select: {
      eaten_on: true,
      calories: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const aggregates = new Map();

  for (const meal of meals) {
    const dateKey =
      meal.eaten_on instanceof Date
        ? meal.eaten_on.toISOString().slice(0, 10)
        : String(meal.eaten_on);

    if (!aggregates.has(dateKey)) {
      aggregates.set(dateKey, {
        date_key: dateKey,
        count: 0,
        consumed: 0,
        last_at: meal.created_at,
      });
    }

    const aggregate = aggregates.get(dateKey);

    aggregate.count += 1;
    aggregate.consumed += Number(meal.calories);

    if (meal.created_at > aggregate.last_at) {
      aggregate.last_at = meal.created_at;
    }
  }

  return Array.from(aggregates.values());
};
