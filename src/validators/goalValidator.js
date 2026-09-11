import { z } from "zod";

export const updateGoalSchema = z.object({
  dailyCalorieGoal: z
    .number()
    .int("Daily calorie goal must be a whole number")
    .positive("Daily calorie goal must be greater than 0"),

  weightLossGoal: z
    .number()
    .min(1, "Weight loss goal must be at least 1 kg")
    .max(100, "Weight loss goal must not exceed 100 kg")
    .nullable(),

  weightLossMonths: z
    .number()
    .int("Weight loss months must be a whole number")
    .min(1, "Weight loss duration must be at least 1 month")
    .max(24, "Weight loss duration must not exceed 24 months")
    .nullable(),
});