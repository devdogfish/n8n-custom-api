import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const SRC_DIR = join(__dirname, "..");

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME!;
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

// Font paths
export const FONTS_DIR = join(SRC_DIR, "fonts");
export const FONTS = {
  regular: join(FONTS_DIR, "Cambria Regular.ttf"),
  bold: join(FONTS_DIR, "Cambria Bold.ttf"),
  italic: join(FONTS_DIR, "Cambria Italic.ttf"),
  boldItalic: join(FONTS_DIR, "Cambria BoldItalic.ttf"),
};

export const hasCambria = Object.values(FONTS).every((path) => existsSync(path));

if (hasCambria) {
  console.log("✓ Cambria fonts found");
} else {
  console.log("⚠ Cambria fonts not found, using Helvetica fallback");
  console.log(`  Add Cambria fonts to: ${FONTS_DIR}`);
  console.log(`  See ${join(FONTS_DIR, "README.md")} for instructions`);
}
