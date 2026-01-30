export interface MasterResume {
  name: string;
  contact: string;
  summary: string;
  skills: Array<{
    label: string; // e.g., "Languages", "Frameworks", "Tools"
    value: string; // e.g., "TypeScript, JavaScript, Python"
  }>;
  experience: Array<{
    experienceId:
      | "apollotec"
      | "etpzp"
      | "hope-media-house"
      | "youngdriversacademy";
    role: string; // AI-generated, will be bold
    institution: string; // Hardcoded, not bold
    location: string; // Hardcoded, not bold
    dates: string; // Hardcoded, not bold
    bullets: string[]; // AI-generated
  }>;
  projects: Array<{
    projectId: "yda-crm" | "sitings" | "etpzp-sms" | "workouts-tracker";
    title: string; // Hardcoded, will be bold
    subtitle: string; // Hardcoded, will be italic
    dates: string; // Hardcoded, will be bold
    link: string | null; // Hardcoded, optional
    bullets: string[]; // AI-generated
  }>;
  education: {
    university: string;
    degree: string;
    coursework: string;
    expectedGrad: string;
    cumulativeGPA: string;
  };
}

// Legacy alias for backward compatibility
export type ResumeData = MasterResume;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
