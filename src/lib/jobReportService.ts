import {
  Application,
  DailyApplicationReport,
  HeatmapCalendarResponse,
  HeatmapDataPoint,
} from "../types/application.js";
import {
  fetchSheetData,
  parseGoogleSheetsDate,
  toISODateString,
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
  const dateStr = appliedAt ? toISODateString(appliedAt) : "unknown";
  const id = `${company}-${role}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

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
    status: (row.status as string) || "Applied",
    tags: row.industries
      ? (row.industries as string).split(",").map((t) => t.trim())
      : [],
  };
}

/**
 * Get all job applications from Google Sheets.
 */
export async function getAllApplications(): Promise<
  Array<{ appliedAt: Date | null; application: Application }>
> {
  const rows = await fetchSheetData();

  return rows.map((row) => {
    const appliedAt = parseGoogleSheetsDate(row.appliedAt as string | null);
    return {
      appliedAt,
      application: rowToApplication(row, appliedAt),
    };
  });
}

/**
 * Get applications for a specific date.
 * @param date - ISO date string (YYYY-MM-DD) or Date object
 */
export async function getApplicationsByDate(
  date: string | Date,
): Promise<Application[]> {
  const targetDate = typeof date === "string" ? date : toISODateString(date);

  const allApplications = await getAllApplications();

  return allApplications
    .filter((item) => {
      if (!item.appliedAt) return false;
      return toISODateString(item.appliedAt) === targetDate;
    })
    .map((item) => item.application);
}

/**
 * Get the daily job application report.
 * @param date - Optional ISO date string (YYYY-MM-DD). Defaults to today.
 */
export async function getDailyReport(
  date?: string,
): Promise<DailyApplicationReport> {
  const targetDate = date || toISODateString(new Date());
  const applications = await getApplicationsByDate(targetDate);

  // Sort by match percentage (highest first)
  const sorted = [...applications].sort((a, b) => b.match - a.match);

  // Featured: top match as main, next 2 high matches as secondary
  const highMatches = sorted.filter((app) => app.match >= 80);
  const main = highMatches[0];
  const secondary = highMatches.slice(1, 3);

  // Other applications (excluding featured)
  const featuredIds = new Set(
    [main, ...secondary].filter(Boolean).map((a) => a?.id),
  );
  const otherApplications = sorted.filter((app) => !featuredIds.has(app.id));

  // Calculate average salary from applications with numeric values
  const salaries = applications
    .map((app) => app.salary.amount ?? 0)
    .filter((s) => s > 0);
  const avgSalary =
    salaries.length > 0
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : 0;

  return {
    metadata: {
      issueNumber: 1, // Could be calculated based on date
      date: targetDate,
      totalApplications: applications.length,
      highPriorityCount: highMatches.length,
      averageSalary:
        avgSalary > 0 ? `$${Math.round(avgSalary / 1000)}K` : "N/A",
    },
    featuredApplications: {
      main,
      secondary,
    },
    otherApplications,
  };
}

/**
 * Get heatmap calendar data for all job applications.
 * @param startDate - Optional start date (ISO string). Defaults to 3 months ago.
 * @param endDate - Optional end date (ISO string). Defaults to today.
 */
export async function getHeatmapData(
  startDate?: string,
  endDate?: string,
): Promise<HeatmapCalendarResponse> {
  const allApplications = await getAllApplications();

  // Default date range: last 3 months
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getFullYear(), end.getMonth() - 3, end.getDate());

  const startStr = toISODateString(start);
  const endStr = toISODateString(end);

  // Count applications by date
  const countsByDate = new Map<string, number>();

  allApplications.forEach((item) => {
    if (!item.appliedAt) return;
    const dateStr = toISODateString(item.appliedAt);
    if (dateStr >= startStr && dateStr <= endStr) {
      countsByDate.set(dateStr, (countsByDate.get(dateStr) ?? 0) + 1);
    }
  });

  // Convert to array of HeatmapDataPoint
  const data: HeatmapDataPoint[] = Array.from(countsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalApplications = data.reduce((sum, d) => sum + d.count, 0);

  return {
    data,
    startDate: startStr,
    endDate: endStr,
    totalApplications,
  };
}
