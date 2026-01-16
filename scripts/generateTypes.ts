/**
 * Script to generate ResumeInputType type based on hardcoded data.
 * Run this whenever you modify hardcodedData.ts to regenerate the AI input type.
 *
 * Usage: node --loader ts-node/esm generateTypes.ts
 */

import { HARDCODED_DATA } from "../src/lib/hardcodedData.js";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

function generateResumeInputType() {
  // Get experience IDs and institutions for documentation
  const experienceIds = Object.keys(HARDCODED_DATA.experience);
  const experienceList = experienceIds
    .map((id) => {
      const exp =
        HARDCODED_DATA.experience[id as keyof typeof HARDCODED_DATA.experience];
      return `  //   "${id}": ${exp.institution}`;
    })
    .join("\n");

  const experienceIdUnion = experienceIds.map((id) => `"${id}"`).join(" | ");

  // Get project IDs and titles for documentation
  const projectIds = Object.keys(HARDCODED_DATA.projects);
  const projectList = projectIds
    .map((id) => {
      const proj =
        HARDCODED_DATA.projects[id as keyof typeof HARDCODED_DATA.projects];
      return `  //   "${id}": ${proj.title}`;
    })
    .join("\n");

  const projectIdUnion = projectIds.map((id) => `"${id}"`).join(" | ");

  const typeDefinition = `/**
 * Resume generation input schema
 * Experience: Select and order experiences by ID (AI controls which and in what order)
 * Projects: Select and order projects by ID (AI controls which and in what order)
 */

/** Valid experience IDs - reference these when selecting experiences */
export type ExperienceId = ${experienceIdUnion};

/**
 * Available experiences:
${experienceList}
 */

/** Valid project IDs - reference these when selecting projects */
export type ProjectId = ${projectIdUnion};

/**
 * Available projects:
${projectList}
 */
export interface ResumeInputType {
  /** true = internship email, false = job email */
  isInternship: boolean;

  /** Professional summary (2-4 sentences) */
  summary: string;

  /** Skills array with flexible categories (e.g., Languages, Frameworks, Tools) */
  skills: Array<{
    label: string;
    value: string;
  }>;

  /**
   * Experiences to include in resume - AI selects which and controls ordering.
   * Array order determines resume order. Can include 1-${experienceIds.length} experiences.
   * Use ExperienceId type for experienceId field.
   */
  experience: Array<{
    experienceId: ExperienceId;
    role: string;
    bullets: string[];
  }>;

  /**
   * Projects to include in resume - AI selects which and controls ordering.
   * Array order determines resume order. Can include 1-${projectIds.length} projects.
   * Use ProjectId type for projectId field.
   */
  projects: Array<{
    projectId: ProjectId;
    bullets: string[];
  }>;
}
`;

  return typeDefinition;
}

// Generate and write the type definition
const generatedTypes = generateResumeInputType();
const outputPath = "src/generated/ResumeInputType.ts";

// Ensure output directory exists
await mkdir(dirname(outputPath), { recursive: true });

await writeFile(outputPath, generatedTypes, "utf-8");

console.log(`✓ Generated ${outputPath}`);
console.log(
  `  - ${
    Object.keys(HARDCODED_DATA.experience).length
  } available experiences (ID-matched, AI-ordered)`
);
console.log(
  `  - ${
    Object.keys(HARDCODED_DATA.projects).length
  } available projects (ID-matched, AI-ordered)`
);
