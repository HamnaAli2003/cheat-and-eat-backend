import { findActiveTips } from "../repositories/tipRepository.js";

export const listTips = async () => {
  return findActiveTips();
};