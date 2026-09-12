import type { CandidateAnalysis, RankingWeights, CandidateViewModel } from "@/lib/types";

export const defaultWeights: RankingWeights = {
  semantic: 35,
  required: 35,
  preferred: 20,
  experience: 10,
};

// Weighted average of the engine's sub-scores. Recruiter sliders only change
// emphasis (this client-side recalculation); they never touch how the
// sub-scores themselves were derived — that's the ranking engine's job.
export function computeOverallFit(scores: CandidateAnalysis["scores"], weights: RankingWeights): number {
  const total = weights.semantic + weights.required + weights.preferred + weights.experience;
  if (total <= 0) return 0;
  const weighted =
    scores.semantic * weights.semantic +
    scores.required * weights.required +
    scores.preferred * weights.preferred +
    scores.experience * weights.experience;
  return Math.round(weighted / total);
}

export function rankCandidates(
  analyses: CandidateAnalysis[],
  weights: RankingWeights
): CandidateViewModel[] {
  return analyses
    .map((a) => ({ ...a, id: a.resumeId, overallFit: computeOverallFit(a.scores, weights), rank: 0 }))
    .sort((a, b) => b.overallFit - a.overallFit)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
