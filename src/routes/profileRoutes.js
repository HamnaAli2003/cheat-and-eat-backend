import express from "express";

import {
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { updateProfileSchema } from "../validators/profileValidator.js";

const router = express.Router();

router.get("/", authenticate, getProfile);

router.put(
  "/",
  authenticate,
  validate(updateProfileSchema),
  updateProfile
);

export default router;