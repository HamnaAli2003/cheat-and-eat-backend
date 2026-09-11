import express from "express";

import {
  listMealsController,
  createMealController,
  deleteMealController,
  getMealHistoryController,
  saveDayController,
  clearDayController,
  getSavedDaysController,
} from "../controllers/mealController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createMealSchema,
  mealListQuerySchema,
  mealHistoryQuerySchema,
  deleteMealParamsSchema,
  saveDayBodySchema,
  clearDayParamsSchema,
} from "../validators/mealValidator.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  validate(mealListQuerySchema, "query"),
  listMealsController
);

router.get(
  "/history",
  authenticate,
  validate(mealHistoryQuerySchema, "query"),
  getMealHistoryController
);

router.get(
  "/saved-days",
  authenticate,
  getSavedDaysController
);

router.post(
  "/",
  authenticate,
  validate(createMealSchema),
  createMealController
);

router.post(
  "/save-day",
  authenticate,
  validate(saveDayBodySchema),
  saveDayController
);

router.delete(
  "/clear-day/:date",
  authenticate,
  validate(clearDayParamsSchema, "params"),
  clearDayController
);

router.delete(
  "/:id",
  authenticate,
  validate(deleteMealParamsSchema, "params"),
  deleteMealController
);

export default router;