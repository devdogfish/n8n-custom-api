// Main report interface
export interface DailyApplicationReport {
  metadata: ReportMetadata;
  featuredApplications: FeaturedApplications;
  otherApplications: Application[];
}

// Report metadata (header information)
export interface ReportMetadata {
  issueNumber: number;
  date: string;
  totalApplications: number;
  highPriorityCount: number;
  averageSalary: string;
}

// Featured applications with priority hierarchy
export interface FeaturedApplications {
  main?: Application;
  secondary: Application[];
}

// Core application data structure
export interface Application {
  // renamed match to match
  id: string; // unique identifier
  company: string; // "Starlight Studios"
  role: string; // "Senior Creative Developer"
  location: string; // "San Francisco (Remote)"
  locationType?: "remote" | "hybrid" | "on-site"; // Can be derived from location
  description: string;

  href: string; // Link to job posting
  salary: {
    type: "salary" | "hourly" | "equity" | "range";
    currency: string; // USD, GBP, EUR, etc.
    amount?: number; // Single amount
    displayValue: string; // Original formatted string like "$160k - $190k"
  }; // "$160k - $190k"

  match: number; // 95 (percentage 0-100)
  date: string; // "2026-01-28" (ISO date for heatmap + sorting)
  status: string; // "Drafted" or "Rejected" or "Interview pending"
  tags: string[]; // ["React", "WebGL", "Three.js"]
}

// ============================================
// Heatmap Calendar Types
// ============================================

export interface HeatmapDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
}

export interface HeatmapCalendarResponse {
  data: HeatmapDataPoint[];
  startDate: string;
  endDate: string;
  totalApplications: number;
}
