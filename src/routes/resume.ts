import { Router, type Request, type Response } from "express";
import { validateResumeData } from "../lib/validation.js";
import { mergeResumeData } from "../lib/merge.js";
import { generateResumePDFBuffer, uploadPDFToSupabase } from "../lib/utils.js";
import { supabase, BUCKET_NAME, hasCambria, FONTS } from "../config/index.js";
import AIInput from "../cache/request.example.json" with { type: "json" };
import baseResume from "../cache/base-resume.export.json" with { type: "json" };
import baseResumeRaw from "../cache/base-resume.json" with { type: "json" };
import { ResumeInputType } from "../generated/ResumeInputType.js";

const router = Router();

router.post("/create-resume", async (req: Request, res: Response) => {
  try {
    const resumeData = mergeResumeData(req.body as ResumeInputType);
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
      FONTS,
    );
    const { path, signedUrl, id } = await uploadPDFToSupabase(
      supabase,
      BUCKET_NAME,
      pdfBuffer,
      "resume.pdf",
    );

    return res.status(200).json({
      success: true,
      message: "Resume created and uploaded successfully",
      file: {
        id,
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

router.get("/base-resume", (_req: Request, res: Response) => {
  return res.status(200).json(baseResumeRaw);
});

router.get("/test", async (req: Request, res: Response) => {
  try {
    const resumeData = mergeResumeData(AIInput as ResumeInputType);
    const pdfBuffer = await generateResumePDFBuffer(
      resumeData,
      hasCambria,
      FONTS,
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

router.get("/base-resume-pdf", async (req: Request, res: Response) => {
  try {
    const resumeData = mergeResumeData(baseResume as ResumeInputType);
    const pdfBuffer = await generateResumePDFBuffer(
      resumeData,
      hasCambria,
      FONTS,
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

export default router;
