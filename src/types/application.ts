// Core application data structure
export interface Application {
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
  };

  match: number; // 95 (percentage 0-100)
  date: string; // "2026-01-28" (ISO date for sorting)
  status: string; // "Drafted" or "Rejected" or "Interview pending"
  tags: string[]; // ["React", "WebGL", "Three.js"]
  eligible?: boolean; // true if sent=TRUE, false if sent=FALSE, undefined if sent is empty
  latitude?: number; // Geographic latitude coordinate
  longitude?: number; // Geographic longitude coordinate
}
