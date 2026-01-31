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
    req: Request<object, object, object, { date?: string }>,
    res: Response<DailyApplicationReport | AuthErrorResponse>
  ) => {
    try {
      // Accept optional date query parameter (ISO format: YYYY-MM-DD)
      const date = req.query.date;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      const report = await getDailyReport(date);
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
    req: Request<object, object, object, { startDate?: string; endDate?: string }>,
    res: Response<HeatmapCalendarResponse | AuthErrorResponse>
  ) => {
    try {
      // Accept optional startDate and endDate query parameters (ISO format: YYYY-MM-DD)
      const { startDate, endDate } = req.query;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({ error: "Invalid startDate format. Use YYYY-MM-DD" });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({ error: "Invalid endDate format. Use YYYY-MM-DD" });
      }
      const data = await getHeatmapData(startDate, endDate);
      return res.json(data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      return res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  }
);

export default router;
