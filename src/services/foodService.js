import {
  findFoods,
  findFoodCategories,
  findFoodById,
  findFoodRegions,
} from "../repositories/foodRepository.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export const getFoods = async ({
  search = "",
  category = "",
  tag = "",
  region = "",
  sort = "",
  minCalories,
  maxCalories,
  minProtein,
  maxProtein,
  minOil,
  maxOil,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}) => {
  const normalizedPage = Math.max(
    Number.parseInt(page, 10) || DEFAULT_PAGE,
    1
  );

  const parsedLimit = Number.parseInt(limit, 10) || DEFAULT_LIMIT;

  const normalizedLimit = Math.min(
    Math.max(parsedLimit, 1),
    MAX_LIMIT
  );

 const normalizedSort = [
  "low-calories",
  "high-calories",
  "high-protein",
  "low-protein",
  "high-oil",
  "low-oil",
 ].includes(sort)
  ? sort
  : "";
  return findFoods({
    search: typeof search === "string" ? search.trim() : "",
    category: typeof category === "string" ? category.trim() : "",
    tag: typeof tag === "string" ? tag.trim() : "",
    region: typeof region === "string" ? region.trim() : "",
    sort: normalizedSort,
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    minOil,
    maxOil,
    page: normalizedPage,
    limit: normalizedLimit,
  });
};

export const getFoodCategories = async (region = "") => {
  return findFoodCategories(region);
};

export const getFoodRegions = async () => {
  return findFoodRegions();
};

export const getFoodById = async (foodId) => {
  const normalizedFoodId = Number.parseInt(foodId, 10);

  if (!Number.isInteger(normalizedFoodId) || normalizedFoodId <= 0) {
    const error = new Error("Invalid food ID");
    error.statusCode = 400;
    throw error;
  }

  const food = await findFoodById(normalizedFoodId);

  if (!food) {
    const error = new Error("Food not found");
    error.statusCode = 404;
    throw error;
  }

  return food;
};