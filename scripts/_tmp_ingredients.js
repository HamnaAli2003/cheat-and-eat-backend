import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(
  `SELECT f.id, f.name, f.base_calories cal, f.base_protein p, f.base_carbs c, f.base_fat ft, f.base_fiber fb, f.serving_g, f.serving_label
   FROM foods f
   WHERE f.is_active = true AND (
     LOWER(f.name) IN ('chicken','chicken (boneless)','chicken breast','chicken tikka','raw chicken','mutton','beef','lamb','oil','cooking oil','mustard oil','ghee','desi ghee','butter','yogurt','dahi','curd','milk','sugar','white sugar','atta','wheat flour','flour','potato','aloo','onion','tomato','ginger','garlic','ginger garlic paste','green chili','red chili powder','turmeric','cumin','zeera','salt','biryani masala','garam masala','cardamom','bay leaf','daal','daal masoor','masoor daal','lentils','chana','rice','basmati rice','plain rice','egg','sesame oil','banana','mango','cinnamon','black pepper','kasuri methi','coriander','dhaniya','pudina','mint')
     OR LOWER(f.name) LIKE '%boneless%'
     OR LOWER(f.name) LIKE '%tawa%'
     OR (LOWER(f.name) LIKE '%raw%' AND (LOWER(f.name) LIKE '%chicken%' OR LOWER(f.name) LIKE '%mutton%' OR LOWER(f.name) LIKE '%beef%'))
     OR (LOWER(f.name) LIKE '%daal%' AND LOWER(f.name) NOT LIKE '%chawal%' AND LOWER(f.name) NOT LIKE '%biryani%' AND LOWER(f.name) NOT LIKE '%chaat%' AND LOWER(f.name) NOT LIKE '%pakora%')
     OR (LOWER(f.name) LIKE '%masala%' AND LOWER(f.name) NOT LIKE '%bhindi%' AND LOWER(f.name) NOT LIKE '%karela%' AND LOWER(f.name) NOT LIKE '%aloo%' AND LOWER(f.name) NOT LIKE '%mutton%' AND LOWER(f.name) NOT LIKE '%chicken%' AND LOWER(f.name) NOT LIKE '%gosht%' AND LOWER(f.name) NOT LIKE '%arbi%' AND LOWER(f.name) NOT LIKE '%palak%')
     OR (LOWER(f.name) LIKE '%curry%' AND LOWER(f.name) NOT LIKE '%chicken%' AND LOWER(f.name) NOT LIKE '%mutton%' AND LOWER(f.name) NOT LIKE '%beef%' AND LOWER(f.name) NOT LIKE '%biryani%')
   )
   ORDER BY f.id LIMIT 120`
);
console.table(r.rows);
await pool.end();