import express from "express"
import { createOrganization, getAllCompanies } from "../controllers/organization.controller.js"

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protect,createOrganization);
router.get("/get-companies", getAllCompanies);

// https://localhost:5000/api/organization/create
// http://localhost:5000/api/organization/get-companies
export default router;
