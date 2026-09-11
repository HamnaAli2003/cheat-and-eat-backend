import { z } from "zod";

export const healthFormulaKeySchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key must not be empty")
    .max(100, "Key must not exceed 100 characters"),
});