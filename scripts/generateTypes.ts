/**
 * Script to generate ResumeInput type based on hardcoded data.
 * Run this whenever you modify hardcodedData.ts to regenerate the AI input type.
 *
 * Usage: node --loader ts-node/esm generateTypes.ts
 */

import { HARDCODED_DATA } from "../src/lib/hardcodedData.js";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

function generateResumeInputType() {
  const experienceCount = HARDCODED_DATA.experience.length;

  const experienceLabels = HARDCODED_DATA.experience
    .map((exp) => exp.institution.split(" ")[0])
    .join(", ");

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
 * Experience: MUST have exactly ${experienceCount} entries (index-matched)
 * Projects: Select and order projects by ID (AI controls which and in what order)
 */

/** Valid project IDs - reference these when selecting projects */
export type ProjectId = ${projectIdUnion};

/**
 * Available projects:
${projectList}
 */
export interface ResumeInput {
  /** true = internship email, false = job email */
  isInternship: boolean;

  /** Professional summary (2-4 sentences) */
  summary: string;

  /** Skills array with flexible categories (e.g., Languages, Frameworks, Tools) */
  skills: Array<{
    label: string;
    value: string;
  }>;

  /** MUST be exactly ${experienceCount} entries, matched by index to: ${experienceLabels} */
  experience: [
${HARDCODED_DATA.experience
  .map(
    (exp, i) =>
      `    { role: string; bullets: string[] }${
        i < experienceCount - 1 ? "," : ""
      }`
  )
  .join("\n")}
  ];

  /**
   * Projects to include in resume - AI selects which and controls ordering.
   * Array order determines resume order. Can include 1-${
     projectIds.length
   } projects.
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
const outputPath = "src/generated/ResumeInput.ts";

// Ensure output directory exists
await mkdir(dirname(outputPath), { recursive: true });

await writeFile(outputPath, generatedTypes, "utf-8");

console.log(`✓ Generated ${outputPath}`);
console.log(
  `  - ${HARDCODED_DATA.experience.length} experience entries (index-matched)`
);
console.log(
  `  - ${
    Object.keys(HARDCODED_DATA.projects).length
  } available projects (ID-matched, AI-ordered)`
);
