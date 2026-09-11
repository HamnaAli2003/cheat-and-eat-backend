import {
  getHealthFormulas,
  getHealthFormulaByKey,
} from "../services/healthFormulaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHealthFormulasController = asyncHandler(
  async (req, res) => {
    const formulas = await getHealthFormulas();

    res.status(200).json({
      success: true,
      data: formulas,
    });
  }
);

export const getHealthFormulaByKeyController = asyncHandler(
  async (req, res) => {
    const formula = await getHealthFormulaByKey(
      req.validatedParams.key
    );

    res.status(200).json({
      success: true,
      data: formula,
    });
  }
);