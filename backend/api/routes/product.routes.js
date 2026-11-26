import express from "express";
import { upload } from "../middlewares/multer.js";
import {
  addEvidence,
  createProduct,
  getProduct,
  getProducts,
  removeEvidence,
} from "../controllers/product.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, upload.array("images", 5), createProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.post("/:id/evidence", protect, addEvidence);
router.delete("/:id/evidence/:evidenceId", protect, removeEvidence);

export default router;
