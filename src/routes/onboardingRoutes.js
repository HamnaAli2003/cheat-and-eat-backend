import express from "express";

import { completeOnboarding } from "../controllers/onboardingController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { onboardingSchema } from "../validators/onboardingValidator.js";
const router = express.Router();
router.post(
  "/",
  authenticate,
  validate(onboardingSchema),
  completeOnboarding
);

export default router;