import type { JDParserOutput } from "@/lib/types";

// Raw output shape a JD parser service would return. Kept close to real
// text so the UI's "view job description" panel has something honest to show.
export const mockJD: JDParserOutput = {
  id: "job_01",
  filename: "senior_product_designer_jd.pdf",
  pages: [
    {
      page: 1,
      text: `Senior Product Designer — Nexora
We're looking for a Senior Product Designer to own end-to-end design for our
core product surfaces, from discovery through shipped UI. You'll partner
closely with engineering and research, and are comfortable enough with the
technical stack to prototype against real APIs.

Requirements:
- 4+ years designing production SaaS products
- Expert in Figma, including component libraries and design systems
- Strong prototyping skills (interactive, high-fidelity)
- Experience running and synthesizing user research
- Working knowledge of Node.js backend concepts to collaborate on API-driven prototypes

Preferred:
- Experience with design systems at scale
- Familiarity with React for shipping production-quality prototypes
- Background in growth or B2B SaaS
- Experience mentoring junior designers

Responsibilities:
- Lead design for 1-2 product areas end to end
- Partner with PM and engineering from discovery to launch
- Maintain and extend the shared design system
- Run user research and translate findings into iterations`,
    },
  ],
  fullText: "",
  sections: {
    requirements:
      "4+ years designing production SaaS products. Expert in Figma, including component libraries and design systems. Strong prototyping skills. Experience running and synthesizing user research. Working knowledge of Node.js backend concepts to collaborate on API-driven prototypes.",
    responsibilities:
      "Lead design for 1-2 product areas end to end. Partner with PM and engineering from discovery to launch. Maintain and extend the shared design system. Run user research and translate findings into iterations.",
    skills:
      "Figma, Design systems, Prototyping, User research, Node.js, React, Cross-functional collaboration",
    qualifications:
      "4+ years product design experience, portfolio of shipped SaaS products, growth or B2B background preferred.",
  },
};
mockJD.fullText = mockJD.pages.map((p) => p.text).join("\n\n");

export const requiredSkills = [
  "Figma",
  "Design systems",
  "Prototyping",
  "User research",
  "Node.js",
];
export const preferredSkills = ["React", "Growth/B2B SaaS", "Mentoring", "Design systems at scale"];

export const jdInsights = {
  qualityScore: 78,
  clarityScore: 84,
  inclusivityScore: 71,
  flags: [
    {
      severity: "warning" as const,
      label: "Possible experience-level exclusion",
      detail:
        "\"4+ years\" combined with \"Expert in Figma\" may discourage strong senior candidates from adjacent titles (e.g. UX Engineer) from applying.",
    },
    {
      severity: "warning" as const,
      label: "Vague technical bar",
      detail:
        "\"Working knowledge of Node.js\" is not measurable — candidates and the matching engine both have to guess what threshold counts. Consider naming a concrete expectation (e.g. \"can read/modify an existing Express endpoint\").",
    },
    {
      severity: "info" as const,
      label: "No location or salary disclosed",
      detail:
        "Listings with visible compensation ranges see meaningfully higher application completion rates.",
    },
    {
      severity: "good" as const,
      label: "Balanced requirement count",
      detail: "5 required + 4 preferred skills is in the sweet spot — enough signal without over-filtering.",
    },
  ],
  suggestedRewrites: [
    {
      original: "Expert in Figma, including component libraries and design systems",
      suggested:
        "Proficient in Figma (component libraries, auto-layout, design systems) — \"expert\" reads as a higher bar than the role likely needs",
    },
    {
      original: "Working knowledge of Node.js backend concepts",
      suggested:
        "Comfortable reading Express/Node.js route handlers well enough to prototype against a real API",
    },
  ],
};
