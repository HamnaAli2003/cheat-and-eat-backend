import { saveOnboarding } from "../services/onboardingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const completeOnboarding = asyncHandler(async (req, res) => {
  const result = await saveOnboarding({
    userId: req.user.userId,
    ...req.body,
  });

  res.status(200).json({
    success: true,
    message: "Onboarding completed successfully",
    ...result,
  });
});