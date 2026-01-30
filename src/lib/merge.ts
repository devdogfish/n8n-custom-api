import { HARDCODED_DATA } from "./hardcodedData.js";
import { ResumeInputType } from "../generated/ResumeInputType.js";
import { MasterResume } from "../types/resume.js";

/**
 * Merges hardcoded data with AI-generated input to create a complete MasterResume.
 * Experience merged by ID - AI controls ordering and selection.
 * Projects merged by ID - AI controls ordering and selection.
 */
export function mergeResumeData(input: ResumeInputType): MasterResume {
  // Merge experience by ID - AI controls order via array position
  const experience: MasterResume["experience"] = input.experience.map(
    (aiExp) => {
      const hardcoded = HARDCODED_DATA.experience[aiExp.experienceId];

      if (!hardcoded) {
        throw new Error(
          `Unknown experience ID: "${
            aiExp.experienceId
          }". Valid IDs: ${Object.keys(HARDCODED_DATA.experience).join(", ")}`,
        );
      }

      return {
        experienceId: aiExp.experienceId,
        role: aiExp.role,
        institution: hardcoded.institution,
        location: hardcoded.location,
        dates: hardcoded.dates,
        bullets: aiExp.bullets,
      };
    },
  );

  // Merge projects by ID - AI controls order via array position
  const projects: MasterResume["projects"] = input.projects.map((aiProj) => {
    const hardcoded = HARDCODED_DATA.projects[aiProj.projectId];

    if (!hardcoded) {
      throw new Error(
        `Unknown project ID: "${aiProj.projectId}". Valid IDs: ${Object.keys(
          HARDCODED_DATA.projects,
        ).join(", ")}`,
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
