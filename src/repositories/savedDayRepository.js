import { query } from "../config/database.js";

const getDb = (client) => client || { query };

// Saved-day snapshot columns, cast to float so node-pg returns numbers.
const SAVED_COLUMNS = `
  id,
  user_id,
  eaten_on::text AS eaten_on,
  calories::float AS calories,
  protein::float AS protein,
  carbs::float AS carbs,
  fat::float AS fat,
  fiber::float AS fiber,
  created_at,
  updated_at
`;

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
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO saved_days (
       user_id,
       eaten_on,
       calories,
       protein,
       carbs,
       fat,
       fiber
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, eaten_on)
     DO UPDATE SET
       calories = EXCLUDED.calories,
       protein = EXCLUDED.protein,
       carbs = EXCLUDED.carbs,
       fat = EXCLUDED.fat,
       fiber = EXCLUDED.fiber,
       updated_at = CURRENT_TIMESTAMP
     RETURNING ${SAVED_COLUMNS}`,
    [userId, eatenOn, calories, protein, carbs, fat, fiber]
  );

  return result.rows[0];
};

export const findSavedDayByDate = async ({ userId, eatenOn }, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT ${SAVED_COLUMNS}
     FROM saved_days
     WHERE user_id = $1 AND eaten_on = $2`,
    [userId, eatenOn]
  );

  return result.rows[0] || null;
};

export const findSavedDays = async ({ userId, from = null, to = null }, client) => {
  const db = getDb(client);

  const conditions = ["user_id = $1"];
  const params = [userId];

  if (from) {
    params.push(from);
    conditions.push(`eaten_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`eaten_on <= $${params.length}`);
  }

  const result = await db.query(
    `SELECT ${SAVED_COLUMNS}
     FROM saved_days
     WHERE ${conditions.join(" AND ")}
     ORDER BY eaten_on DESC`,
    params
  );

  return result.rows;
};