import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { analyzeProduct, getReport, getReports } from "../controllers/compliance.controller.js";

const router = express.Router();

router.post("/analyze/:productId", protect, analyzeProduct);
router.get("/reports", protect, getReports);
router.get("/reports/:id", protect, getReport);

export default router;
