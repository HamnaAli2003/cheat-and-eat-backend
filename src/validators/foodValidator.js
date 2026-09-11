import { z } from "zod";

export const foodListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional()
    .default(""),

  category: z
    .string()
    .trim()
    .max(100, "Category must not exceed 100 characters")
    .optional()
    .default(""),

  region: z
    .string()
    .trim()
    .max(100, "Region must not exceed 100 characters")
    .optional()
    .default(""),

  tag: z
    .string()
    .trim()
    .max(100, "Tag must not exceed 100 characters")
    .optional()
    .default(""),

  sort: z
  .enum([
    "",
    "low-calories",
    "high-calories",
    "high-protein",
    "low-protein",
    "high-oil",
    "low-oil",
  ])
    .optional()
    .default(""),

  /*
   * Nutrition threshold filters (rail criteria).
   * All thresholds are PER SERVING: calories/protein are computed from the
   * per-100g base value × serving weight; oil uses the per-serving oil_kcal.
   */
  minCalories: z.coerce
    .number()
    .min(0, "minCalories must be 0 or greater")
    .optional(),

  maxCalories: z.coerce
    .number()
    .min(0, "maxCalories must be 0 or greater")
    .optional(),

  minProtein: z.coerce
    .number()
    .min(0, "minProtein must be 0 or greater")
    .optional(),

  maxProtein: z.coerce
    .number()
    .min(0, "maxProtein must be 0 or greater")
    .optional(),

  minOil: z.coerce
    .number()
    .min(0, "minOil must be 0 or greater")
    .optional(),

  maxOil: z.coerce
    .number()
    .min(0, "maxOil must be 0 or greater")
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(24),
});

export const foodCategoriesQuerySchema = z.object({
  region: z
    .string()
    .trim()
    .max(100, "Region must not exceed 100 characters")
    .optional()
    .default(""),
});

export const foodIdSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive("Food ID must be a positive integer"),
});