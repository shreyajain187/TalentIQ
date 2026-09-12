"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CandidateAnalysis, CandidateViewModel, RankingWeights, JDParserOutput, JDInsights } from "@/lib/types";
import { getCandidateAnalyses, getJobDescription, getRequiredAndPreferredSkills, getJDInsights } from "@/lib/adapter";
import { defaultWeights } from "@/lib/scoring";

const WEIGHTS_KEY = "talentiq:weights";

interface CandidatesContextValue {
  loading: boolean;
  candidates: CandidateViewModel[];
  weights: RankingWeights;
  setWeights: (w: RankingWeights) => void;
  resetWeights: () => void;
  jd: JDParserOutput | null;
  requiredSkills: string[];
  preferredSkills: string[];
  jdInsights: JDInsights | null;
}

const CandidatesContext = createContext<CandidatesContextValue | null>(null);

export function CandidatesProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<CandidateAnalysis[]>([]);
  const [weights, setWeightsState] = useState<RankingWeights>(() => {
    if (typeof window === "undefined") return defaultWeights;
    try {
      const saved = localStorage.getItem(WEIGHTS_KEY);
      return saved ? JSON.parse(saved) : defaultWeights;
    } catch {
      return defaultWeights;
    }
  });
  const [jd, setJd] = useState<JDParserOutput | null>(null);
  const [required, setRequired] = useState<string[]>([]);
  const [preferred, setPreferred] = useState<string[]>([]);
  const [insights, setInsights] = useState<JDInsights | null>(null);

  useEffect(() => {
    // simulate a small network/processing delay so loading states are visible
    const timer = setTimeout(async () => {
      const [a, j, skills, ins] = await Promise.all([
        getCandidateAnalyses(),
        getJobDescription(),
        getRequiredAndPreferredSkills(),
        getJDInsights(),
      ]);
      setAnalyses(a);
      setJd(j);
      setRequired(skills.required);
      setPreferred(skills.preferred);
      setInsights(ins);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  function setWeights(w: RankingWeights) {
    setWeightsState(w);
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(w));
  }

  function resetWeights() {
    setWeights(defaultWeights);
  }

  const candidates =
  useMemo(() => {

    return analyses
      .map(
        (analysis, index) => ({
          ...analysis,

          id:
            analysis.resumeId,

          overallFit:
            analysis.confidence,

          rank:
            index + 1,
        })
      );

  }, [analyses]);
  return (
    <CandidatesContext.Provider
      value={{
        loading,
        candidates,
        weights,
        setWeights,
        resetWeights,
        jd,
        requiredSkills: required,
        preferredSkills: preferred,
        jdInsights: insights,
      }}
    >
      {children}
    </CandidatesContext.Provider>
  );
}

export function useCandidates() {
  const ctx = useContext(CandidatesContext);
  if (!ctx) throw new Error("useCandidates must be used within CandidatesProvider");
  return ctx;
}
