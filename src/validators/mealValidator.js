import { z } from "zod";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const createMealSchema = z.object({
  date: dateString.optional(),

  foodId: z.number().int().positive().nullable().optional(),

  name: z.string().min(1, "Meal name is required").max(200),

  imageUrl: z.string().max(1000).nullable().optional(),

  portion: z.string().max(200).nullable().optional(),

  mealType: z.enum(MEAL_TYPES),

  calories: z.coerce
    .number("Calories must be a number")
    .min(0, "Calories cannot be negative")
    .max(10000, "Calories must not exceed 10000"),

  protein: z.coerce.number().min(0).default(0),

  carbs: z.coerce.number().min(0).default(0),

  fat: z.coerce.number().min(0).default(0),

  fiber: z.coerce.number().min(0).default(0),
});

export const mealListQuerySchema = z
  .object({
    date: dateString.optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (query) => !query.date || (!query.from && !query.to),
    "The date filter cannot be combined with from/to"
  );

export const mealHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export const saveDayBodySchema = z.object({
  date: dateString.optional(),
});

export const clearDayParamsSchema = z.object({
  date: dateString,
});

export const deleteMealParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});