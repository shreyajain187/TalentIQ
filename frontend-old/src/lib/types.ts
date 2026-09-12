// ── Data contracts (DO NOT CHANGE) ──────────────────────────────────────────
// These match the parser output shapes the backend team will produce.
// Everything downstream (adapter, UI) is built against these contracts so
// swapping the mock data source for a real FastAPI response is a one-file change.

export interface ParsedPage {
  page: number;
  text: string;
}

export interface ResumeParserOutput {
  id: string;
  filename: string;
  pages: ParsedPage[];
  fullText: string;
  sections: {
    skills: string;
    experience: string;
    education: string;
    projects: string;
  };
}

export interface JDParserOutput {
  id: string;
  filename: string;
  pages: ParsedPage[];
  fullText: string;
  sections: {
    requirements: string;
    responsibilities: string;
    skills: string;
    qualifications: string;
  };
}

// ── Ranking engine output (mocked — real engine built by teammates) ────────

export type SkillStatus = "EXACT" | "INFERRED" | "WEAK" | "MISSING";

export interface SkillEvidence {
  skill: string;
  status: SkillStatus;
  evidence: string;
  sourceSection: "skills" | "experience" | "projects" | "education";
}

export interface SubScores {
  semantic: number;
  required: number;
  preferred: number;
  experience: number;
}

export interface CandidateAnalysis {
  resumeId: string;
  name: string;
  title: string;
  location: string;
  yearsExperience: number;
  avatarColor: string;
  scores: SubScores;
  confidence: number;
  skills: SkillEvidence[];
  skillGaps: string[];
  interviewQuestions: string[];
}

// ── UI view model (adapter output — what components actually consume) ─────

export interface RankingWeights {
  semantic: number;
  required: number;
  preferred: number;
  experience: number;
}

export interface CandidateViewModel extends CandidateAnalysis {
  id: string;
  overallFit: number;
  rank: number;
}export interface BackendSkillMatch {
  skill: string;
  group: "required" | "preferred";
  status: "explicit" | "inferred" | "not_found";
  credit: number;
  observed_skill: string | null;
  relationship: string | null;
  evidence: string | null;
  page: number | null;
  alternatives?: string[];
}

export interface BackendRanking {
  candidate_id: string;
  filename: string;
  parse_status: string;

  dimension_scores: {
    semantic: number;
    experience: number;
    projects: number;
    required_skills: number;
    preferred_skills: number;
  };

  skill_matches: BackendSkillMatch[];

  missing_required_skills: string[];

  final_score: number;

  rank: number | null;
}

export interface BackendInterviewQuestion {
  category: string;
  skill: string;
  group: string;
  reason: string;
  question: string;
  evidence: string | null;
  page: number | null;
  follow_up: string;
}

export interface BackendInterviewPlan {
  candidate_id: string;
  status: string;
  message?: string;
  questions: BackendInterviewQuestion[];
}

export interface TalentIQBackendResult {
  job: any;
  resumes: any[];

  parse_summary: {
    successful: number;
    failed: number;
    total: number;
  };

  rankings: BackendRanking[];

  interview_plans: Record<
    string,
    BackendInterviewPlan
  >;

  explanations: any;

  top_three: any[];

  unranked: any[];
}

export interface JDInsights {
  qualityScore: number;

  requiredSkills: string[];
  preferredSkills: string[];

  sectionsDetected: string[];

  checks: {
    requirements: boolean;
    responsibilities: boolean;
    skills: boolean;
    education: boolean;
    experience: boolean;
  };

  stats: {
    requiredSkillCount: number;
    preferredSkillCount: number;
    sectionCount: number;
    pageCount: number;
  };

  filename: string;
}