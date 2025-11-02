
import express from "express";
import { getParcelRevenueSummary } from "../controllers/parcelRevenueController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions as authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/summary", userAuth, authorize("reports:view"), getParcelRevenueSummary);

export default router;
