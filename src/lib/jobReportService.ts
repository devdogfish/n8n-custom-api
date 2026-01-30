import type {
  DailyApplicationReport,
  HeatmapCalendarResponse,
} from "../types/auth.js";

/**
 * Get the daily job application report.
 * TODO: Replace with Google Sheets integration
 */
export async function getDailyReport(): Promise<DailyApplicationReport> {
  // Placeholder data - replace with Google Sheets API call
  return {
    metadata: {
      issueNumber: 1,
      date: new Date().toISOString().split("T")[0],
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
}

/**
 * Get heatmap calendar data for all job applications.
 * TODO: Replace with Google Sheets integration
 */
export async function getHeatmapData(): Promise<HeatmapCalendarResponse> {
  // Placeholder data - replace with Google Sheets API call
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 3);

  const data = [];
  let totalApplications = 0;

  // Generate placeholder data for the last 3 months
  const current = new Date(startDate);
  while (current <= today) {
    // Random count between 0-5 for demo purposes
    const count = Math.floor(Math.random() * 6);
    if (count > 0) {
      data.push({
        date: current.toISOString().split("T")[0],
        count,
      });
      totalApplications += count;
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    data,
    startDate: startDate.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    totalApplications,
  };
}
