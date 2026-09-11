import { z } from "zod";

export const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  age: z
    .number()
    .int("Age must be a whole number")
    .min(10, "Age must be at least 10")
    .max(100, "Age must not exceed 100"),

  gender: z.enum(["male", "female"], {
    message: "Gender must be male or female",
  }),

  height: z
    .number()
    .min(80, "Height must be at least 80 cm")
    .max(250, "Height must not exceed 250 cm"),

  weight: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight must not exceed 300 kg"),

  activity: z.enum(
    [
      "Sedentary",
      "Lightly Active",
      "Moderately Active",
      "Very Active",
    ],
    {
      message: "Invalid activity level",
    }
  ),

  goal: z
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