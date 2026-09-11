import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const categories = [
  { name: "Rice", slug: "rice" },
  { name: "Meat", slug: "meat" },
  { name: "Daal", slug: "daal" },
  { name: "Sabzi", slug: "sabzi" },
  { name: "Bread", slug: "bread" },
  { name: "Fruit", slug: "fruit" },
  { name: "Drinks", slug: "drinks" },
  { name: "Sweets", slug: "sweets" },
  { name: "Combos", slug: "combos" },
];

const foods = [
  {
    category: "rice",
    name: "Plain Rice",
    slug: "plain-rice",
    description: "Cooked plain white rice",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
  },
  {
    category: "rice",
    name: "Chicken Biryani",
    slug: "chicken-biryani",
    description: "Pakistani-style chicken biryani",
    calories: 190,
    protein: 9,
    carbs: 24,
    fat: 6,
    fiber: 1.2,
  },
  {
    category: "rice",
    name: "Chicken Pulao",
    slug: "chicken-pulao",
    description: "Chicken pulao with seasoned rice",
    calories: 180,
    protein: 8,
    carbs: 25,
    fat: 5,
    fiber: 1,
  },
  {
    category: "meat",
    name: "Chicken Karahi",
    slug: "chicken-karahi",
    description: "Pakistani chicken karahi",
    calories: 185,
    protein: 17,
    carbs: 4,
    fat: 11,
    fiber: 1,
  },
  {
    category: "meat",
    name: "Beef Nihari",
    slug: "beef-nihari",
    description: "Slow-cooked Pakistani beef nihari",
    calories: 210,
    protein: 16,
    carbs: 5,
    fat: 14,
    fiber: 1,
  },
  {
    category: "meat",
    name: "Chicken Qeema",
    slug: "chicken-qeema",
    description: "Pakistani-style minced chicken",
    calories: 175,
    protein: 18,
    carbs: 5,
    fat: 9,
    fiber: 1,
  },
  {
    category: "daal",
    name: "Daal Chana",
    slug: "daal-chana",
    description: "Cooked chana daal",
    calories: 164,
    protein: 8.9,
    carbs: 27,
    fat: 2.6,
    fiber: 7.5,
  },
  {
    category: "daal",
    name: "Daal Masoor",
    slug: "daal-masoor",
    description: "Cooked masoor daal",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    fiber: 7.9,
  },
  {
    category: "sabzi",
    name: "Aloo Gobi",
    slug: "aloo-gobi",
    description: "Potato and cauliflower curry",
    calories: 110,
    protein: 2.5,
    carbs: 15,
    fat: 4,
    fiber: 3,
  },
  {
    category: "sabzi",
    name: "Bhindi Masala",
    slug: "bhindi-masala",
    description: "Okra cooked with spices",
    calories: 100,
    protein: 2.5,
    carbs: 10,
    fat: 5,
    fiber: 4,
  },
  {
    category: "bread",
    name: "Roti",
    slug: "roti",
    description: "Traditional whole wheat roti",
    calories: 297,
    protein: 11,
    carbs: 55,
    fat: 4,
    fiber: 9,
  },
  {
    category: "bread",
    name: "Plain Paratha",
    slug: "plain-paratha",
    description: "Traditional Pakistani plain paratha",
    calories: 320,
    protein: 8,
    carbs: 42,
    fat: 13,
    fiber: 5,
  },
  {
    category: "bread",
    name: "Naan",
    slug: "naan",
    description: "Traditional tandoori naan",
    calories: 290,
    protein: 9,
    carbs: 50,
    fat: 6,
    fiber: 2,
  },
  {
    category: "fruit",
    name: "Mango",
    slug: "mango",
    description: "Fresh ripe mango",
    calories: 60,
    protein: 0.8,
    carbs: 15,
    fat: 0.4,
    fiber: 1.6,
  },
  {
    category: "fruit",
    name: "Banana",
    slug: "banana",
    description: "Fresh banana",
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
  },
  {
    category: "drinks",
    name: "Sweet Lassi",
    slug: "sweet-lassi",
    description: "Traditional sweet yogurt-based lassi",
    calories: 75,
    protein: 3.5,
    carbs: 10,
    fat: 2.5,
    fiber: 0,
  },
  {
    category: "drinks",
    name: "Doodh Patti Chai",
    slug: "doodh-patti-chai",
    description: "Pakistani milk tea",
    calories: 55,
    protein: 2,
    carbs: 6,
    fat: 2,
    fiber: 0,
  },
  {
    category: "sweets",
    name: "Rice Kheer",
    slug: "rice-kheer",
    description: "Traditional rice pudding",
    calories: 140,
    protein: 3.5,
    carbs: 22,
    fat: 4.5,
    fiber: 0.5,
  },
  {
    category: "sweets",
    name: "Suji Halwa",
    slug: "suji-halwa",
    description: "Traditional semolina halwa",
    calories: 310,
    protein: 4,
    carbs: 45,
    fat: 13,
    fiber: 1.5,
  },
];

