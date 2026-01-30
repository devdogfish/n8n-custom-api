import { config } from "dotenv";
// Load environment variables from .env.local
config({ path: ".env.local" });

import express from "express";
import session from "express-session";

// Import types for session augmentation
import "./types/auth.js";

// Import config to initialize supabase, fonts, etc.
import "./config/index.js";

// Import routes
import healthRoutes from "./routes/health.js";
import resumeRoutes from "./routes/resume.js";
import transcribeRoutes from "./routes/transcribe.js";
import authRoutes from "./routes/auth.js";
import jobReportRoutes from "./routes/jobReport.js";

const app = express();
app.use(express.json());

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE_HOURS = parseInt(
  process.env.SESSION_MAX_AGE_HOURS || "24",
  10
);

if (!SESSION_SECRET) {
  console.warn(
    "WARNING: SESSION_SECRET not set. Using insecure default for development."
  );
}

app.use(
  session({
    secret: SESSION_SECRET || "insecure-dev-secret-do-not-use-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
    },
  })
);

// Register routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(resumeRoutes);
app.use(transcribeRoutes);
app.use(jobReportRoutes);

app.listen(3000, () => console.log("Resume API running on port 3000"));

export default app;
