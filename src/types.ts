// Master Resume type - includes ALL fields (hardcoded + AI-generated)
export interface Resume {
  name: string;
  contact: string;
  summary: string;
  skills: Array<{
    label: string; // e.g., "Languages", "Frameworks", "Tools"
    value: string; // e.g., "TypeScript, JavaScript, Python"
  }>;
  experience: Array<{
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
    link: string; // Hardcoded
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
export type ResumeData = Resume;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateResumeData(data: any): ValidationResult {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid data: must be an object"] };
  }

  // Validate required string fields
  const requiredStringFields = ["name", "contact", "summary"];
  for (const field of requiredStringFields) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      errors.push(
        `Missing or invalid field: ${field} (must be a non-empty string)`
      );
    }
  }

  // Validate skills array
  if (!Array.isArray(data.skills)) {
    errors.push("Missing or invalid field: skills (must be an array)");
  } else if (data.skills.length === 0) {
    errors.push("Invalid skills array (must have at least one skill category)");
  } else {
    data.skills.forEach((skill: any, index: number) => {
      if (!skill || typeof skill !== "object") {
        errors.push(`Invalid skill item at index ${index}`);
        return;
      }
      if (typeof skill.label !== "string" || skill.label.trim() === "") {
        errors.push(
          `Invalid skills[${index}].label (must be a non-empty string)`
        );
      }
      if (typeof skill.value !== "string" || skill.value.trim() === "") {
        errors.push(
          `Invalid skills[${index}].value (must be a non-empty string)`
        );
      }
    });
  }

  // Validate experience array
  if (!Array.isArray(data.experience)) {
    errors.push("Missing or invalid field: experience (must be an array)");
  } else {
    data.experience.forEach((exp: any, index: number) => {
      if (!exp || typeof exp !== "object") {
        errors.push(`Invalid experience item at index ${index}`);
        return;
      }
      if (typeof exp.role !== "string" || exp.role.trim() === "") {
        errors.push(
          `Invalid experience[${index}].role (must be a non-empty string)`
        );
      }
      if (
        typeof exp.institution !== "string" ||
        exp.institution.trim() === ""
      ) {
        errors.push(
          `Invalid experience[${index}].institution (must be a non-empty string)`
        );
      }
      if (typeof exp.location !== "string" || exp.location.trim() === "") {
        errors.push(
          `Invalid experience[${index}].location (must be a non-empty string)`
        );
      }
      if (typeof exp.dates !== "string" || exp.dates.trim() === "") {
        errors.push(
          `Invalid experience[${index}].dates (must be a non-empty string)`
        );
      }
      if (!Array.isArray(exp.bullets)) {
        errors.push(`Invalid experience[${index}].bullets (must be an array)`);
      } else if (exp.bullets.length === 0) {
        errors.push(
          `Invalid experience[${index}].bullets (must have at least one bullet)`
        );
      } else {
        exp.bullets.forEach((bullet: any, bIndex: number) => {
          if (typeof bullet !== "string" || bullet.trim() === "") {
            errors.push(
              `Invalid experience[${index}].bullets[${bIndex}] (must be a non-empty string)`
            );
          }
        });
      }
    });
  }

  // Validate projects array
  if (!Array.isArray(data.projects)) {
    errors.push("Missing or invalid field: projects (must be an array)");
  } else {
    data.projects.forEach((proj: any, index: number) => {
      if (!proj || typeof proj !== "object") {
        errors.push(`Invalid project item at index ${index}`);
        return;
      }
      if (typeof proj.title !== "string" || proj.title.trim() === "") {
        errors.push(
          `Invalid projects[${index}].title (must be a non-empty string)`
        );
      }
      if (typeof proj.subtitle !== "string" || proj.subtitle.trim() === "") {
        errors.push(
          `Invalid projects[${index}].subtitle (must be a non-empty string)`
        );
      }
      if (typeof proj.dates !== "string" || proj.dates.trim() === "") {
        errors.push(
          `Invalid projects[${index}].dates (must be a non-empty string)`
        );
      }
      if (typeof proj.link !== "string" || proj.link.trim() === "") {
        errors.push(
          `Invalid projects[${index}].link (must be a non-empty string)`
        );
      }
      if (!Array.isArray(proj.bullets)) {
        errors.push(`Invalid projects[${index}].bullets (must be an array)`);
      } else if (proj.bullets.length === 0) {
        errors.push(
          `Invalid projects[${index}].bullets (must have at least one bullet)`
        );
      } else {
        proj.bullets.forEach((bullet: any, bIndex: number) => {
          if (typeof bullet !== "string" || bullet.trim() === "") {
            errors.push(
              `Invalid projects[${index}].bullets[${bIndex}] (must be a non-empty string)`
            );
          }
        });
      }
    });
  }

  // Validate education object
  if (!data.education || typeof data.education !== "object") {
    errors.push("Missing or invalid field: education (must be an object)");
  } else {
    const eduRequiredFields = [
      "university",
      "degree",
      "coursework",
      "expectedGrad",
      "cumulativeGPA",
    ];
    for (const field of eduRequiredFields) {
      if (
        typeof data.education[field] !== "string" ||
        data.education[field].trim() === ""
      ) {
        errors.push(
          `Missing or invalid field: education.${field} (must be a non-empty string)`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