const servings = {
  "plain-rice": [
    ["Small", "bowl", 150, "g", 1],
    ["Medium", "bowl", 200, "g", 2],
    ["Large", "bowl", 300, "g", 3],
  ],

  "chicken-biryani": [
    ["Small", "serving", 200, "g", 1],
    ["Medium", "serving", 300, "g", 2],
    ["Large", "serving", 400, "g", 3],
  ],

  "chicken-pulao": [
    ["Small", "serving", 200, "g", 1],
    ["Medium", "serving", 300, "g", 2],
    ["Large", "serving", 400, "g", 3],
  ],

  "chicken-karahi": [
    ["Small", "serving", 150, "g", 1],
    ["Medium", "serving", 250, "g", 2],
    ["Large", "serving", 350, "g", 3],
  ],

  "beef-nihari": [
    ["Small", "serving", 150, "g", 1],
    ["Medium", "serving", 250, "g", 2],
    ["Large", "serving", 350, "g", 3],
  ],

  "chicken-qeema": [
    ["Small", "serving", 150, "g", 1],
    ["Medium", "serving", 250, "g", 2],
    ["Large", "serving", 350, "g", 3],
  ],

  "daal-chana": [
    ["Small", "bowl", 150, "g", 1],
    ["Medium", "bowl", 250, "g", 2],
    ["Large", "bowl", 350, "g", 3],
  ],

  "daal-masoor": [
    ["Small", "bowl", 150, "g", 1],
    ["Medium", "bowl", 250, "g", 2],
    ["Large", "bowl", 350, "g", 3],
  ],

  "aloo-gobi": [
    ["Small", "bowl", 150, "g", 1],
    ["Medium", "bowl", 250, "g", 2],
    ["Large", "bowl", 350, "g", 3],
  ],

  "bhindi-masala": [
    ["Small", "bowl", 150, "g", 1],
    ["Medium", "bowl", 250, "g", 2],
    ["Large", "bowl", 350, "g", 3],
  ],

  roti: [
    ["1 Roti", "piece", 40, "g", 1],
    ["2 Roti", "piece", 80, "g", 2],
  ],

  "plain-paratha": [
    ["1 Paratha", "piece", 80, "g", 1],
    ["2 Paratha", "piece", 160, "g", 2],
  ],

  naan: [
    ["1 Naan", "piece", 100, "g", 1],
    ["2 Naan", "piece", 200, "g", 2],
  ],

  mango: [
    ["Small", "piece", 150, "g", 1],
    ["Medium", "piece", 200, "g", 2],
    ["Large", "piece", 300, "g", 3],
  ],

  banana: [
    ["Small", "piece", 80, "g", 1],
    ["Medium", "piece", 120, "g", 2],
    ["Large", "piece", 150, "g", 3],
  ],

  "sweet-lassi": [
    ["Small", "glass", 250, "ml", 1],
    ["Medium", "glass", 350, "ml", 2],
    ["Large", "glass", 500, "ml", 3],
  ],

  "doodh-patti-chai": [
    ["Small", "cup", 150, "ml", 1],
    ["Medium", "cup", 200, "ml", 2],
    ["Large", "cup", 300, "ml", 3],
  ],

  "rice-kheer": [
    ["Small", "bowl", 100, "g", 1],
    ["Medium", "bowl", 150, "g", 2],
    ["Large", "bowl", 250, "g", 3],
  ],

  "suji-halwa": [
    ["Small", "serving", 80, "g", 1],
    ["Medium", "serving", 120, "g", 2],
    ["Large", "serving", 180, "g", 3],
  ],
};

