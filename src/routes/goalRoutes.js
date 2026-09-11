import express from "express";

import {
  getGoal,
  updateGoal,
} from "../controllers/goalController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { updateGoalSchema } from "../validators/goalValidator.js";

const router = express.Router();

router.get("/", authenticate, getGoal);

router.put(
  "/",
  authenticate,
  validate(updateGoalSchema),
  updateGoal
);

export default router;