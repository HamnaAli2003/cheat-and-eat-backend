import {
  listMeals,
  createMeal,
  removeMeal,
  getMealHistory,
  saveDayProgress,
  clearDayProgress,
  getSavedDays,
} from "../services/mealService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listMealsController = asyncHandler(async (req, res) => {
  const { date, from, to, limit, offset } = req.validatedQuery;

  const meals = await listMeals({
    userId: req.user.userId,
    date,
    from,
    to,
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    meals,
  });
});

export const createMealController = asyncHandler(async (req, res) => {
  const meal = await createMeal({
    userId: req.user.userId,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: "Meal added successfully",
    meal,
  });
});

export const deleteMealController = asyncHandler(async (req, res) => {
  const { id } = req.validatedParams;

  await removeMeal({
    userId: req.user.userId,
    mealId: id,
  });

  res.status(200).json({
    success: true,
    message: "Meal removed successfully",
  });
});

export const getMealHistoryController = asyncHandler(async (req, res) => {
  const { days } = req.validatedQuery;

  const history = await getMealHistory({
    userId: req.user.userId,
    days,
  });

  res.status(200).json({
    success: true,
    history,
  });
});

export const saveDayController = asyncHandler(async (req, res) => {
  const { date } = req.body;

  const saved = await saveDayProgress({
    userId: req.user.userId,
    date,
  });

  res.status(200).json({
    success: true,
    message: "Today's progress saved",
    saved,
  });
});

export const clearDayController = asyncHandler(async (req, res) => {
  const { date } = req.validatedParams;

  const result = await clearDayProgress({
    userId: req.user.userId,
    date,
  });

  res.status(200).json({
    success: true,
    message: "Today's data cleared",
    ...result,
  });
});

export const getSavedDaysController = asyncHandler(async (req, res) => {
  const savedDays = await getSavedDays({
    userId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    savedDays,
  });
});