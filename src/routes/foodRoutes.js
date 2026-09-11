import { Router } from "express";
import {
  getFoodsController,
  getFoodCategoriesController,
  getFoodRegionsController,
  getFoodByIdController,
} from "../controllers/foodController.js";
import { validate } from "../middleware/validate.js";
import {
  foodListQuerySchema,
  foodCategoriesQuerySchema,
  foodIdSchema,
} from "../validators/foodValidator.js";

const router = Router();

router.get(
  "/",
  validate(foodListQuerySchema, "query"),
  getFoodsController
);

router.get(
  "/categories",
  validate(foodCategoriesQuerySchema, "query"),
  getFoodCategoriesController
);
router.get("/regions", getFoodRegionsController);

router.get(
  "/:id",
  validate(foodIdSchema, "params"),
  getFoodByIdController
);

export default router;