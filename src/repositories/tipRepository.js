import { query } from "../config/database.js";

const getDb = (client) => client || { query };

export const findActiveTips = async (client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       id,
       text,
       icon,
       sort_order
     FROM daily_tips
     WHERE is_active = true
     ORDER BY sort_order ASC, id ASC`
  );

  return result.rows;
};