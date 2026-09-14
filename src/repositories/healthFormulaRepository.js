import prisma from "../config/prisma.js";

/*
 * ============================================================
 * HEALTH FORMULAS REPOSITORY
 * ============================================================
 *
 * Database-only layer for health_formulas.
 *
 * Returns the stored formula definitions so consumers can
 * compute BMR/TDEE/BMI/goals from a single shared source.
 * ============================================================
 */

export const findAllFormulas = async () => {
  return prisma.health_formulas.findMany({
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
      key: true,
      name: true,
      category: true,
      description: true,
      formula: true,
      params: true,
      constants: true,
    },
  });
};

export const findFormulaByKey = async (key) => {
  return prisma.health_formulas.findUnique({
    where: {
      key,
    },
    select: {
      id: true,
      key: true,
      name: true,
      category: true,
      description: true,
      formula: true,
      params: true,
      constants: true,
    },
  });
};