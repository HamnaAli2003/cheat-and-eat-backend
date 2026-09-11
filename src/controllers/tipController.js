import { listTips } from "../services/tipService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTipsController = asyncHandler(async (req, res) => {
  const tips = await listTips();

  res.status(200).json({
    success: true,
    tips,
  });
});