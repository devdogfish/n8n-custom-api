/**
 * Hardcoded resume data that should NOT be modified by AI.
 * This defines the structure and fixed values that the AI will fill around.
 */
export const HARDCODED_DATA = {
  name: "Luigi Girke",

  // Contact information - selected based on isInternship flag from AI
  contact: {
    internship:
      "6385 South St., Halifax | +1 (902) 943-0714 | internship@luigigirke.com | https://luigigirke.com",
    job: "6385 South St., Halifax | +1 (902) 943-0714 | luigigirke@gmail.com | https://luigigirke.com",
  },

  // Experience entries - AI selects which to include, controls order, and fills role and bullets
  // Each experience has a unique ID that AI references
  experience: {
    apollotec: {
      institution: "Apollotec.pt",
      location: "Coimbra, Portugal",
      dates: "Summer 2025",
    },
    etpzp: {
      institution: "ETPZP",
      location: "Leiria, Portugal",
      dates: "2024 - 2025",
    },
    "hope-media-house": {
      institution: "Hope Media House",
      location: "Vancouver, BC, Canada",
      dates: "Summer 2024",
    },
  },

  // Project entries - AI selects which to include, controls order, and fills bullets
  // Each project has a unique ID that AI references
  projects: {
    "yda-crm": {
      title: "CRM for Young Drivers Academy",
      subtitle: "Customer Management & Go-Kart Booking System",
      dates: "2025",
      link: null, // For now I don't have sufficient documentation about this project on my website, so I don't want the employer to look at this
    },
    "etpzp-sms": {
      title: "ETPZP SMS System",
      subtitle: "Flash SMS Application for Portuguese High School Staff",
      dates: "2024 - 2025",
      link: "https://etpzp-sms-three.vercel.app/en",
    },
    sitings: {
      title: "Sitings.ca",
      subtitle: "Real Estate Viewing Platform",
      dates: "2024",
      link: "https://sitings.ca/property/?available=true",
    },
    "workouts-tracker": {
      title: "Personal Workouts Tracker",
      subtitle: "Fitness Logging with Google Sheets Backend",
      dates: "2025",
      link: "https://luigigirke.com/project/workouts-tracker",
    },
  },

  education: {
    university: "Dalhousie University, Halifax, Canada",
    degree: "Bachelor of Computer Science",
    coursework:
      "Data Structures, Calculus, Java Programming, Web Development, Data Science in Python, Computer Systems",
    expectedGrad: "Expected Graduation: 2029",
    cumulativeGPA: "GPA: 4.24/4.3",
  },
} as const;
