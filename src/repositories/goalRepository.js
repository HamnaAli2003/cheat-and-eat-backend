import prisma from "../config/prisma.js";

export const findGoalByUserId = async (userId) => {
  return prisma.goals.findUnique({
    where: {
      user_id: BigInt(userId),
    },
    select: {
      id: true,
      user_id: true,
      daily_calorie_goal: true,
      weight_loss_goal_kg: true,
      weight_loss_months: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const insertGoalChange = async ({
  userId,
  dailyCalorieGoal,
  changedOn,
}) => {
  return prisma.goal_changes.create({
    data: {
      user_id: BigInt(userId),
      daily_calorie_goal: dailyCalorieGoal,
      changed_on: changedOn,
    },
    select: {
      id: true,
    },
  });
};

export const findGoalChangesUntil = async ({ userId, until }) => {
  const untilDate = new Date(`${until}T00:00:00.000Z`);

  return prisma.goal_changes.findMany({
    where: {
      user_id: BigInt(userId),
      changed_on: {
        lte: untilDate,
      },
    },
    orderBy: [
      {
        changed_on: "asc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      daily_calorie_goal: true,
      changed_on: true,
    },
  });
};

export const createGoal = async ({
  userId,
  dailyCalorieGoal,
  weightLossGoalKg,
  weightLossMonths,
}) => {
  return prisma.goals.create({
    data: {
      user_id: BigInt(userId),
      daily_calorie_goal: dailyCalorieGoal,
      weight_loss_goal_kg: weightLossGoalKg,
      weight_loss_months: weightLossMonths,
    },
    select: {
      id: true,
      user_id: true,
      daily_calorie_goal: true,
      weight_loss_goal_kg: true,
      weight_loss_months: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const updateGoal = async ({
  userId,
  dailyCalorieGoal,
  weightLossGoalKg,
  weightLossMonths,
}) => {
  return prisma.goals.update({
    where: {
      user_id: BigInt(userId),
    },
    data: {
      daily_calorie_goal: dailyCalorieGoal,
      weight_loss_goal_kg: weightLossGoalKg,
      weight_loss_months: weightLossMonths,
    },
    select: {
      id: true,
      user_id: true,
      daily_calorie_goal: true,
      weight_loss_goal_kg: true,
      weight_loss_months: true,
      created_at: true,
      updated_at: true,
    },
  });
};