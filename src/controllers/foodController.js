import {
  getFoods,
  getFoodCategories,
  getFoodRegions,
  getFoodById,
} from "../services/foodService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getFoodsController = asyncHandler(async (req, res) => {
  const result = await getFoods(req.validatedQuery);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getFoodCategoriesController = asyncHandler(
  async (req, res) => {
    const categories = await getFoodCategories(
      req.validatedQuery?.region ?? ""
    );

    res.status(200).json({
      success: true,
      data: categories,
    });
  }
);

export const getFoodRegionsController = asyncHandler(async (req, res) => {
  const regions = await getFoodRegions();

  res.status(200).json({
    success: true,
    data: regions,
  });
});

export const getFoodByIdController = asyncHandler(async (req, res) => {
  const food = await getFoodById(req.validatedParams.id);

  res.status(200).json({
    success: true,
    data: food,
  });
});