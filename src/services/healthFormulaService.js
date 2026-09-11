import {
  findAllFormulas,
  findFormulaByKey,
} from "../repositories/healthFormulaRepository.js";

export const getHealthFormulas = async () => {
  const formulas = await findAllFormulas();

  return formulas.map((formula) => ({
    ...formula,
    params: formula.params || [],
    constants: formula.constants || {},
  }));
};

export const getHealthFormulaByKey = async (key) => {
  const formula = await findFormulaByKey(key);

  if (!formula) {
    const error = new Error("Formula not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    ...formula,
    params: formula.params || [],
    constants: formula.constants || {},
  };
};