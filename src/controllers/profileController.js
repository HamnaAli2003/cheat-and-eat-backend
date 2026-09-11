import {
  getUserProfile,
  updateUserProfile,
} from "../services/profileService.js";

import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getUserProfile(req.user.userId);

  res.status(200).json({
    success: true,
    profile,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await updateUserProfile({
    userId: req.user.userId,
    ...req.body,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    profile,
  });
});