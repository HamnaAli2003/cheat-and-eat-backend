import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const s = await pool.query('SELECT food_id, COUNT(*) FROM food_servings GROUP BY food_id ORDER BY food_id LIMIT 40');
console.log('=== FOOD SERVINGS USAGE (first 40 foods) ===');
console.table(s.rows);
const total = await pool.query('SELECT COUNT(*) FROM food_servings');
console.log('total servings rows:', total.rows[0].count);

const ings = await pool.query(
  `SELECT f.id, f.name, f.base_calories, f.base_protein, f.base_carbs, f.base_fat
   FROM foods f
   WHERE f.is_active = true AND (
     LOWER(f.name) LIKE '%rice%' OR LOWER(f.name) LIKE '%chicken%' OR LOWER(f.name) LIKE '%mutton%'
     OR LOWER(f.name) LIKE '%oil%' OR LOWER(f.name) LIKE '%ghee%' OR LOWER(f.name) LIKE '%yogurt%'
     OR LOWER(f.name) LIKE '%dahi%' OR LOWER(f.name) LIKE '%milk%' OR LOWER(f.name) LIKE '%sugar%'
     OR LOWER(f.name) LIKE '%flour%' OR LOWER(f.name) LIKE '%atta%' OR LOWER(f.name) LIKE '%potato%'
     OR LOWER(f.name) LIKE '%aloo%' OR LOWER(f.name) LIKE '%onion%' OR LOWER(f.name) LIKE '%pyaaz%'
     OR LOWER(f.name) LIKE '%tomato%' OR LOWER(f.name) LIKE '%tamatar%' OR LOWER(f.name) LIKE '%ginger%'
     OR LOWER(f.name) LIKE '%adrak%' OR LOWER(f.name) LIKE '%garlic%' OR LOWER(f.name) LIKE '%lassan%'
     OR LOWER(f.name) LIKE '%spice%' OR LOWER(f.name) LIKE '%masala%' OR LOWER(f.name) LIKE '%cumin%'
     OR LOWER(f.name) LIKE '%zeera%' OR LOWER(f.name) LIKE '%kayam%' OR LOWER(f.name) LIKE '%chaat masala%'
     OR LOWER(f.name) LIKE '%chaat%' OR LOWER(f.name) LIKE '%curd%' OR LOWER(f.name) LIKE '%cream%'
   )
   ORDER BY LENGTH(f.name), f.id LIMIT 80`
);
console.log('=== INGREDIENT CANDIDATES ===');
console.table(ings.rows);

const recipesFoods = await pool.query(
  `SELECT f.id, f.name, f.category_id, f.is_active, f.base_calories
   FROM foods f
   WHERE LOWER(f.name) IN ('chicken biryani','chicken karahi','mutton pulao','mutonn pulao','aloo paratha','daal chawal','banana milkshake','fruit chaat','fruit salad','kachchi biryani (chicken)','mutton karahi','beef biryani')
   ORDER BY f.name`
);
console.log('=== RECIPE DISH FOODS ===');
console.table(recipesFoods.rows);

await pool.end();