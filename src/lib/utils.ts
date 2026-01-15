import PDFDocument from "pdfkit";
import { join, dirname } from "path";
import type { Resume } from "../types.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PNG icon path
const ICON_PATH = join(__dirname, "..", "public", "external-link.png");

// Helper function to draw external link icon using PNG
export function drawExternalLinkIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number = 7
) {
  doc.image(ICON_PATH, x, y, { width: size, height: size });
}

// Helper function to render a section title with horizontal line
export function renderSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  fontBold: string,
  lineStart: number,
  lineEnd: number
) {
  doc.fontSize(12).font(fontBold).text(title);
  doc.moveDown(0.125); // 3px gap (approximately 0.125 inches at 72 DPI)
  doc.moveTo(lineStart, doc.y).lineTo(lineEnd, doc.y).stroke().moveDown(0.5);
}

// Helper function to render bullet points with proper Word-like formatting
export function renderBullets(
  doc: PDFKit.PDFDocument,
  bullets: string[],
  font: string
) {
  const leftMargin = doc.page.margins.left;
  const textWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right - 20;

  bullets.forEach((bullet) => {
    const startY = doc.y;

    // Draw bullet point
    doc.font(font).text("•", leftMargin, startY, {
      width: 15,
      align: "left",
      lineBreak: false,
    });

    // Draw bullet text with proper indentation
    doc.text(bullet, leftMargin + 20, startY, {
      width: textWidth,
      align: "left",
    });

    // Note: doc.y is already updated by the text() call above to the correct next line position
  });

  // Reset X position back to left margin for subsequent content
  doc.x = leftMargin;
}

