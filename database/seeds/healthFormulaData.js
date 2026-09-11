/*
 * ============================================================
 * HEALTH FORMULAS — Master Data
 * ============================================================
 *
 * Single source of truth for every formula, constant and parameter
 * used in src/utils/health.js on the frontend.
 *
 * Imported by:
 *   - 003_health_formulas.js  (seed / idempotent upsert)
 *   - tests                   (formula-coverage verification)
 *
 * IMPORTANT: This file must stay in sync with src/utils/health.js.
 * If health.js adds a formula or constant, add it here too.
 */

export const FORMULAS = [
  // ── 1. BMR ──────────────────────────────────────────────
  {
    key: "bmr",
    name: "BMR — Mifflin-St Jeor",
    category: "calorie",
    description:
      "Basal Metabolic Rate. Needs gender, age, height (cm) and weight (kg). Returns rounded kcal/day.",
    formula:
      "10 × weight(kg) + 6.25 × height(cm) − 5 × age + sce (male +5, female −161), rounded to nearest kcal",
    params: ["gender", "age", "height", "weight"],
    constants: {
      baseWeight: 10,
      baseHeight: 6.25,
      baseAge: 5,
      maleOffset: 5,
      femaleOffset: -161,
      type: "Mifflin-St Jeor",
    },
    sortOrder: 1,
  },

  // ── 2. TDEE ─────────────────────────────────────────────
  {
    key: "tdee",
    name: "TDEE — Total Daily Energy Expenditure",
    category: "calorie",
    description:
      "BMR × activity multiplier, rounded to the nearest 10 kcal = maintenance intake.",
    formula: "TDEE = round10(BMR × activityMultiplier)",
    params: ["bmr", "activity"],
    constants: { roundingFactor: 10 },
    sortOrder: 2,
  },

  // ── 3. Activity Multipliers ─────────────────────────────
  {
    key: "activity-multipliers",
    name: "Activity Multipliers",
    category: "calorie",
    description:
      "Multipliers applied to BMR to compute TDEE. Keyed by activity level label as stored in the user's profile.",
    formula: "multiplier = lookup(activityLabel)",
    params: ["activity"],
    constants: {
      sedentary: 1.2,
      lightlyActive: 1.375,
      moderatelyActive: 1.55,
      veryActive: 1.725,
      default: "Lightly Active",
    },
    sortOrder: 3,
  },

  // ── 4. BMI ──────────────────────────────────────────────
  {
    key: "bmi",
    name: "BMI — Body Mass Index",
    category: "body-composition",
    description:
      "weight (kg) ÷ height (m)², rounded to 1 decimal, with WHO category label.",
    formula: "BMI = round1(weight(kg) / (height(m) × height(m)))",
    params: ["weight", "height"],
    constants: { roundingFactor: 10 },
    sortOrder: 4,
  },

  // ── 5. BMI Categories ──────────────────────────────────
  {
    key: "bmi-categories",
    name: "BMI Categories",
    category: "body-composition",
    description: "WHO cut-offs used to label a BMI value.",
    formula: "Underweight <18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese ≥30",
    params: ["bmi"],
    constants: {
      underweight: {
        min: 0,
        max: 18.49,
        label: "Underweight",
        isUnderweight: true,
        isOverweight: false,
        isObese: false,
      },
      normal: {
        min: 18.5,
        max: 24.99,
        label: "Normal",
        isUnderweight: false,
        isOverweight: false,
        isObese: false,
      },
      overweight: {
        min: 25,
        max: 29.99,
        label: "Overweight",
        isUnderweight: false,
        isOverweight: true,
        isObese: false,
      },
      obese: {
        min: 30,
        max: 100,
        label: "Obese",
        isUnderweight: false,
        isOverweight: false,
        isObese: true,
      },
    },
    sortOrder: 5,
  },

  // ── 6. Ideal Weight ─────────────────────────────────────
  {
    key: "ideal-weight",
    name: "Ideal Weight",
    category: "body-composition",
    description:
      "Average of Devine, Robinson and Miller ideal-body-weight formulas, clamped inside a healthy-BMI window that relaxes with age.",
    formula:
      "target = clamp(avg(devine, robinson, miller), 18.5·h², upperBmi·h²) where upperBmi = 24.9 + (≥65y ? 2.1 : ≥50y ? 1 : 0)",
    params: ["height", "gender", "age"],
    constants: {
      devine: { male: 50, female: 45.5, perInch: 2.3 },
      robinson: { male: 52, female: 49, malePerInch: 1.9, femalePerInch: 1.7 },
      miller: {
        male: 56.2,
        female: 53.1,
        malePerInch: 1.41,
        femalePerInch: 1.36,
      },
      bmiWindow: { base: 24.9, age50Bonus: 1, age65Bonus: 2.1 },
      lowerBmi: 18.5,
      inchesOver5ftBase: 60,
    },
    sortOrder: 6,
  },

  // ── 7. Stat Limits ──────────────────────────────────────
  {
    key: "stat-limits",
    name: "Stat Validation Limits",
    category: "validation",
    description:
      "Plausible body-stat input windows. Anything outside is treated as a typing mistake and rejected.",
    formula:
      "gender ∈ {male,female}, age ∈ [2,120], height ∈ [50,260] cm, weight ∈ [15,350] kg",
    params: [],
    constants: {
      minAge: 2,
      maxAge: 120,
      minHeight: 50,
      maxHeight: 260,
      minWeight: 15,
      maxWeight: 350,
      validGenders: ["male", "female"],
    },
    sortOrder: 7,
  },

  // ── 8. Height Conversion ────────────────────────────────
  {
    key: "height-conversion",
    name: "Height Conversion — ft'in\" ↔ cm",
    category: "conversion",
    description:
      "Converts between imperial (feet + inches) and metric (cm) for the UI height picker.",
    formula: "cm = round((ft × 12 + inches) × 2.54)  ·  ft = floor(totalIn / 12), in = totalIn % 12",
    params: ["ft", "in", "cm"],
    constants: { inchesPerFoot: 12, cmPerInch: 2.54 },
    sortOrder: 8,
  },

  // ── 9. Safe Floors ──────────────────────────────────────
  {
    key: "safe-floors",
    name: "Safe Calorie Floors",
    category: "safety",
    description:
      "Medical minimum intake: never push daily calories below this floor.",
    formula: "male ≥1500 kcal/day · female ≥1200 kcal/day",
    params: ["gender"],
    constants: { male: 1500, female: 1200 },
    sortOrder: 9,
  },

  // ── 10. Kcal per kg ─────────────────────────────────────
  {
    key: "kcal-per-kg",
    name: "Kilocalories per kg of Body Fat",
    category: "safety",
    description: "Energy density constant used for time-to-goal estimates.",
    formula: "1 kg body fat ≈ 7,700 kcal",
    params: [],
    constants: { kcalPerKg: 7700 },
    sortOrder: 10,
  },

  // ── 11. Loss Rate ───────────────────────────────────────
  {
    key: "loss-rate",
    name: "Calorie Deficit & Loss Rate",
    category: "weight",
    description:
      "Standard deficit and associated weekly loss used in goal planning.",
    formula: "deficit −500 kcal/day ≈ −0.45 kg/week · surplus +350 kcal/day ≈ +0.3 kg/week",
    params: [],
    constants: {
      deficitKcal: 500,
      surplusKcal: 350,
      lossPerWeekKg: 0.45,
      gainPerWeekKg: 0.3,
    },
    sortOrder: 11,
  },

  // ── 12. Surplus per kg-month ────────────────────────────
  {
    key: "surplus-per-kg-month",
    name: "Surplus per kg per Month",
    category: "weight",
    description:
      "Approximate daily calorie surplus that yields ~1 kg/month weight gain. Used in underweight recovery and goal-mode calculation.",
    formula: "257 kcal/day surplus ≈ 1 kg/month",
    params: [],
    constants: { kcalPerDay: 257, kgPerMonth: 1 },
    sortOrder: 12,
  },

  // ── 13. Safe Loss Rate ──────────────────────────────────
  {
    key: "safe-loss-rate",
    name: "Safe Weight Loss Rate",
    category: "safety",
    description:
      "Medical guideline: do not exceed 1 kg/week weight loss. Used by validateWeightLossGoal.",
    formula: "max 1 kg/week · 4.3 weeks/month · ~4 kg/month",
    params: [],
    constants: {
      maxSafeKgPerWeek: 1,
      weeksPerMonth: 4.3,
      maxSafeKgPerMonth: 4,
      suggestedKgPerMonth: 4,
    },
    sortOrder: 13,
  },

  // ── 14. Duration Format ─────────────────────────────────
  {
    key: "duration-format",
    name: "Duration Formatter",
    category: "formatting",
    description:
      "Formats a number of weeks into a human-readable duration string. Weeks ≤8 displayed as weeks, otherwise converted to months.",
    formula: "w ≤ 8 → 'N week(s)' · w > 8 → 'N month(s)' (w / 4.3)",
    params: ["weeks"],
    constants: { weekThreshold: 8, weeksPerMonth: 4.3 },
    sortOrder: 14,
  },

  // ── 15. Goal Plan ───────────────────────────────────────
  {
    key: "goal-plan",
    name: "Goal Plan — Auto-calculated Intake & Timeline",
    category: "goal",
    description:
      "Calculates the daily calorie intake and realistic timeline to reach ideal weight. Loss ≈ 500 kcal/day deficit, gain ≈ +350 kcal/day. Intake is clamped above the safe floor.",
    formula:
      "lose: intake = max(tdee − 500, floor), weeks = (diff × 7700) / ((tdee − intake) × 7)  ·  gain: intake = tdee + 350, weeks = (|diff| × 7700) / (350 × 7)",
    params: ["gender", "weight", "tdee", "idealTarget"],
    constants: {
      deficitKcal: 500,
      surplusKcal: 350,
      kcalPerKg: 7700,
      maintainThresholdKg: 1,
    },
    sortOrder: 15,
  },

  // ── 16. Weight Loss Plan ────────────────────────────────
  {
    key: "weight-loss-plan",
    name: "Weight Loss Plan — User-defined Goal",
    category: "goal",
    description:
      "Personalised weight-loss plan based on user's own target (kg to lose) and timeline (months). Returns recommended intake, deficit, and whether the plan is safe.",
    formula:
      "totalDeficit = toLose × 7700 · dailyDeficit = ceil(totalDeficit / (months × 30)) · intake = max(tdee − dailyDeficit, floor)",
    params: [
      "gender",
      "weight",
      "tdee",
      "weightLossGoal",
      "weightLossMonths",
    ],
    constants: {
      kcalPerKg: 7700,
      daysPerMonth: 30,
    },
    sortOrder: 16,
  },

  // ── 17. Validate Weight Loss Goal ───────────────────────
  {
    key: "validate-weight-loss-goal",
    name: "Validate Weight Loss Goal",
    category: "safety",
    description:
      "Checks if a user's weight-loss goal is realistic and safe. Flags rates above 1 kg/week and intakes below the medical floor.",
    formula:
      "kgPerWeek = (toLose / months) / 4.3 · unsafe if kgPerWeek > 1 or goal < floor",
    params: ["gender", "weight", "weightLossGoal", "weightLossMonths", "goal"],
    constants: {
      maxSafeKgPerWeek: 1,
      weeksPerMonth: 4.3,
      kgPerMonthSafe: 4,
      daysPerMonth: 30,
      actionSteps: 4,
    },
    sortOrder: 17,
  },

  // ── 18. Get Calculated Goal ─────────────────────────────
  {
    key: "get-calculated-goal",
    name: "Get Calculated Goal — Source of Truth",
    category: "goal",
    description:
      "Infers goal mode from user's daily calorie goal vs TDEE. Applies BMI safety override for underweight users and safe-floor enforcement. Returns goal mode, active goal, recommended goal, deficit/surplus, and any warnings.",
    formula:
      "mode: goal < tdee−5% → loss, goal > tdee+5% → gain, else maintain  ·  underweight override → surplus = tdee + 257",
    params: [
      "gender",
      "age",
      "height",
      "weight",
      "activity",
      "goal",
    ],
    constants: {
      goalModeThreshold: 0.05,
      deficitKcal: 500,
      surplusPerKgMonth: 257,
    },
    sortOrder: 18,
  },
];
