import prisma from "../config/prisma.js";

const mapSavedDay = (savedDay) => ({
  id: savedDay.id.toString(),
  user_id: savedDay.user_id.toString(),
  eaten_on:
    savedDay.eaten_on instanceof Date
      ? savedDay.eaten_on.toISOString().slice(0, 10)
      : String(savedDay.eaten_on),
  calories: Number(savedDay.calories),
  protein: Number(savedDay.protein),
  carbs: Number(savedDay.carbs),
  fat: Number(savedDay.fat),
  fiber: Number(savedDay.fiber),
  created_at: savedDay.created_at,
  updated_at: savedDay.updated_at,
});

export const upsertSavedDay = async (
  {
    userId,
    eatenOn,
    calories,
    protein,
    carbs,
    fat,
    fiber,
  },
  client
) => {
  const savedDay = await prisma.saved_days.upsert({
    where: {
      user_id_eaten_on: {
        user_id: BigInt(userId),
        eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
      },
    },
    create: {
      user_id: BigInt(userId),
      eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
      calories,
      protein,
      carbs,
      fat,
      fiber,
    },
    update: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      updated_at: new Date(),
    },
  });

  return mapSavedDay(savedDay);
};

export const findSavedDayByDate = async (
  { userId, eatenOn },
  client
) => {
  const savedDay = await prisma.saved_days.findUnique({
    where: {
      user_id_eaten_on: {
        user_id: BigInt(userId),
        eaten_on: new Date(`${eatenOn}T00:00:00.000Z`),
      },
    },
  });

  return savedDay ? mapSavedDay(savedDay) : null;
};

export const findSavedDays = async (
  { userId, from = null, to = null },
  client
) => {
  const where = {
    user_id: BigInt(userId),
  };

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

  const savedDays = await prisma.saved_days.findMany({
    where,
    orderBy: {
      eaten_on: "desc",
    },
  });

  return savedDays.map(mapSavedDay);
};
