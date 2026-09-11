import {
  findMeals,
  insertMeal,
  deleteMealById,
  findDailyMealAggregates,
  deleteMealsByDate,
  sumMealsByDate,
} from "../repositories/mealRepository.js";
import {
  upsertSavedDay,
  findSavedDays,
} from "../repositories/savedDayRepository.js";
import { findGoalChangesUntil, findGoalByUserId } from "../repositories/goalRepository.js";
import { findUserById } from "../repositories/userRepository.js";
import { withTransaction } from "../config/database.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

export const listMeals = async ({ userId, date, from, to, limit, offset }) => {
  return findMeals({ userId, date, from, to, limit, offset });
};

export const createMeal = async ({ userId, date, ...payload }) => {
  const eatenOn = date || todayKey();

  return insertMeal({
    userId,
    eatenOn,
    ...payload,
  });
};

export const removeMeal = async ({ userId, mealId }) => {
  const deleted = await deleteMealById({ id: mealId, userId });

  if (!deleted) {
    const error = new Error("Meal not found");
    error.statusCode = 404;
    throw error;
  }

  return deleted;
};

export const getMealHistory = async ({ userId, days = 14 }) => {
  const to = todayKey();

  // Clamp the window start to the account creation date so we never
  // return fabricated empty rows from before the user existed.
  const user = await findUserById(userId);
  const createdDate = user?.created_at
    ? new Date(user.created_at).toISOString().slice(0, 10)
    : "2000-01-01";

  const computedFrom = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() - (days - 1)
    )
  )
    .toISOString()
    .slice(0, 10);

  const from = computedFrom < createdDate ? createdDate : computedFrom;

  const [aggregates, goalChanges, goal, savedDays] = await Promise.all([
    findDailyMealAggregates({ userId, from, to }),
    findGoalChangesUntil({ userId, until: to }),
    findGoalByUserId(userId),
    findSavedDays({ userId, from, to }),
  ]);

  const aggregateByDate = new Map(aggregates.map((day) => [day.date_key, day]));
  for (const savedDay of savedDays) {
    if (!aggregateByDate.has(savedDay.eaten_on)) {
      aggregateByDate.set(savedDay.eaten_on, {
        date_key: savedDay.eaten_on,
        consumed: savedDay.calories,
        count: 1,
        last_at: savedDay.updated_at,
      });
    }
  }

  const currentGoal = Number(goal?.daily_calorie_goal) || 2000;

  const goalFor = (dateKey) => {
    let g = currentGoal;
    for (const change of goalChanges) {
      if (change.changed_on <= dateKey) {
        g = Number(change.daily_calorie_goal);
      } else {
        break;
      }
    }
    return g;
  };

  // Return only days where the user actually logged food — no empty rows.
  return Array.from(aggregateByDate.values())
    .slice()
    .sort((a, b) => (a.date_key > b.date_key ? -1 : 1))
    .map((day) => {
      const consumed = Math.round(day.consumed || 0);
      const dayGoal = goalFor(day.date_key);
      return {
        dateKey: day.date_key,
        consumed,
        count: day.count,
        dayGoal,
        lastAt: day.last_at || null,
        pct: dayGoal
          ? Math.min(Math.round((consumed / dayGoal) * 100), 999)
          : 0,
      };
    });
};

export const saveDayProgress = async ({ userId, date }) => {
  const eatenOn = date || todayKey();
  return withTransaction(async (client) => {
    const sums = await sumMealsByDate({ userId, eatenOn }, client);

    if (!sums || sums.meal_count === 0) {
      const error = new Error("No meals logged for this day to save.");
      error.statusCode = 400;
      throw error;
    }

    const saved = await upsertSavedDay({
      userId,
      eatenOn,
      calories: Math.round(sums.calories || 0),
      protein: Math.round(sums.protein || 0),
      carbs: Math.round(sums.carbs || 0),
      fat: Math.round(sums.fat || 0),
      fiber: Math.round(sums.fiber || 0),
    }, client);

    await deleteMealsByDate({ userId, eatenOn }, client);
    return saved;
  });
};

export const clearDayProgress = async ({ userId, date }) => {
  const eatenOn = date || todayKey();

  return withTransaction(async (client) => {
    await deleteMealsByDate({ userId, eatenOn }, client);
    return { removedFor: eatenOn, mealsDeleted: true, wasSaved: true };
  });
};

export const getSavedDays = async ({ userId }) => {
  return findSavedDays({ userId });
};

export const isDaySaved = async ({ userId, eatenOn }) => {
  const row = await findSavedDayByDate({ userId, eatenOn });
  return !!row;
};