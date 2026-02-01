import { Router, type Request, type Response } from "express";
import { requireSession } from "../middleware/index.js";
import { getApplications } from "../lib/jobReportService.js";
import type { Application } from "../types/application.js";
import { AuthErrorResponse } from "../types/auth.js";
import { isValidISODateString } from "../lib/sheets.utils.js";

const router = Router();

interface JobsResponse {
  applications: Application[];
  error?: string;
}

router.get(
  "/jobs",
  requireSession,
  async (
    req: Request<object, object, object, { date?: string }>,
    res: Response<JobsResponse | AuthErrorResponse>,
  ) => {
    try {
      const { date } = req.query;

      // Validate date format if provided
      if (date !== undefined) {
        if (!isValidISODateString(date)) {
          return res.status(400).json({
            applications: [],
            error: "Invalid date format. Use YYYY-MM-DD (ISO date string)",
          });
        }
      }

      const applications = await getApplications(date);
      return res.json({
        applications: applications.map((app) => ({
          ...app,
          id: String(app.id),
        })),
      });
    } catch (error) {
      console.error("Error fetching job applications:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch job applications" });
    }
  },
);

export default router;
