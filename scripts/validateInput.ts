/**
 * Script to validate a JSON file against the ResumeInputType schema.
 *
 * Usage: npm run validate-input <path-to-json-file>
 * Example: npm run validate-input src/cache/input.example.json
 */

import { readFile } from "fs/promises";
import { HARDCODED_DATA } from "../src/lib/hardcodedData.js";
import type { ResumeInputType, ExperienceId, ProjectId } from "../src/generated/ResumeInputType.js";

// Get valid IDs from hardcoded data
const VALID_EXPERIENCE_IDS = Object.keys(HARDCODED_DATA.experience) as ExperienceId[];
const VALID_PROJECT_IDS = Object.keys(HARDCODED_DATA.projects) as ProjectId[];

interface ValidationError {
  path: string;
  message: string;
}

class Validator {
  private errors: ValidationError[] = [];

  addError(path: string, message: string): void {
    this.errors.push({ path, message });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  validateString(value: unknown, path: string, fieldName: string): value is string {
    if (typeof value !== "string") {
      this.addError(path, `${fieldName} must be a string, got ${typeof value}`);
      return false;
    }
    if (value.trim().length === 0) {
      this.addError(path, `${fieldName} cannot be empty`);
      return false;
    }
    return true;
  }

  validateBoolean(value: unknown, path: string, fieldName: string): value is boolean {
    if (typeof value !== "boolean") {
      this.addError(path, `${fieldName} must be a boolean, got ${typeof value}`);
      return false;
    }
    return true;
  }

  validateArray(value: unknown, path: string, fieldName: string): value is unknown[] {
    if (!Array.isArray(value)) {
      this.addError(path, `${fieldName} must be an array, got ${typeof value}`);
      return false;
    }
    return true;
  }

  validateSkills(skills: unknown, path: string): void {
    if (!this.validateArray(skills, path, "skills")) return;

    if (skills.length === 0) {
      this.addError(path, "skills array cannot be empty");
      return;
    }

    skills.forEach((skill, index) => {
      const skillPath = `${path}[${index}]`;

      if (typeof skill !== "object" || skill === null) {
        this.addError(skillPath, "each skill must be an object");
        return;
      }

      const skillObj = skill as Record<string, unknown>;

      this.validateString(skillObj.label, `${skillPath}.label`, "label");
      this.validateString(skillObj.value, `${skillPath}.value`, "value");
    });
  }

  validateExperience(experience: unknown, path: string): void {
    if (!this.validateArray(experience, path, "experience")) return;

    if (experience.length === 0) {
      this.addError(path, "experience array cannot be empty");
      return;
    }

    if (experience.length > VALID_EXPERIENCE_IDS.length) {
      this.addError(path, `experience array cannot have more than ${VALID_EXPERIENCE_IDS.length} items`);
    }

    const seenIds = new Set<string>();

    experience.forEach((exp, index) => {
      const expPath = `${path}[${index}]`;

      if (typeof exp !== "object" || exp === null) {
        this.addError(expPath, "each experience must be an object");
        return;
      }

      const expObj = exp as Record<string, unknown>;

      // Validate experienceId
      if (!this.validateString(expObj.experienceId, `${expPath}.experienceId`, "experienceId")) {
        return;
      }

      const expId = expObj.experienceId as string;

      if (!VALID_EXPERIENCE_IDS.includes(expId as ExperienceId)) {
        this.addError(
          `${expPath}.experienceId`,
          `invalid experience ID "${expId}". Valid IDs: ${VALID_EXPERIENCE_IDS.join(", ")}`
        );
      }

      if (seenIds.has(expId)) {
        this.addError(`${expPath}.experienceId`, `duplicate experience ID "${expId}"`);
      }
      seenIds.add(expId);

      // Validate role
      this.validateString(expObj.role, `${expPath}.role`, "role");

      // Validate bullets
      if (!this.validateArray(expObj.bullets, `${expPath}.bullets`, "bullets")) {
        return;
      }

      const bullets = expObj.bullets as unknown[];

      if (bullets.length === 0) {
        this.addError(`${expPath}.bullets`, "bullets array cannot be empty");
      }

      bullets.forEach((bullet, bulletIndex) => {
        this.validateString(bullet, `${expPath}.bullets[${bulletIndex}]`, "bullet");
      });
    });
  }

  validateProjects(projects: unknown, path: string): void {
    if (!this.validateArray(projects, path, "projects")) return;

    if (projects.length === 0) {
      this.addError(path, "projects array cannot be empty");
      return;
    }

    if (projects.length > VALID_PROJECT_IDS.length) {
      this.addError(path, `projects array cannot have more than ${VALID_PROJECT_IDS.length} items`);
    }

    const seenIds = new Set<string>();

    projects.forEach((proj, index) => {
      const projPath = `${path}[${index}]`;

      if (typeof proj !== "object" || proj === null) {
        this.addError(projPath, "each project must be an object");
        return;
      }

      const projObj = proj as Record<string, unknown>;

      // Validate projectId
      if (!this.validateString(projObj.projectId, `${projPath}.projectId`, "projectId")) {
        return;
      }

      const projId = projObj.projectId as string;

      if (!VALID_PROJECT_IDS.includes(projId as ProjectId)) {
        this.addError(
          `${projPath}.projectId`,
          `invalid project ID "${projId}". Valid IDs: ${VALID_PROJECT_IDS.join(", ")}`
        );
      }

      if (seenIds.has(projId)) {
        this.addError(`${projPath}.projectId`, `duplicate project ID "${projId}"`);
      }
      seenIds.add(projId);

      // Validate bullets
      if (!this.validateArray(projObj.bullets, `${projPath}.bullets`, "bullets")) {
        return;
      }

      const bullets = projObj.bullets as unknown[];

      if (bullets.length === 0) {
        this.addError(`${projPath}.bullets`, "bullets array cannot be empty");
      }

      bullets.forEach((bullet, bulletIndex) => {
        this.validateString(bullet, `${projPath}.bullets[${bulletIndex}]`, "bullet");
      });
    });
  }

  validateResumeInput(data: unknown): data is ResumeInputType {
    if (typeof data !== "object" || data === null) {
      this.addError("root", "input must be an object");
      return false;
    }

    const input = data as Record<string, unknown>;

    // Validate required fields
    this.validateBoolean(input.isInternship, "isInternship", "isInternship");
    this.validateString(input.summary, "summary", "summary");
    this.validateSkills(input.skills, "skills");
    this.validateExperience(input.experience, "experience");
    this.validateProjects(input.projects, "projects");

    return !this.hasErrors();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ Error: No file path provided");
    console.error("\nUsage: npm run validate-input <path-to-json-file>");
    console.error("Example: npm run validate-input src/cache/input.example.json");
    process.exit(1);
  }

  const filePath = args[0];

  try {
    // Read the JSON file
    const fileContent = await readFile(filePath, "utf-8");

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:");
      console.error((parseError as Error).message);
      process.exit(1);
    }

    // Validate against schema
    const validator = new Validator();
    const isValid = validator.validateResumeInput(data);

    if (isValid) {
      console.log("✓ Validation successful!");
      console.log(`\n${filePath} matches the ResumeInputType schema.`);

      const input = data as ResumeInputType;
      console.log(`\nSummary:`);
      console.log(`  - Contact mode: ${input.isInternship ? "internship" : "job"}`);
      console.log(`  - Skills categories: ${input.skills.length}`);
      console.log(`  - Experiences: ${input.experience.length} (${input.experience.map(e => e.experienceId).join(", ")})`);
      console.log(`  - Projects: ${input.projects.length} (${input.projects.map(p => p.projectId).join(", ")})`);

      process.exit(0);
    } else {
      console.error("❌ Validation failed!\n");
      console.error(`Found ${validator.getErrors().length} error(s):\n`);

      validator.getErrors().forEach(({ path, message }, index) => {
        console.error(`${index + 1}. [${path}] ${message}`);
      });

      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error reading file:");
    console.error((error as Error).message);
    process.exit(1);
  }
}

main();
