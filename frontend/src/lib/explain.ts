import type { CandidateViewModel } from "@/lib/types";

// Generates "why A ranks above B" bullets purely from already-computed
// sub-scores/evidence. Only returns points that actually favor `a` — this
// is called with `a` as the top-ranked candidate in a pair.
export function explainRanking(a: CandidateViewModel, b: CandidateViewModel): string[] {
  const bullets: string[] = [];

  const semDelta = a.scores.semantic - b.scores.semantic;
  if (semDelta >= 2) bullets.push(`Stronger semantic alignment by ${semDelta} points`);

  const reqDelta = a.scores.required - b.scores.required;
  if (reqDelta >= 2) bullets.push("More required skills verified exactly");

  const prefDelta = a.scores.preferred - b.scores.preferred;
  if (prefDelta >= 2) bullets.push("Broader preferred-skill coverage");

  const expDelta = a.scores.experience - b.scores.experience;
  if (expDelta >= 5) bullets.push("Better experience-level fit");

  const exactA = a.skills.filter((s) => s.status === "EXACT").length;
  const exactB = b.skills.filter((s) => s.status === "EXACT").length;
  if (exactA > exactB) bullets.push(`${exactA} exact-match skills vs. ${exactB}`);

  if (a.confidence >= b.confidence) bullets.push(`${a.confidence}% evidence confidence vs. ${b.confidence}%`);

  if (bullets.length === 0) bullets.push(`Marginally ahead overall (${a.overallFit} vs. ${b.overallFit})`);

  return bullets;
}
