import { Router } from "express";
import {
  getHealthFormulasController,
  getHealthFormulaByKeyController,
} from "../controllers/healthFormulaController.js";
import { validate } from "../middleware/validate.js";
import { healthFormulaKeySchema } from "../validators/healthFormulaValidator.js";

const router = Router();

router.get("/formulas", getHealthFormulasController);

router.get(
  "/formulas/:key",
  validate(healthFormulaKeySchema, "params"),
  getHealthFormulaByKeyController
);

export default router;