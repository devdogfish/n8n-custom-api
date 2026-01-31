export const SHEET_ID = process.env.SHEET_ID; // The ID is the long string after /d/

export const WEEK_DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const SHEET_NAMES = [
  "sets",
  "exercises",
  "schedule",
  "programs",
  "users",
  "body_metrics",
  "one_rep_maxes",
  "nutrition",
  "sleep",
  "applications",
] as const;

// Job applications sheet name (default tab)
export const JOB_APPLICATIONS_SHEET = "Index";

export const CHART_HEIGHT_CLASS = "h-[300px]";
