import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { SHEET_NAMES } from "../src/lib/constants.js";
import { getSheetURL } from "../src/lib/sheets.utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GoogleSheetResponse {
  table: {
    cols: { label: string }[];
    rows: { c: { v: any }[] }[];
  };
}

async function fetchSheet(
  sheetName: (typeof SHEET_NAMES)[number],
): Promise<GoogleSheetResponse> {
  const sheetURL = getSheetURL(sheetName);
  const res = await fetch(sheetURL);
  const text = await res.text();
  return JSON.parse(text.substring(47).slice(0, -2)) as GoogleSheetResponse;
}

async function generateTypeDefinition(sheetName: (typeof SHEET_NAMES)[number]) {
  const json = await fetchSheet(sheetName);

  const headers = json.table.cols.map((col) => col.label || "Column");

  const interfaceName =
    sheetName.charAt(0).toUpperCase() + sheetName.slice(1) + "Row";

  const fields = headers
    .map((h) => {
      const safeKey = h
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "")
        .replace(/^(\d)/, "_$1");
      return `  ${safeKey}: string;`;
    })
    .join("\n");

  return `export interface ${interfaceName} {\n${fields}\n}\n`;
}

async function main() {
  console.log("Generating type definitions...");

  const allTypeDefs = await Promise.all(
    SHEET_NAMES.map(async (name) => {
      try {
        return await generateTypeDefinition(name);
      } catch (err) {
        console.error(`❌ Failed to generate for "${name}":`, err);
        return "";
      }
    }),
  );

  const combinedTypes = allTypeDefs.join("\n");

  const outputPath = path.resolve(__dirname, "../src/types/sheets.d.ts");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, combinedTypes, "utf8");

  console.log(`All sheet types written to ${outputPath}`);
}

main().catch(console.error);