const optionDefinitions = {
  "chicken-biryani": [
    {
      key: "meat_type",
      label: "Meat Type",
      inputType: "pills",
      values: [
        ["chicken", "Chicken", 0, 0, 0, 0],
      ],
    },
    {
      key: "oil",
      label: "Oil",
      inputType: "stepper",
      values: [
        ["none", "None", 0, 0, 0, 0],
        ["less", "Less", 30, 0, 0, 3.3],
        ["normal", "Normal", 60, 0, 0, 6.7],
        ["extra", "Extra", 90, 0, 0, 10],
      ],
    },
  ],

  "chicken-karahi": [
    {
      key: "oil",
      label: "Oil",
      inputType: "stepper",
      values: [
        ["none", "None", 0, 0, 0, 0],
        ["less", "Less", 30, 0, 0, 3.3],
        ["normal", "Normal", 60, 0, 0, 6.7],
        ["extra", "Extra", 90, 0, 0, 10],
      ],
    },
  ],

  "plain-paratha": [
    {
      key: "ghee",
      label: "Ghee",
      inputType: "stepper",
      values: [
        ["none", "None", 0, 0, 0, 0],
        ["less", "Less", 30, 0, 0, 3.3],
        ["normal", "Normal", 60, 0, 0, 6.7],
        ["extra", "Extra", 90, 0, 0, 10],
      ],
    },
  ],

  "sweet-lassi": [
    {
      key: "sugar",
      label: "Sugar",
      inputType: "pills",
      values: [
        ["none", "No Sugar", -16, 0, -4, 0],
        ["normal", "Normal", 0, 0, 0, 0],
        ["extra", "Extra", 16, 0, 4, 0],
      ],
    },
  ],
};

const combos = [
  {
    category: "combos",
    name: "Daal Chawal",
    slug: "daal-chawal",
    description: "Daal served with cooked rice",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  },
  {
    category: "combos",
    name: "Halwa Puri",
    slug: "halwa-puri",
    description: "Traditional Pakistani halwa puri combination",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  },
];

async function getCategoryId(slug) {
  const result = await client.query(
    `SELECT id FROM food_categories WHERE slug = $1`,
    [slug]
  );

  if (!result.rows[0]) {
    throw new Error(`Category not found: ${slug}`);
  }

  return result.rows[0].id;
}

