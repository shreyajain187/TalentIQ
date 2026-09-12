"use client";

import { useParams, useRouter } from "next/navigation";
import { useCandidates } from "@/lib/candidates-context";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { SkillStatusBadge } from "@/components/skill-badge";
import { ScoreRadarChart } from "@/components/score-radar-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states";
import { ArrowLeft, MapPin, Briefcase, GitCompare, AlertTriangle, MessageCircleQuestion } from "lucide-react";

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, candidates } = useCandidates();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <EmptyState
          icon={AlertTriangle}
          title="Candidate not found"
          description="This candidate may have been removed or the link is incorrect."
          action={
            <Button onClick={() => router.push("/candidates")} variant="outline" size="sm">
              Back to candidates
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <button
        onClick={() => router.push("/candidates")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to candidates
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <CandidateAvatar name={candidate.name} colorClass={candidate.avatarColor} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Candidate evidence view
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {candidate.title}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.location}
              </span>
              <span>{candidate.yearsExperience} yrs experience</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => router.push(`/compare?ids=${candidate.id}`)}
        >
          <GitCompare className="h-4 w-4" />
          Add to comparison
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Evidence-backed skill matching</h2>
            <div className="space-y-3">
              {candidate.skills.map((s) => (
                <div key={s.skill} className="flex items-start justify-between gap-3 rounded-lg border border-border/70 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.skill}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.evidence}</div>
                  </div>
                  <SkillStatusBadge status={s.status} className="mt-0.5 shrink-0" />
                </div>
              ))}
            </div>

            {candidate.skillGaps.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3">
                <div className="text-xs font-semibold text-rose-700">Skill gaps</div>
                <ul className="mt-1 space-y-1">
                  {candidate.skillGaps.map((g, i) => (
                    <li key={i} className="text-xs text-rose-700/90">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Score breakdown</h2>
              <div className="text-2xl font-semibold text-indigo-600">{candidate.overallFit}</div>
            </div>
            <p className="mb-1 text-xs text-muted-foreground">overall fit</p>
            <ScoreRadarChart candidates={[candidate]} />
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <MessageCircleQuestion className="h-4 w-4 text-indigo-600" />
              Interview intelligence
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Targeted questions generated from missing, inferred and weak skill evidence.
            </p>
            <ol className="space-y-2.5">
              {candidate.interviewQuestions.map((q, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="shrink-0 text-xs font-semibold text-indigo-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
