import { config } from "dotenv";
// Load environment variables from .env.local
config({ path: ".env.local" });

import express from "express";
import cors from "cors";
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
import jobsRoutes from "./routes/jobs.js";

const app = express();

// Trust proxy (Vercel) - required for secure cookies behind reverse proxy
app.set("trust proxy", 1);

// CORS configuration - must be before other middleware
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://jobs.luigigirke.com"]
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".luigigirke.com" : undefined,
      maxAge: SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
    },
  })
);

// Register routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(resumeRoutes);
app.use(transcribeRoutes);
app.use(jobsRoutes);

app.listen(3000, () => console.log("Resume API running on port 3000"));

export default app;
