import pg from "pg";
import "dotenv/config";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/eat_and_cheat" });
await c.connect();

const q = async (label, sql, params = []) => {
  const r = await c.query(sql, params);
  console.log(`\n=== ${label} (${r.rows.length}) ===`);
  console.log(JSON.stringify(r.rows, null, 1));
  return r.rows;
};

// 1. Overall totals
await q("TOTALS", `
  SELECT
    count(*) AS total_rows,
    count(DISTINCT name) AS distinct_names,
    count(*) FILTER (WHERE image_url IS NULL) AS null_image,
    count(*) FILTER (WHERE image_url IS NOT NULL) AS with_image
  FROM foods
`);

// 2. Duplicate (name, category) groups -> repeated foods on screen
const dupGroups = await q("DUP FOODS (same name + category, >1 row)", `
  SELECT f.name, c.name AS category, count(*) AS n
  FROM foods f JOIN food_categories c ON c.id = f.category_id
  GROUP BY f.name, c.name
  HAVING count(*) > 1
  ORDER BY n DESC
  LIMIT 20
`);
console.log("dup groups shown (top 20); count above is per group");

// 3. Same name across multiple categories
const nameMult = await q("NAMES IN >1 CATEGORY", `
  SELECT f.name, count(DISTINCT c.slug) AS cats, count(*) AS rows_n
  FROM foods f JOIN food_categories c ON c.id = f.category_id
  GROUP BY f.name
  HAVING count(DISTINCT c.slug) > 1
  ORDER BY rows_n DESC
  LIMIT 15
`);

// 4. Image reuse: image_url shared across >1 food (distinct foods with same image)
const imgDup = await q("IMAGE_URL SHARED BY >1 FOOD", `
  SELECT count(*) AS shared_images,
         sum(n) AS total_rows_affected
  FROM (
    SELECT image_url, count(*) AS n
    FROM foods
    WHERE image_url IS NOT NULL
    GROUP BY image_url
    HAVING count(*) > 1
  ) t
`);
console.log(JSON.stringify(imgDup));

const imgDupExamples = await q("IMAGE_REUSE EXAMPLES (url used N times)", `
  SELECT image_url, image_source, count(*) AS n,
         string_agg(name, ' | ' ORDER BY name) AS names
  FROM foods
  WHERE image_url IS NOT NULL
  GROUP BY image_url, image_source
  HAVING count(*) > 1
  ORDER BY n DESC
  LIMIT 15
`);
for (const r of imgDupExamples) console.log(`${r.n}x ${r.image_url}\n   ${r.image_source}\n   ${r.names}`);

// 5. image_source distribution (generic placeholders vs openverse vs null)
await q("IMAGE SOURCE DISTRIBUTION", `
  SELECT
    count(*) FILTER (WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%') AS generic_category_placeholder,
    count(*) FILTER (WHERE image_source LIKE '%Openverse%') AS openverse,
    count(*) FILTER (WHERE image_source IS NULL OR image_source = '') AS no_source,
    count(*) AS total
  FROM foods
`);

// 6. Generic placeholder URLs still present (Special:FilePath)
const gen = await q("GENERIC Special:FilePath SAMPLE", `
  SELECT name, image_url FROM foods
  WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%'
  ORDER BY name LIMIT 10
`);
for (const r of gen) console.log(`${r.name} | ${r.image_url}`);

await c.end();
console.log("\nDONE");
