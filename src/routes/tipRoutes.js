import express from "express";

import { listTipsController } from "../controllers/tipController.js";

const router = express.Router();

router.get("/", listTipsController);

export default router;