import { Router, type Request, type Response } from "express";
import { requireSession } from "../middleware/index.js";
import { getDailyReport, getHeatmapData } from "../lib/jobReportService.js";
import type {
  DailyApplicationReport,
  HeatmapCalendarResponse,
  AuthErrorResponse,
} from "../types/auth.js";

const router = Router();

router.get(
  "/job-report",
  requireSession,
  async (
    _req: Request,
    res: Response<DailyApplicationReport | AuthErrorResponse>
  ) => {
    try {
      const report = await getDailyReport();
      return res.json(report);
    } catch (error) {
      console.error("Error fetching job report:", error);
      return res.status(500).json({ error: "Failed to fetch job report" });
    }
  }
);

router.get(
  "/job-report-all",
  requireSession,
  async (
    _req: Request,
    res: Response<HeatmapCalendarResponse | AuthErrorResponse>
  ) => {
    try {
      const data = await getHeatmapData();
      return res.json(data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      return res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  }
);

export default router;
