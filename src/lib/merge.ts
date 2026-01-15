import type { Resume } from "../types.js";
import { HARDCODED_DATA } from "./hardcodedData.js";
import { ResumeInput } from "../generated/ResumeInput.js";

/**
 * Merges hardcoded data with AI-generated input to create a complete Resume.
 * Experience merged by index - AI input must match hardcoded array length.
 * Projects merged by ID - AI controls ordering and selection.
 */
export function mergeResumeData(input: ResumeInput): Resume {
  // Validate experience array length matches
  if (input.experience.length !== HARDCODED_DATA.experience.length) {
    throw new Error(
      `Experience array length mismatch. Expected ${HARDCODED_DATA.experience.length}, got ${input.experience.length}`
    );
  }

  // Merge experience by index (unchanged)
  const experience: Resume["experience"] = input.experience.map(
    (aiExp, index) => {
      const hardcoded = HARDCODED_DATA.experience[index]!;
      return {
        role: aiExp.role,
        institution: hardcoded.institution,
        location: hardcoded.location,
        dates: hardcoded.dates,
        bullets: aiExp.bullets,
      };
    }
  );

  // Merge projects by ID - AI controls order via array position
  const projects: Resume["projects"] = input.projects.map((aiProj) => {
    const hardcoded = HARDCODED_DATA.projects[aiProj.projectId];

    if (!hardcoded) {
      throw new Error(
        `Unknown project ID: "${aiProj.projectId}". Valid IDs: ${Object.keys(
          HARDCODED_DATA.projects
        ).join(", ")}`
      );
    }

    return {
      projectId: aiProj.projectId,
      title: hardcoded.title,
      subtitle: hardcoded.subtitle,
      dates: hardcoded.dates,
      link: hardcoded.link,
      bullets: aiProj.bullets,
    };
  });

  // Select contact based on position type
  const contact = input.isInternship
    ? HARDCODED_DATA.contact.internship
    : HARDCODED_DATA.contact.job;

  return {
    name: HARDCODED_DATA.name,
    contact,
    summary: input.summary,
    skills: input.skills,
    experience,
    projects,
    education: HARDCODED_DATA.education,
  };
}
