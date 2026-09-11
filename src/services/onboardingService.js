import { withTransaction } from "../config/database.js";

import {
  findUserById,
} from "../repositories/userRepository.js";

import {
  findProfileByUserId,
  createProfile,
  updateProfile,
} from "../repositories/profileRepository.js";

import {
  findGoalByUserId,
  createGoal,
  updateGoal,
  insertGoalChange,
} from "../repositories/goalRepository.js";

export const saveOnboarding = async ({
  userId,
  name,
  age,
  gender,
  height,
  weight,
  activity,
  goal,
  weightLossGoal,
  weightLossMonths,
}) => {
  return withTransaction(async (client) => {
    // 1. Check that authenticated user exists
    const user = await findUserById(userId, client);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // 2. Update user's name
    const userResult = await client.query(
      `UPDATE users
       SET
         name = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING
         id,
         name,
         email,
         role,
         created_at,
         updated_at`,
      [userId, name]
    );

    // 3. Create or update profile
    const existingProfile = await findProfileByUserId(userId, client);

    let profile;

    if (existingProfile) {
      profile = await updateProfile(
        {
          userId,
          age,
          gender,
          heightCm: height,
          weightKg: weight,
          activity,
        },
        client
      );
    } else {
      profile = await createProfile(
        {
          userId,
          age,
          gender,
          heightCm: height,
          weightKg: weight,
          activity,
        },
        client
      );
    }

    // 4. Create or update goal
    const existingGoal = await findGoalByUserId(userId, client);

    let savedGoal;

    if (existingGoal) {
      savedGoal = await updateGoal(
        {
          userId,
          dailyCalorieGoal: goal,
          weightLossGoalKg: weightLossGoal,
          weightLossMonths,
        },
        client
      );
    } else {
      savedGoal = await createGoal(
        {
          userId,
          dailyCalorieGoal: goal,
          weightLossGoalKg: weightLossGoal,
          weightLossMonths,
        },
        client
      );
    }

    // 5. Record the calorie-goal value so per-day history reflects the goal
    //    active on each day. Only log when the value actually changed or the
    //    goal row is brand new.
    const goalChanged =
      !existingGoal ||
      Number(goal) !== Number(existingGoal.daily_calorie_goal);
    if (goalChanged) {
      await insertGoalChange(
        {
          userId,
          dailyCalorieGoal: goal,
          changedOn: new Date().toISOString().slice(0, 10),
        },
        client
      );
    }

    return {
      user: userResult.rows[0],
      profile,
      goal: savedGoal,
    };
  });
};