import "express-session";

// Augment express-session to include our custom session data
declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
  }
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
}

export interface AuthErrorResponse {
  error: string;
}

export interface SessionStatusResponse {
  authenticated: boolean;
}

// ============================================
// Job Report Types (moved from job-reports/types.ts)
// ============================================

export interface DailyApplicationReport {
  metadata: ReportMetadata;
  featuredApplications: FeaturedApplications;
  otherApplications: Application[];
}

export interface ReportMetadata {
  issueNumber: number;
  date: string;
  totalApplications: number;
  highPriorityCount: number;
  averageSalary: string;
}

export interface FeaturedApplications {
  main?: Application;
  secondary: Application[];
}

export interface Application {
  position: string;
  company: string;
  location: string;
  locationType?: "remote" | "hybrid" | "on-site";
  compensation: Compensation;
  matchPercentage?: number;
  matchLevel?: "high" | "medium" | "low";
  description: string;
  tags?: string[];
  status?: string;
  whyItFits?: string;
  priority: "featured-main" | "featured-side" | "standard";
  href: string;
  resumeId: string;
}

export interface Compensation {
  type: "salary" | "hourly" | "equity" | "range";
  currency: string;
  amount?: number;
  min?: number;
  max?: number;
  displayValue: string;
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
