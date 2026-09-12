import type { ResumeParserOutput } from "@/lib/types";
import { mockAnalyses } from "./analysis";

// Raw resume-parser-shaped output, derived from the same mock candidates so
// there is one source of truth for names/evidence. A real parser service
// would produce this same shape from an uploaded PDF/DOCX.
export const mockResumes: ResumeParserOutput[] = mockAnalyses.map((c) => {
  const bySection = (section: "skills" | "experience" | "projects" | "education") =>
    c.skills
      .filter((s) => s.sourceSection === section && s.status !== "MISSING")
      .map((s) => s.evidence)
      .join(" ") || "Not specified.";

  const sections = {
    skills: bySection("skills") || c.skills.map((s) => s.skill).join(", "),
    experience: `${c.title} with ${c.yearsExperience} years of experience. ${bySection("experience")}`,
    education: bySection("education") || "B.A./B.S. — details not extracted.",
    projects: bySection("projects"),
  };

  const fullText = [c.name, c.title, c.location, sections.skills, sections.experience, sections.projects].join("\n");

  return {
    id: c.resumeId,
    filename: `${c.name.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`,
    pages: [{ page: 1, text: fullText }],
    fullText,
    sections,
  };
});
