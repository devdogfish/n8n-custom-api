// Main report interface
interface DailyApplicationReport {
  metadata: ReportMetadata;
  featuredApplications: FeaturedApplications;
  otherApplications: Application[];
}

// Report metadata (header information)
interface ReportMetadata {
  issueNumber: number;
  date: string; // ISO date string or Date
  totalApplications: number;
  highPriorityCount: number;
  averageSalary: string; // e.g., "$145K"
}

// Featured applications with priority hierarchy
interface FeaturedApplications {
  main?: Application; // Top priority - optional if no applications
  secondary: Application[]; // Can have 0-n secondary featured apps
}

// Core application data structure
interface Application {
  position: string;
  company: string;
  location: string;
  locationType?: "Remote" | "Hybrid" | "On-site"; // Can be derived from location
  compensation: Compensation;
  matchPercentage?: number; // Optional, 0-100
  matchLevel?: "high" | "medium" | "low"; // For styling
  description: string;
  tags?: string[]; // For categorization
  status?: string; // e.g., "Cover letter drafted", "Applied", etc.
  whyItFits?: string; // Reasoning for priority applications
  priority: "featured-main" | "featured-side" | "standard";
  href: string; // Link to job posting
  resumeId: string; // ID of resume used/to use for this application
}

// Compensation can be salary, hourly, or range
interface Compensation {
  type: "salary" | "hourly" | "equity" | "range";
  currency: string; // USD, GBP, EUR, etc.
  amount?: number; // Single amount
  min?: number; // For ranges
  max?: number; // For ranges
  displayValue: string; // Original formatted string like "$160k - $190k"
}

// Example usage with the data from your document:
const exampleReport: DailyApplicationReport = {
  metadata: {
    issueNumber: 1,
    date: "2026-01-29",
    totalApplications: 8,
    highPriorityCount: 3,
    averageSalary: "$145K",
  },
  featuredApplications: {
    main: {
      position: "Senior Creative Developer",
      company: "Starlight Studios",
      location: "San Francisco (Remote)",
      compensation: {
        type: "range",
        currency: "USD",
        min: 160000,
        max: 190000,
        displayValue: "$160k - $190k",
      },
      matchPercentage: 95,
      matchLevel: "high",
      description:
        "Ideally seeking a specialist in WebGL and React. The role involves building immersive marketing experiences for Tier-1 tech clients.",
      whyItFits:
        "Perfect alignment with scroll-driven animation portfolio and recent Three.js experiments.",
      status: "Cover letter drafted.",
      priority: "featured-main",
      href: "https://jobs.starlightstudios.com/senior-creative-dev",
      resumeId: "resume_creative_2026_v3",
    },
    secondary: [
      {
        position: "Full Stack Engineer",
        company: "FinTech Corp",
        location: "New York",
        compensation: {
          type: "salary",
          currency: "USD",
          amount: 150000,
          displayValue: "$150k",
        },
        matchPercentage: 90,
        matchLevel: "high",
        description:
          "Heavy focus on Node.js backend pipelines and real-time data visualization. Requires strong Python knowledge for legacy integrations.",
        priority: "featured-side",
        href: "https://fintechcorp.com/careers/fullstack-engineer",
        resumeId: "resume_fullstack_2026_v2",
      },
    ],
  },
  otherApplications: [
    {
      position: "React Developer",
      company: "Agency X",
      location: "Remote",
      compensation: {
        type: "salary",
        currency: "USD",
        amount: 120000,
        displayValue: "$120k",
      },
      description: "Standard e-commerce build.",
      priority: "standard",
      href: "https://agencyx.com/jobs/react-dev",
      resumeId: "resume_frontend_2026_v1",
    },
  ],
};
