import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import healthFormulaRoutes from "./routes/healthFormulaRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import tipRoutes from "./routes/tipRoutes.js";
const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Eat & Cheat API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/health", healthFormulaRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/tips", tipRoutes);
app.use(errorHandler);

export default app;