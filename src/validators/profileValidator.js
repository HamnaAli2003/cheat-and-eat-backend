import { z } from "zod";

export const updateProfileSchema = z.object({
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
});