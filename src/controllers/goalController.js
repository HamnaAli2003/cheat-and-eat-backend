import {
  getUserGoal,
  updateUserGoal,
} from "../services/goalService.js";

import { asyncHandler } from "../utils/asyncHandler.js";

export const getGoal = asyncHandler(async (req, res) => {
  const goal = await getUserGoal(req.user.userId);

  res.status(200).json({
    success: true,
    goal,
  });
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await updateUserGoal({
    userId: req.user.userId,
    ...req.body,
  });

  res.status(200).json({
    success: true,
    message: "Goal updated successfully",
    goal,
  });
});