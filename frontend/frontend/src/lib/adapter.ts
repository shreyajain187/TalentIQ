import type {
  TalentIQBackendResult,
  BackendRanking,
  CandidateAnalysis,
  SkillEvidence,
  SkillStatus,
  JDInsights,
} from "@/lib/types";


const ANALYSIS_KEY =
  "talentiq:analysis";


export function getBackendResult():
  TalentIQBackendResult | null {

  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    localStorage.getItem(
      ANALYSIS_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


function statusToUI(
  status: string
): SkillStatus {

  if (status === "explicit") {
    return "EXACT";
  }

  if (status === "inferred") {
    return "INFERRED";
  }

  if (status === "not_found") {
    return "MISSING";
  }

  return "WEAK";
}


function rankingToAnalysis(
  ranking: BackendRanking,
  result: TalentIQBackendResult
): CandidateAnalysis {

  const interviewPlan =
    result.interview_plans[
      ranking.candidate_id
    ];

  const skills: SkillEvidence[] =
    ranking.skill_matches.map(
      (match) => ({
        skill: match.skill,

        status: statusToUI(
          match.status
        ),

        evidence:
          match.evidence ??
          "No supporting evidence found.",

        sourceSection:
          "skills",
      })
    );

  return {
    resumeId:
      ranking.candidate_id,

    // For now use filename.
    // We can extract candidate name separately later.
    name:
      ranking.filename
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ")
        .replace(/^resume\s+\d+\s*/i, "")
        .trim(),

    title:
      "Candidate",

    location:
      "Not provided",

    yearsExperience:
      0,

    avatarColor:
      "bg-indigo-500",

    scores: {
      semantic:
        ranking.dimension_scores.semantic,

      required:
        ranking.dimension_scores.required_skills,

      preferred:
        ranking.dimension_scores.preferred_skills,

      experience:
        ranking.dimension_scores.experience,
    },

    confidence:
      ranking.final_score,

    skills,

    skillGaps:
      ranking.missing_required_skills,

    interviewQuestions:
      interviewPlan?.questions.map(
        (q) => q.question
      ) ?? [],
  };
}


export async function
getCandidateAnalyses():
Promise<CandidateAnalysis[]> {

  const result =
    getBackendResult();

  if (!result) {
    return [];
  }

  return result.rankings.map(
    (ranking) =>
      rankingToAnalysis(
        ranking,
        result
      )
  );
}


export async function
getJobDescription() {

  return (
    getBackendResult()?.job ??
    null
  );
}


export async function
getRequiredAndPreferredSkills() {

  const result =
    getBackendResult();

  if (!result) {
    return {
      required: [],
      preferred: [],
    };
  }

  const required =
    new Set<string>();

  const preferred =
    new Set<string>();

  for (
    const ranking
    of result.rankings
  ) {

    for (
      const skill
      of ranking.skill_matches
    ) {

      if (
        skill.group === "required"
      ) {
        required.add(skill.skill);
      }

      if (
        skill.group === "preferred"
      ) {
        preferred.add(skill.skill);
      }
    }
  }

  return {
    required:
      Array.from(required),

    preferred:
      Array.from(preferred),
  };
}


export async function getJDInsights(): Promise<JDInsights | null> {
  const result = getBackendResult();

  if (!result) {
    return null;
  }

  const job = result.job;

  // -----------------------------------------
  // Collect required/preferred skills
  // from Person 2's actual matching criteria
  // -----------------------------------------

  const required = new Set<string>();
  const preferred = new Set<string>();

  for (const ranking of result.rankings ?? []) {
    for (const match of ranking.skill_matches ?? []) {
      if (match.group === "required") {
        required.add(match.skill);
      }

      if (match.group === "preferred") {
        preferred.add(match.skill);
      }
    }
  }

  // -----------------------------------------
  // Inspect sections produced by Person 1
  // -----------------------------------------

  const sections = job?.sections ?? {};

  const sectionNames = Object.keys(sections).map(
    (name) => name.toLowerCase()
  );

  const hasRequirements =
    sectionNames.includes("requirements");

  const hasResponsibilities =
    sectionNames.includes("responsibilities");

  const hasSkills =
    sectionNames.includes("skills");

  const hasEducation =
    sectionNames.includes("education");

  const hasExperience =
    sectionNames.includes("experience");

  // -----------------------------------------
  // Simple deterministic quality calculation
  // -----------------------------------------

  const checks = [
    hasRequirements,
    hasResponsibilities,
    required.size > 0,
    preferred.size > 0,
    Boolean(job?.full_text || job?.fullText),
  ];

  const passedChecks =
    checks.filter(Boolean).length;

  const qualityScore = Math.round(
    (passedChecks / checks.length) * 100
  );

  return {
    qualityScore,

    requiredSkills:
      Array.from(required),

    preferredSkills:
      Array.from(preferred),

    sectionsDetected:
      sectionNames,

    checks: {
      requirements:
        hasRequirements,

      responsibilities:
        hasResponsibilities,

      skills:
        hasSkills,

      education:
        hasEducation,

      experience:
        hasExperience,
    },

    stats: {
      requiredSkillCount:
        required.size,

      preferredSkillCount:
        preferred.size,

      sectionCount:
        sectionNames.length,

      pageCount:
        job?.pages?.length ?? 0,
    },

    filename:
      job?.filename ?? "Job description",
  };
}