import { Application } from "../types/application.js";
import {
  fetchSheetData,
  parseGoogleSheetsDate,
  toHalifaxDateString,
  type SheetRow,
} from "./sheets.utils.js";

/**
 * Transform a sheet row to an Application object.
 */
function rowToApplication(row: SheetRow, appliedAt: Date | null): Application {
  const matchPercent = row.matchPercent as number | null;

  // Parse salary info - it may be a JSON string like '["$100k - $150k"]' or null
  let displayValue = "Not specified";
  let salaryAmount: number | undefined;

  const salaryInfo = row.salaryInfo as string | null;
  const salary = row.salary as string | null;

  if (salaryInfo && salaryInfo !== '[""]' && salaryInfo !== "[]") {
    try {
      const parsed = JSON.parse(salaryInfo);
      if (Array.isArray(parsed) && parsed[0]) {
        displayValue = parsed[0];
      }
    } catch {
      displayValue = salaryInfo;
    }
  } else if (salary) {
    displayValue = salary;
  }

  // Try to extract numeric values from displayValue
  const rangeMatch = displayValue.match(
    /\$?([\d,]+)k?\s*[-–]\s*\$?([\d,]+)k?/i,
  );
  if (rangeMatch) {
    // Use midpoint for range
    const min =
      parseInt(rangeMatch[1].replace(/,/g, "")) *
      (displayValue.toLowerCase().includes("k") ? 1000 : 1);
    const max =
      parseInt(rangeMatch[2].replace(/,/g, "")) *
      (displayValue.toLowerCase().includes("k") ? 1000 : 1);
    salaryAmount = Math.round((min + max) / 2);
  } else {
    const singleMatch = displayValue.match(/\$?([\d,]+)k?/i);
    if (singleMatch) {
      salaryAmount =
        parseInt(singleMatch[1].replace(/,/g, "")) *
        (displayValue.toLowerCase().includes("k") ? 1000 : 1);
    }
  }

  // Determine salary type based on what we parsed
  const salaryType: "salary" | "hourly" | "equity" | "range" = rangeMatch
    ? "range"
    : "salary";

  // Generate a unique ID from company + role + date
  const role = (row.title as string) || "Unknown Position";
  const company = (row.companyName as string) || "Unknown Company";
  const dateStr = appliedAt ? toHalifaxDateString(appliedAt) : "unknown";
  const id = `${company}-${role}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  // Determine eligible based on "sent" column
  // TRUE -> true, FALSE -> false, empty/undefined -> undefined
  const sent = row.sent;
  let eligible: boolean | undefined;
  if (sent === true || sent === "TRUE" || sent === "true") {
    eligible = true;
  } else if (sent === false || sent === "FALSE" || sent === "false") {
    eligible = false;
  }
  // else eligible remains undefined

  // If sent is empty/undefined, status should be "In Progress"
  const defaultStatus = eligible === undefined ? "In Progress" : "Applied";

  return {
    id,
    company,
    role,
    location: (row.location as string) || "Unknown",
    locationType:
      ((row.locationType as string)?.toLowerCase() as
        | "remote"
        | "hybrid"
        | "on-site") || undefined,
    salary: {
      type: salaryType,
      currency: "USD",
      amount: salaryAmount,
      displayValue,
    },
    match: matchPercent ?? 0,
    description: (row.description as string) || "",
    href: (row.link as string) || (row.applyUrl as string) || "#",
    date: dateStr,
    status: (row.status as string) || defaultStatus,
    tags: row.industries
      ? (row.industries as string).split(",").map((t) => t.trim())
      : [],
    eligible,
  };
}

/**
 * Get all job applications from Google Sheets.
 * @param date - Optional ISO date string (YYYY-MM-DD) to filter by. Uses Halifax timezone for comparison.
 */
export async function getApplications(date?: string): Promise<Application[]> {
  const rows = await fetchSheetData();

  const applications = rows.map((row) => {
    const appliedAt = parseGoogleSheetsDate(row.appliedAt as string | null);
    return {
      appliedAt,
      application: rowToApplication(row, appliedAt),
    };
  });

  // If no date filter, return all applications
  if (!date) {
    return applications.map((item) => item.application);
  }

  // Filter by date using Halifax timezone
  return applications
    .filter((item) => {
      if (!item.appliedAt) return false;
      return toHalifaxDateString(item.appliedAt) === date;
    })
    .map((item) => item.application);
}