// Generate PDF and return it as a Buffer
export async function generateResumePDFBuffer(
  data: Resume,
  hasCambria: boolean,
  fonts: {
    regular: string;
    bold: string;
    italic: string;
    boldItalic: string;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 25 });
    const chunks: Buffer[] = [];

    // Collect PDF data into chunks
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks as any)));
    doc.on("error", reject);

    // Register Cambria fonts if available
    if (hasCambria) {
      doc.registerFont("Cambria", fonts.regular);
      doc.registerFont("Cambria-Bold", fonts.bold);
      doc.registerFont("Cambria-Italic", fonts.italic);
      doc.registerFont("Cambria-BoldItalic", fonts.boldItalic);
    }

    // Set font names based on availability
    const fontRegular = hasCambria ? "Cambria" : "Helvetica";
    const fontBold = hasCambria ? "Cambria-Bold" : "Helvetica-Bold";
    const fontItalic = hasCambria ? "Cambria-Italic" : "Helvetica-Oblique";
    const lineStart = 23; // Start 2 pixels earlier (25 - 2)
    const lineEnd = 588;

    // Header
    doc.fontSize(20).font(fontBold).text(data.name, { align: "center" });

    // Contact with clickable links and external link icon
    const contact = data.contact;
    const addressMatch = contact.match(/([\d\w\s.]+,\s*Halifax)/); // Match "6385 South St., Halifax"
    const emailMatch = contact.match(/(\S+@\S+\.\S+)/);
    const phoneMatch = contact.match(/\+1 \(\d{3}\) \d{3}-\d{4}/);
    const websiteMatch = contact.match(/(https:\/\/[^\s|]+)/);

    doc.fontSize(10).font(fontRegular);
    const contactY = doc.y;
    doc.text(contact, { align: "center" });

    const iconSize = 7;
    const iconPadding = 2;

    // Draw external link icon after website URL
    if (websiteMatch?.[1]) {
      const website = websiteMatch[1];
      const textWidth = doc.widthOfString(contact);
      const websiteStart = doc.widthOfString(contact.substring(0, contact.indexOf(website)));
      const websiteWidth = doc.widthOfString(website);
      const pageWidth = doc.page.width;
      const centerOffset = (pageWidth - textWidth) / 2;
      const iconX = centerOffset + websiteStart + websiteWidth + iconPadding;
      // Adjust Y position to vertically center icon with text
      const iconY = contactY + 3;

      drawExternalLinkIcon(doc, iconX, iconY, iconSize);
    }

    // Add clickable links on top of the text
    if (addressMatch?.[1]) {
      const address = addressMatch[1];
      const textWidth = doc.widthOfString(contact);
      const addressStart = doc.widthOfString(contact.substring(0, contact.indexOf(address)));
      const addressWidth = doc.widthOfString(address);
      const pageWidth = doc.page.width;
      const startX = (pageWidth - textWidth) / 2 + addressStart;
      doc.link(startX, contactY, addressWidth, 12, "https://maps.app.goo.gl/bEP4bdKxtqGBnx3a8");
    }

    if (emailMatch?.[1]) {
      const email = emailMatch[1];
      const textWidth = doc.widthOfString(contact);
      const emailStart = doc.widthOfString(contact.substring(0, contact.indexOf(email)));
      const emailWidth = doc.widthOfString(email);
      const pageWidth = doc.page.width;
      const startX = (pageWidth - textWidth) / 2 + emailStart;
      doc.link(startX, contactY, emailWidth, 12, `mailto:${email}`);
    }

    if (phoneMatch?.[0]) {
      const phone = phoneMatch[0];
      const textWidth = doc.widthOfString(contact);
      const phoneStart = doc.widthOfString(contact.substring(0, contact.indexOf(phone)));
      const phoneWidth = doc.widthOfString(phone);
      const pageWidth = doc.page.width;
      const startX = (pageWidth - textWidth) / 2 + phoneStart;
      doc.link(startX, contactY, phoneWidth, 12, `tel:${phone.replace(/\D/g, '')}`);
    }

    if (websiteMatch?.[1]) {
      const website = websiteMatch[1];
      const textWidth = doc.widthOfString(contact);
      const websiteStart = doc.widthOfString(contact.substring(0, contact.indexOf(website)));
      const websiteWidth = doc.widthOfString(website);
      const pageWidth = doc.page.width;
      const startX = (pageWidth - textWidth) / 2 + websiteStart;
      // Include the external link icon in the clickable area
      doc.link(startX, contactY, websiteWidth + iconPadding + iconSize, 12, website);
    }

    // Summary Section
    renderSectionTitle(doc, "SUMMARY", fontBold, lineStart, lineEnd);
    doc.fontSize(10).font(fontRegular).text(data.summary).moveDown();

    // Experience Section
    renderSectionTitle(doc, "EXPERIENCE", fontBold, lineStart, lineEnd);
    data.experience.forEach((job) => {
      // Role (bold), Institution - Location (not bold)
      doc.fontSize(10).font(fontBold).text(job.role, { continued: true });
      doc
        .font(fontRegular)
        .text(`, ${job.institution} - ${job.location}`, { continued: true });
      doc.font(fontRegular).text(job.dates, { align: "right" });
      renderBullets(doc, job.bullets, fontRegular);
      doc.moveDown();
    });

    // Projects Section
    renderSectionTitle(doc, "PROJECTS", fontBold, lineStart, lineEnd);
    const projectIconSize = 7;
    const projectIconPadding = 2;

    data.projects.forEach((project) => {
      const titleStartY = doc.y;
      const titleStartX = doc.x;

      // Draw title (bold)
      doc.fontSize(10).font(fontBold);
      const titleWidth = doc.widthOfString(project.title);
      doc.text(project.title, { continued: true });

      // Add space for the icon (reduced by 1 pixel to bring comma closer)
      const spaceWidth = projectIconSize + projectIconPadding * 2 - 1;
      doc.text(" ".repeat(Math.ceil(spaceWidth / doc.widthOfString(" "))), { continued: true });

      // Draw comma and subtitle (italic), dates (regular)
      doc.font(fontItalic).text(`, ${project.subtitle}`, { continued: true });
      doc.font(fontRegular).text(project.dates, { align: "right" });

      // Draw external link icon after title (overlaid on top of the space)
      const iconX = titleStartX + titleWidth + projectIconPadding;
      const iconY = titleStartY + 3; // Vertically center with text
      drawExternalLinkIcon(doc, iconX, iconY, projectIconSize);

      // Add clickable link overlay on the title (including the icon)
      const url = project.link.startsWith("http") ? project.link : `https://${project.link}`;
      doc.link(titleStartX, titleStartY, titleWidth + projectIconPadding + projectIconSize, 12, url);

      renderBullets(doc, project.bullets, fontRegular);
      doc.moveDown();
    });

    // Education Section
    renderSectionTitle(doc, "EDUCATION", fontBold, lineStart, lineEnd);
    doc
      .fontSize(10)
      .font(fontBold)
      .text(data.education.university, { continued: true });
    doc.text(data.education.expectedGrad, { align: "right" });
    doc.font(fontRegular).text(data.education.degree, { continued: true });
    doc.text(data.education.cumulativeGPA, { align: "right" });
    doc.font(fontItalic).text(data.education.coursework).moveDown();

    // Skills Section
    renderSectionTitle(doc, "SKILLS", fontBold, lineStart, lineEnd);
    data.skills.forEach((skill, index) => {
      doc.fontSize(10).font(fontBold).text(`${skill.label}: `, { continued: true });
      doc.font(fontRegular).text(skill.value);
    });

    doc.end();
  });
}

// Upload PDF to Supabase Storage and return signed URL
export async function uploadPDFToSupabase(
  supabase: SupabaseClient,
  bucketName: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<{ path: string; signedUrl: string }> {
  const filePath = `${Date.now()}_${filename}`;

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Create a signed URL that expires in 1 hour (3600 seconds)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600);

  if (signedError) {
    throw new Error(`Failed to create signed URL: ${signedError.message}`);
  }

  return {
    path: data.path,
    signedUrl: signedData.signedUrl,
  };
}
