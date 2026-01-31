import { SHEET_ID, JOB_APPLICATIONS_SHEET, SHEET_NAMES } from "./constants.js";

export interface SheetRow {
  [key: string]: string | number | boolean | null;
}

export interface GoogleVisualizationResponse {
  version: string;
  reqId: string;
  status: string;
  table: {
    cols: Array<{ id: string; label: string; type: string }>;
    rows: Array<{ c: Array<{ v?: unknown; f?: string } | null> }>;
  };
}

/**
 * Fetch data from a Google Sheet tab.
 * @param sheetName - The tab name (defaults to JOB_APPLICATIONS_SHEET)
 * @returns Array of row objects with column labels as keys
 */
export async function fetchSheetData(
  sheetName: string = JOB_APPLICATIONS_SHEET
): Promise<SheetRow[]> {
  if (!SHEET_ID) {
    throw new Error("SHEET_ID environment variable is not set");
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status}`);
  }

  const text = await response.text();

  // Parse JSONP response: /*O_o*/ google.visualization.Query.setResponse({...});
  const match = text.match(
    /google\.visualization\.Query\.setResponse\((.*)\);?$/s
  );
  if (!match) {
    throw new Error("Invalid Google Visualization API response format");
  }

  const data: GoogleVisualizationResponse = JSON.parse(match[1]);

  if (data.status !== "ok") {
    throw new Error(`Google Sheets API error: ${data.status}`);
  }

  const { cols, rows } = data.table;

  return rows.map((row) => {
    const obj: SheetRow = {};
    cols.forEach((col, i) => {
      const cell = row.c[i];
      if (cell) {
        // Use raw value (v) if available, otherwise formatted value (f)
        obj[col.label] = cell.v !== undefined ? (cell.v as SheetRow[string]) : (cell.f ?? null);
      } else {
        obj[col.label] = null;
      }
    });
    return obj;
  });
}

/**
 * Parse Google Sheets date format "Date(YYYY,M,D)" or "Date(YYYY,M,D,H,M,S)" to Date object.
 * Note: Month is 0-indexed in Google Sheets format.
 */
export function parseGoogleSheetsDate(dateStr: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const match = dateStr.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
  if (!match) return null;

  const [, year, month, day, hours = "0", minutes = "0", seconds = "0"] = match;
  return new Date(
    parseInt(year),
    parseInt(month),
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDate(dateInput?: Date | string, includeTime = true) {
  const date =
    dateInput instanceof Date
      ? dateInput
      : dateInput
        ? new Date(dateInput)
        : new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  return `${year}-${month}-${day}`;
}

export function getSheetURL(sheetName: (typeof SHEET_NAMES)[number]) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${
    sheetName // the tab name in your sheet (Exercises, Sets, etc.)
  }`;
}

// Helper to parse Google Sheets Date format: "Date(2024,9,28)"
// export function parseSheetDate(dateStr: string): Date {
//   const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
//   if (match) {
//     const [, year, month, day] = match;
//     return new Date(parseInt(year), parseInt(month), parseInt(day));
//   }
//   return new Date(dateStr);
// }

export function parseDateString(timestamp: string): Date {
  // Fix regex to use $$ and $$ to match parentheses
  const dateMatch = timestamp.match(
    /Date$$(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)$$/,
  );
  if (dateMatch) {
    const [, year, month, date, hours, minutes, seconds] = dateMatch;
    return new Date(
      Number.parseInt(year),
      Number.parseInt(month),
      Number.parseInt(date),
      Number.parseInt(hours),
      Number.parseInt(minutes),
      Number.parseInt(seconds),
    );
  }
  // Fallback to standard date parsing
  return new Date(timestamp);
}
export function parseCustomDateUTC(str: string): Date {
  const parts = str.match(/\d+/g)?.map(Number);
  if (!parts || parts.length < 3) {
    throw new Error(
      "Invalid date format. Expected something like 'Date(2025,9,28,22,44,49)'.",
    );
  }

  const [year, month, day, hour = 0, minute = 0, second = 0] = parts;

  // Create Date in UTC (month minus nothing because the result already comes zero-index based)
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

export function formatHumanDate(date: Date) {
  const d = new Date(date);

  // Use the browser’s locale to make it human-friendly
  return d.toLocaleString("en-US", {
    weekday: "short", // e.g., "Mon"
    year: "numeric",
    month: "long", // e.g., "November"
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  // → "Mon, November 3, 2025, 10:24 AM"
}

// console.log(parseCustomDateUTC("Date(2025,9,28,22,44,49)").toISOString());
// → "2025-09-28T22:44:49.000Z"

// or if the one above doesn't work:
// export function parseSheetDate(str: string): Date | null {
//   const match = str.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
//   if (!match) return null;
//   const [, year, month, day, hour, min, sec] = match.map(Number);
//   return new Date(year, month, day, hour, min, sec);
// }
