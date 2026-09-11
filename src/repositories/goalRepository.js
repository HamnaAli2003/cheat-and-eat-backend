import { query } from "../config/database.js";

const getDb = (client) => client || { query };

export const findGoalByUserId = async (userId, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       id,
       user_id,
       daily_calorie_goal,
       weight_loss_goal_kg,
       weight_loss_months,
       created_at,
       updated_at
     FROM goals
     WHERE user_id = $1`,
    [userId]
  );

return result.rows[0] || null;
};

export const insertGoalChange = async (
  { userId, dailyCalorieGoal, changedOn },
  client
) => {
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO goal_changes (user_id, daily_calorie_goal, changed_on)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, dailyCalorieGoal, changedOn]
  );

  return result.rows[0] || null;
};

export const findGoalChangesUntil = async ({ userId, until }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       daily_calorie_goal,
       changed_on::text AS changed_on
     FROM goal_changes
     WHERE user_id = $1 AND changed_on <= $2
     ORDER BY changed_on ASC, id ASC`,
    [userId, until]
  );

  return result.rows;
};

export const createGoal = async ({
  userId,
  dailyCalorieGoal,
  weightLossGoalKg,
  weightLossMonths,
}, client) => {
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO goals (
       user_id,
       daily_calorie_goal,
       weight_loss_goal_kg,
       weight_loss_months
     )
     VALUES ($1, $2, $3, $4)
     RETURNING
       id,
       user_id,
       daily_calorie_goal,
       weight_loss_goal_kg,
       weight_loss_months,
       created_at,
       updated_at`,
    [userId, dailyCalorieGoal, weightLossGoalKg, weightLossMonths]
  );

  return result.rows[0];
};

export const updateGoal = async ({
  userId,
  dailyCalorieGoal,
  weightLossGoalKg,
  weightLossMonths,
}, client) => {
  const db = getDb(client);

  const result = await db.query(
    `UPDATE goals
     SET
       daily_calorie_goal = $2,
       weight_loss_goal_kg = $3,
       weight_loss_months = $4,
       updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING
       id,
       user_id,
       daily_calorie_goal,
       weight_loss_goal_kg,
       weight_loss_months,
       created_at,
       updated_at`,
    [userId, dailyCalorieGoal, weightLossGoalKg, weightLossMonths]
  );

  return result.rows[0] || null;
};