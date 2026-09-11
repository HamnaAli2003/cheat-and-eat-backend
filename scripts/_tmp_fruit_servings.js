import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(
  `SELECT fs.id, fs.food_id, f.name, fs.name, fs.unit, fs.amount, fs.amount_unit, fs.sort_order, fs.is_default
   FROM food_servings fs JOIN foods f ON f.id = fs.food_id
   WHERE fs.food_id IN (15,14,1456,1450,1441,1399,1460,1444)
   ORDER BY fs.food_id, fs.sort_order`
);
console.table(r.rows);
await pool.end();