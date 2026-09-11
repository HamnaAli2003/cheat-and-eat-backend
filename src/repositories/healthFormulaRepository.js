import { query } from "../config/database.js";

/*
 * ============================================================
 * HEALTH FORMULAS REPOSITORY
 * ============================================================
 *
 * Database-only layer for health_formulas.
 *
 * Returns the stored formula definitions (mirrors the
 * frontend's src/utils/health.js) so consumers can compute
 * BMR/TDEE/BMI/goals from a single shared source.
 * ============================================================
 */

export const findAllFormulas = async () => {
  const result = await query(
    `
      SELECT
        id,
        key,
        name,
        category,
        description,
        formula,
        params,
        constants
      FROM health_formulas
      ORDER BY sort_order ASC, id ASC
    `
  );

  return result.rows;
};

export const findFormulaByKey = async (key) => {
  const result = await query(
    `
      SELECT
        id,
        key,
        name,
        category,
        description,
        formula,
        params,
        constants
      FROM health_formulas
      WHERE key = $1
    `,
    [key]
  );

  return result.rows[0] || null;
};