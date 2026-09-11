import {
  findGoalByUserId,
  updateGoal,
  insertGoalChange,
} from "../repositories/goalRepository.js";
export const getUserGoal = async (userId) => {
  const goal = await findGoalByUserId(userId);

  if (!goal) {
    const error = new Error("Goal not found");
    error.statusCode = 404;
    throw error;
  }

  return goal;
};
export const updateUserGoal = async ({
  userId,
  dailyCalorieGoal,
  weightLossGoal,
  weightLossMonths,
}) => {
  const existing = await findGoalByUserId(userId);

  if (!existing) {
    const error = new Error("Goal not found");
    error.statusCode = 404;
    throw error;
  }

  const goal = await updateGoal({
    userId,
    dailyCalorieGoal,
    weightLossGoalKg: weightLossGoal,
    weightLossMonths,
  });

  // Record the calorie-goal change so per-day history can show the goal that
  // was actually active that day. No-op changes are skipped.
  if (Number(dailyCalorieGoal) !== Number(existing.daily_calorie_goal)) {
    await insertGoalChange({
      userId,
      dailyCalorieGoal,
      changedOn: new Date().toISOString().slice(0, 10),
    });
  }

  return goal;
};