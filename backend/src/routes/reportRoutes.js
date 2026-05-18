import express from "express";

import {
  createReport,
  getMyReports,
} from "../controllers/reportController.js";

import { createReportValidator } from "../validator/reportValidator.js";
import validationMiddleware from "../middleware/validationMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createReportValidator, validationMiddleware, createReport);
router.get("/my", getMyReports);

export default router;