import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });
import express, { type Request, type Response } from "express";
import PDFDocument from "pdfkit";
import { validateResumeData } from "./types.js";
import { mergeResumeData } from "./lib/merge.js";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { createClient } from "@supabase/supabase-js";
import { generateResumePDFBuffer, uploadPDFToSupabase } from "./lib/utils.js";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import AIInput from "./cache/resume.example.json" with { type: "json" };
import { ResumeInput } from "./generated/ResumeInput.js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || ""
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME!;
console.log(`📦 Using Supabase bucket: ${BUCKET_NAME}`);

// Register fontkit with PDFDocument
try {
  const require = createRequire(import.meta.url);
  const fontkit = require("fontkit");
  (PDFDocument as any).prototype._fontkit = fontkit;
  console.log("✓ fontkit registered with PDFKit");
} catch (err) {
  console.error("⚠ Failed to load fontkit:", (err as Error).message);
}

const app = express();
app.use(express.json());

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Font paths
const FONTS_DIR = join(__dirname, "fonts");
const FONTS = {
  regular: join(FONTS_DIR, "Cambria Regular.ttf"),
  bold: join(FONTS_DIR, "Cambria Bold.ttf"),
  italic: join(FONTS_DIR, "Cambria Italic.ttf"),
  boldItalic: join(FONTS_DIR, "Cambria BoldItalic.ttf"),
};

const hasCambria = Object.values(FONTS).every((path) => existsSync(path));

if (hasCambria) {
  console.log("✓ Cambria fonts found");
} else {
  console.log("⚠ Cambria fonts not found, using Helvetica fallback");
  console.log(`  Add Cambria fonts to: ${FONTS_DIR}`);
  console.log(`  See ${join(FONTS_DIR, "README.md")} for instructions`);
}

// Routes
app.post("/create-resume", async (req: Request, res: Response) => {
  try {
    const resumeData = mergeResumeData(req.body as ResumeInput);
    const validation = validateResumeData(resumeData);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid resume data",
        details: validation.errors,
      });
    }

    const pdfBuffer = await generateResumePDFBuffer(
      resumeData,
      hasCambria,
      FONTS
    );
    const { path, signedUrl } = await uploadPDFToSupabase(
      supabase,
      BUCKET_NAME,
      pdfBuffer,
      "resume.pdf"
    );

    return res.status(200).json({
      success: true,
      message: "Resume created and uploaded successfully",
      file: {
        path,
        signedUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("Error creating resume:", error);
    return res.status(500).json({
      error: "Failed to create resume",
      details: [(error as Error).message],
    });
  }
});

app.get("/base-resume", async (req: Request, res: Response) => {
  try {
    const baseResumePath = join(__dirname, "cache", "resume.json");

    if (!existsSync(baseResumePath)) {
      return res.status(404).json({
        error: "Base resume not found in cache",
      });
    }

    const fileContent = await readFile(baseResumePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    return res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error retrieving base resume:", error);
    return res.status(500).json({
      error: "Failed to retrieve base resume",
      details: [(error as Error).message],
    });
  }
});

app.get("/test", async (req: Request, res: Response) => {
  try {
    const resumeData = mergeResumeData(AIInput as ResumeInput);
    const pdfBuffer = await generateResumePDFBuffer(
      resumeData,
      hasCambria,
      FONTS
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      error: "Test failed",
      details: [(error as Error).message],
    });
  }
});

app.listen(3000, () => console.log("Resume API running on port 3000"));
app.get("/", async (req: Request, res: Response) => {
  res.sendStatus(200);
});
export default app;
