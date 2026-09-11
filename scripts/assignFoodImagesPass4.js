import pg from "pg";
import "dotenv/config";

/*
 * PASS 4 — replace the last generic category images (verified matches)
 * for foods Openverse does not index under their local names.
 */
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

// name -> { url, title }  (all URLs from the verified 600-image pool)
const MAPPING = {
  "Dedhri (Wild Okra)": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Wild_okra.jpg",
    title: "Wild okra",
  },
  "Dampukht": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Pattar_ka_gosht.JPG",
    title: "Pattar ka gosht (slow-braised meat)",
  },
  "Dampukht GB": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Pattar_ka_gosht.JPG",
    title: "Pattar ka gosht (slow-braised meat)",
  },
  "Gajrella": {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Gajar_Ka_Halwa_a_famous_Indian_Sweet_Dish_01.jpg",
    title: "Gajar ka halwa",
  },
  "Kasata": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Koderma_Kalakand.jpg",
    title: "Kalakand (milk-based sweet)",
  },
  "Rewri": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Gur_Rewari_%28a_kind_of_Gajak%29_from_Lucknow%2C_a_traditional_Indian_snack_made_with_Jaggery_and_crunchy_sesame_seeds_in_the_form_of_crispy_bars.jpg",
    title: "Gur rewari (jaggery-sesame sweet)",
  },
  "Karadaiyan": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/55/Shankarpali_sweets_mithai_Western_India_2012.jpg",
    title: "Shankarpali (flour-based mithai)",
  },
  "Wazwan Desserts": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Phirni_at_Cool_Point%2C_Chandni_Chawk.jpg",
    title: "Phirni",
  },
  "Wazwan Drinks": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Kahwa_1.JPG",
    title: "Kashmiri kahwa",
  },
  "Jam-e-Shirin": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Rooh_Afza_%28Sharbat%29.JPG",
    title: "Rose syrup sharbat",
  },
  "Hollywood Café Drinks": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mango_shakes.jpg",
    title: "Fresh fruit milkshakes",
  },
  "GB Mountain Tea": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Small_cup_of_green_tea.jpg",
    title: "Green herbal tea",
  },
  "Tsot / Gyath": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/56/Tandoori_Roti_in_clay_oven.JPG",
    title: "Tandoori roti (Balti flatbread)",
  },
  "Do Darya Snacks": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/66/Iraqi_Mixed_Grill_Platter_with_Traditional_Accompaniments.jpg",
    title: "Mixed grill platter",
  },
  "Qissa Khwani Snacks": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/96/Peshawari_Chapli_Kabab_by_Chef_Nina.jpg",
    title: "Peshawari chapli kabab",
  },
  "Wazwan Snacks": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Mutton_Seekh_Kebab_getting_grilled.jpg",
    title: "Mutton seekh kebab grilling",
  },
};

async function main() {
  await client.connect();
  let fixed = 0;

  for (const [name, img] of Object.entries(MAPPING)) {
    const result = await client.query(
      `UPDATE foods
          SET image_url = $1,
              image_source = $2
        WHERE name = $3`,
      [img.url, `Wikimedia Commons via Openverse (${img.title})`, name]
    );
    fixed += result.rowCount;
  }

  const stats = await client.query(
    `SELECT count(*) FILTER (WHERE image_source LIKE 'Wikimedia Commons Special:FilePath%') AS generic,
            count(*) AS total
       FROM foods`
  );
  console.log(`✅ Pass 4 done. Updated: ${fixed}`);
  console.log(`Still generic: ${stats.rows[0].generic} / ${stats.rows[0].total}`);

  await client.end();
}

main().catch(async (e) => {
  console.error("FATAL:", e.message);
  await client.end().catch(() => {});
  process.exit(1);
});