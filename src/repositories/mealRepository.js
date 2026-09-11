import { query } from "../config/database.js";

const getDb = (client) => client || { query };

// Snapshot shape returned to the API. Numeric columns are cast to float so
// node-pg does not hand back string decimals, and the date is cast to text so
// the day value survives timezone shifts on the wire.
const MEAL_COLUMNS = `
  id,
  user_id,
  food_id,
  name,
  image_url,
  portion,
  meal_type,
  calories::float AS calories,
  protein::float AS protein,
  carbs::float AS carbs,
  fat::float AS fat,
  fiber::float AS fiber,
  eaten_on::text AS eaten_on,
  created_at
`;

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
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO meals (
       user_id,
       food_id,
       name,
       image_url,
       portion,
       meal_type,
       calories,
       protein,
       carbs,
       fat,
       fiber,
       eaten_on
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ${MEAL_COLUMNS}`,
    [
      userId,
      foodId,
      name,
      imageUrl,
      portion,
      mealType,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      eatenOn,
    ]
  );

  return result.rows[0];
};

export const findMeals = async (
  { userId, date, from, to, limit = 48, offset = 0 },
  client
) => {
  const db = getDb(client);

  const conditions = ["user_id = $1"];
  const params = [userId];

  if (date) {
    params.push(date);
    conditions.push(`eaten_on = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`eaten_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`eaten_on <= $${params.length}`);
  }

  params.push(limit, offset);

  const result = await db.query(
    `SELECT ${MEAL_COLUMNS}
     FROM meals
     WHERE ${conditions.join(" AND ")}
     ORDER BY eaten_on DESC, id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return result.rows;
};

export const deleteMealById = async ({ id, userId }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `DELETE FROM meals
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );

  return result.rows[0] || null;
};

export const findMealById = async ({ id, userId }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT ${MEAL_COLUMNS}
     FROM meals
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return result.rows[0] || null;
};

export const deleteMealsByDate = async ({ userId, eatenOn }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `DELETE FROM meals
     WHERE user_id = $1 AND eaten_on = $2
     RETURNING id`,
    [userId, eatenOn]
  );

  return result.rows;
};

export const sumMealsByDate = async ({ userId, eatenOn }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       COALESCE(SUM(calories)::float, 0) AS calories,
       COALESCE(SUM(protein)::float, 0) AS protein,
       COALESCE(SUM(carbs)::float, 0) AS carbs,
       COALESCE(SUM(fat)::float, 0) AS fat,
       COALESCE(SUM(fiber)::float, 0) AS fiber,
       COUNT(*)::int AS meal_count
     FROM meals
     WHERE user_id = $1 AND eaten_on = $2`,
    [userId, eatenOn]
  );

  return result.rows[0];
};

export const findDailyMealAggregates = async ({ userId, from, to }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       eaten_on::text AS date_key,
       COUNT(*)::int AS count,
       COALESCE(SUM(calories)::float, 0) AS consumed,
       MAX(created_at) AS last_at
     FROM meals
     WHERE user_id = $1 AND eaten_on BETWEEN $2 AND $3
     GROUP BY eaten_on`,
    [userId, from, to]
  );

  return result.rows;
};