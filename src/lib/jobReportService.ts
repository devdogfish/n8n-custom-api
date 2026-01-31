import type {
  DailyApplicationReport,
  HeatmapCalendarResponse,
  Application,
  HeatmapDataPoint,
} from "../types/auth.js";
import {
  fetchSheetData,
  parseGoogleSheetsDate,
  toISODateString,
  type SheetRow,
} from "./sheets.utils.js";

/**
 * Transform a sheet row to an Application object.
 */
function rowToApplication(row: SheetRow): Application {
  const matchPercent = row.matchPercent as number | null;
  const matchLevel =
    matchPercent !== null
      ? matchPercent >= 80
        ? "high"
        : matchPercent >= 50
          ? "medium"
          : "low"
      : undefined;

  // Parse salary info - it may be a JSON string like '["$100k - $150k"]' or null
  let displayValue = "Not specified";
  let salaryAmount: number | undefined;
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;

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
    /\$?([\d,]+)k?\s*[-–]\s*\$?([\d,]+)k?/i
  );
  if (rangeMatch) {
    salaryMin =
      parseInt(rangeMatch[1].replace(/,/g, "")) *
      (displayValue.toLowerCase().includes("k") ? 1000 : 1);
    salaryMax =
      parseInt(rangeMatch[2].replace(/,/g, "")) *
      (displayValue.toLowerCase().includes("k") ? 1000 : 1);
  } else {
    const singleMatch = displayValue.match(/\$?([\d,]+)k?/i);
    if (singleMatch) {
      salaryAmount =
        parseInt(singleMatch[1].replace(/,/g, "")) *
        (displayValue.toLowerCase().includes("k") ? 1000 : 1);
    }
  }

  const compensationType =
    salaryMin && salaryMax ? "range" : salaryAmount ? "salary" : "salary";

  return {
    position: (row.title as string) || "Unknown Position",
    company: (row.companyName as string) || "Unknown Company",
    location: (row.location as string) || "Unknown",
    locationType:
      ((row.locationType as string)?.toLowerCase() as
        | "remote"
        | "hybrid"
        | "on-site") || undefined,
    compensation: {
      type: compensationType,
      currency: "USD",
      amount: salaryAmount,
      min: salaryMin,
      max: salaryMax,
      displayValue,
    },
    matchPercentage: matchPercent ?? undefined,
    matchLevel,
    description: (row.description as string) || "",
    priority: "standard",
    href: (row.link as string) || (row.applyUrl as string) || "#",
    resumeId: (row.resumeId as string) || "",
    tags: row.industries
      ? (row.industries as string).split(",").map((t) => t.trim())
      : undefined,
  };
}

/**
 * Get all job applications from Google Sheets.
 */
export async function getAllApplications(): Promise<
  Array<{ appliedAt: Date | null; application: Application }>
> {
  const rows = await fetchSheetData();

  return rows.map((row) => ({
    appliedAt: parseGoogleSheetsDate(row.appliedAt as string | null),
    application: rowToApplication(row),
  }));
}

/**
 * Get applications for a specific date.
 * @param date - ISO date string (YYYY-MM-DD) or Date object
 */
export async function getApplicationsByDate(
  date: string | Date
): Promise<Application[]> {
  const targetDate =
    typeof date === "string" ? date : toISODateString(date);

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
  date?: string
): Promise<DailyApplicationReport> {
  const targetDate = date || toISODateString(new Date());
  const applications = await getApplicationsByDate(targetDate);

  // Sort by match percentage (highest first)
  const sorted = [...applications].sort(
    (a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0)
  );

  // Featured: top match as main, next 2 high matches as secondary
  const highMatches = sorted.filter(
    (app) => app.matchPercentage && app.matchPercentage >= 80
  );
  const main = highMatches[0];
  const secondary = highMatches.slice(1, 3);

  // Mark featured applications with correct priority
  if (main) {
    main.priority = "featured-main";
  }
  secondary.forEach((app) => {
    app.priority = "featured-side";
  });

  // Other applications (excluding featured)
  const featuredIds = new Set([main, ...secondary].filter(Boolean).map((a) => a?.href));
  const otherApplications = sorted.filter((app) => !featuredIds.has(app.href));

  // Calculate average salary from applications with numeric values
  const salaries = applications
    .map((app) => app.compensation.amount || app.compensation.min || 0)
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
      averageSalary: avgSalary > 0 ? `$${Math.round(avgSalary / 1000)}K` : "N/A",
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
  endDate?: string
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
