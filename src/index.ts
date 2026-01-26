import { config } from "dotenv";
// Load environment variables from .env.local
config({ path: ".env.local" });

import express from "express";

// Import config to initialize supabase, fonts, etc.
import "./config/index.js";

// Import routes
import healthRoutes from "./routes/health.js";
import resumeRoutes from "./routes/resume.js";
import transcribeRoutes from "./routes/transcribe.js";

const app = express();
app.use(express.json());

// Register routes
app.use(healthRoutes);
app.use(resumeRoutes);
app.use(transcribeRoutes);

app.listen(3000, () => console.log("Resume API running on port 3000"));

export default app;
