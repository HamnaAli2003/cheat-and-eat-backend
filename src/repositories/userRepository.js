import { query } from "../config/database.js";

const getDb = (client) => client || { query };

export const findUserByEmail = async (email, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       id,
       name,
       email,
       password_hash,
       role,
       created_at,
       updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

export const createUser = async (
  { name, email, passwordHash },
  client
) => {
  const db = getDb(client);

  const result = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING
       id,
       name,
       email,
       role,
       created_at,
       updated_at`,
    [name, email, passwordHash]
  );

  return result.rows[0];
};

export const findUserById = async (id, client) => {
  const db = getDb(client);

  const result = await db.query(
    `SELECT
       id,
       name,
       email,
       role,
       created_at,
       updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};