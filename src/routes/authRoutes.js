import express from "express";

import {
  getMe,
  login,
  logout,
  register,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";

import {
  loginSchema,
  registerSchema,
} from "../validators/authValidator.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  login
);

router.get("/me", authenticate, getMe);

router.post("/logout", authenticate, logout);

export default router;