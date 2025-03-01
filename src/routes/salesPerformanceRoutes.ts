import express from "express";
import { jwtCheck, jwtParse } from "../middleware/auth";
import salesPerformanceController from "../controllers/salesPerformanceController";

const router = express.Router();

// GET /api/my/restaurant/:restaurantId/reports/sales
// Get sales performance report with optional date range and period parameters
router.get(
  "/:restaurantId/reports/sales",
  jwtCheck,
  jwtParse,
  salesPerformanceController.getSalesPerformance
);

export default router;