import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const fruits = await pool.query(
  `SELECT f.id, f.name, c.name AS cat, f.serving_g, f.serving_label,
          f.base_calories, f.base_protein, f.base_carbs, f.base_fat, f.base_fiber
   FROM foods f JOIN food_categories c ON c.id = f.category_id
   WHERE c.slug IN ('fruit','fruits','produce') OR c.name ILIKE '%fruit%'
   ORDER BY f.name`
);
console.log('=== FRUIT CATEGORY FOODS ===');
console.table(fruits.rows);

const cats = await pool.query('SELECT id, name, slug FROM food_categories ORDER BY id');
console.log('=== CATEGORIES ===');
console.table(cats.rows);

await pool.end();