async function insertFood(food) {
  const categoryId = await getCategoryId(food.category);

  const result = await client.query(
    `
      INSERT INTO foods (
        category_id,
        name,
        slug,
        description,
        base_calories,
        base_protein,
        base_carbs,
        base_fat,
        base_fiber
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (slug)
      DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        base_calories = EXCLUDED.base_calories,
        base_protein = EXCLUDED.base_protein,
        base_carbs = EXCLUDED.base_carbs,
        base_fat = EXCLUDED.base_fat,
        base_fiber = EXCLUDED.base_fiber,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [
      categoryId,
      food.name,
      food.slug,
      food.description,
      food.calories,
      food.protein,
      food.carbs,
      food.fat,
      food.fiber,
    ]
  );

  return result.rows[0].id;
}

async function seedCategories() {
  for (const category of categories) {
    await client.query(
      `
        INSERT INTO food_categories (name, slug)
        VALUES ($1, $2)
        ON CONFLICT (slug)
        DO UPDATE SET name = EXCLUDED.name
      `,
      [category.name, category.slug]
    );
  }
}

async function seedServings(foodId, foodSlug) {
  const items = servings[foodSlug] || [];

  for (const [name, unit, amount, amountUnit, sortOrder] of items) {
    await client.query(
      `
        INSERT INTO food_servings (
          food_id,
          name,
          unit,
          amount,
          amount_unit,
          sort_order,
          is_default
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (food_id, name)
        DO UPDATE SET
          unit = EXCLUDED.unit,
          amount = EXCLUDED.amount,
          amount_unit = EXCLUDED.amount_unit,
          sort_order = EXCLUDED.sort_order,
          is_default = EXCLUDED.is_default
      `,
      [
        foodId,
        name,
        unit,
        amount,
        amountUnit,
        sortOrder,
        sortOrder === 1,
      ]
    );
  }
}

async function seedOptions(foodId, foodSlug) {
  const options = optionDefinitions[foodSlug] || [];

  for (const [optionIndex, option] of options.entries()) {
    const optionResult = await client.query(
      `
        INSERT INTO food_options (
          food_id,
          key,
          label,
          input_type,
          sort_order
        )
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (food_id, key)
        DO UPDATE SET
          label = EXCLUDED.label,
          input_type = EXCLUDED.input_type,
          sort_order = EXCLUDED.sort_order
        RETURNING id
      `,
      [
        foodId,
        option.key,
        option.label,
        option.inputType,
        optionIndex + 1,
      ]
    );

    const optionId = optionResult.rows[0].id;

    for (const [
      valueIndex,
      value,
    ] of option.values.entries()) {
      const [
        key,
        label,
        caloriesDelta,
        proteinDelta,
        carbsDelta,
        fatDelta,
      ] = value;

      await client.query(
        `
          INSERT INTO food_option_values (
            option_id,
            key,
            label,
            calories_delta,
            protein_delta,
            carbs_delta,
            fat_delta,
            sort_order,
            is_default
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (option_id, key)
          DO UPDATE SET
            label = EXCLUDED.label,
            calories_delta = EXCLUDED.calories_delta,
            protein_delta = EXCLUDED.protein_delta,
            carbs_delta = EXCLUDED.carbs_delta,
            fat_delta = EXCLUDED.fat_delta,
            sort_order = EXCLUDED.sort_order,
            is_default = EXCLUDED.is_default
        `,
        [
          optionId,
          key,
          label,
          caloriesDelta,
          proteinDelta,
          carbsDelta,
          fatDelta,
          valueIndex + 1,
          valueIndex === 0,
        ]
      );
    }
  }
}

async function seedMetadata(foodId, food) {
  await client.query(
    `
      INSERT INTO food_metadata (
        food_id,
        ingredients,
        tags
      )
      VALUES ($1,$2,$3)
      ON CONFLICT (food_id)
      DO UPDATE SET
        ingredients = EXCLUDED.ingredients,
        tags = EXCLUDED.tags,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      foodId,
      JSON.stringify([]),
      JSON.stringify(["desi", "pakistani"]),
    ]
  );
}

async function seedFood(food) {
  const foodId = await insertFood(food);

  await seedServings(foodId, food.slug);
  await seedOptions(foodId, food.slug);
  await seedMetadata(foodId, food);

  return foodId;
}

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    await seedCategories();

    for (const food of foods) {
      await seedFood(food);
    }

    for (const combo of combos) {
      await seedFood(combo);
    }

    await client.query("COMMIT");

    console.log("✅ Food catalog seeded successfully");
    console.log(`🍛 Foods: ${foods.length + combos.length}`);
    console.log(`📂 Categories: ${categories.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Food seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();