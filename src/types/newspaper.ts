// Main report interface
export interface DailyApplicationReport {
  metadata: ReportMetadata;
  featuredApplications: FeaturedApplications;
  otherApplications: Application[];
}

// Report metadata (header information)
export interface ReportMetadata {
  issueNumber: number;
  date: string; // ISO date string or Date
  totalApplications: number;
  highPriorityCount: number;
  averageSalary: string; // e.g., "$145K"
}

// Featured applications with priority hierarchy
export interface FeaturedApplications {
  main?: Application; // Top priority - optional if no applications
  secondary: Application[]; // Can have 0-2 secondary featured apps
}

// Core application data structure
export interface Application {
  position: string;
  company: string;
  location: string;
  locationType?: "remote" | "hybrid" | "on-site"; // Can be derived from location
  compensation: Compensation;
  matchPercentage?: number; // Optional, 0-100
  matchLevel?: "high" | "medium" | "low"; // For styling
  description: string;
  tags?: string[]; // For categorization
  caption?: string; // Optional caption, only shown for featured-main applications
  priority: "featured-main" | "featured-side" | "standard";
  href: string; // Link to job posting
  resumeId: string; // ID of resume used/to use for this application
}

// Compensation can be salary, hourly, or range
export interface Compensation {
  type: "salary" | "hourly" | "equity" | "range";
  currency: string; // USD, GBP, EUR, etc.
  amount?: number; // Single amount
  min?: number; // For ranges
  max?: number; // For ranges
  displayValue: string; // Original formatted string like "$160k - $190k"
}
