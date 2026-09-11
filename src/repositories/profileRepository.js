import { query } from "../config/database.js";

const getDb = (client) => client || { query };

export const findProfileByUserId = async (userId, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       p.id,
       p.user_id,
       p.age,
       p.gender,
       p.height_cm,
       p.weight_kg,
       p.activity,
       p.created_at,
       p.updated_at
     FROM profiles p
     WHERE p.user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

export const createProfile = async (
  {
    userId,
    age,
    gender,
    heightCm,
    weightKg,
    activity,
  },
  client
) => {
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO profiles (
       user_id,
       age,
       gender,
       height_cm,
       weight_kg,
       activity
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       user_id,
       age,
       gender,
       height_cm,
       weight_kg,
       activity,
       created_at,
       updated_at`,
    [userId, age, gender, heightCm, weightKg, activity]
  );

  return result.rows[0];
};

export const updateProfile = async (
  {
    userId,
    age,
    gender,
    heightCm,
    weightKg,
    activity,
  },
  client
) => {
  const db = getDb(client);

  const result = await db.query(
    `UPDATE profiles
     SET
       age = $2,
       gender = $3,
       height_cm = $4,
       weight_kg = $5,
       activity = $6,
       updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING
       id,
       user_id,
       age,
       gender,
       height_cm,
       weight_kg,
       activity,
       created_at,
       updated_at`,
    [userId, age, gender, heightCm, weightKg, activity]
  );

  return result.rows[0] || null;
};