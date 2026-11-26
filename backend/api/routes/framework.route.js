import express from "express";


import { isAdmin, protect } from "../middlewares/auth.middleware.js";
import { createFrameWork, getFramework, reindexFramework } from "../controllers/framerwork.controller.js";

const router = express.Router();
router.post("/create", protect, isAdmin, createFrameWork);
router.get("/get-frameworks", getFramework);
router.post("/:id/index", protect, isAdmin, reindexFramework);

export default router;