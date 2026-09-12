"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCandidates } from "@/lib/candidates-context";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { SkillStatusBadge } from "@/components/skill-badge";
import { ScoreRadarChart } from "@/components/score-radar-chart";
import { EmptyState } from "@/components/states";
import { explainRanking } from "@/lib/explain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GitCompare, Crown } from "lucide-react";
import type { CandidateViewModel } from "@/lib/types";

const SLOT_COLORS = ["ring-indigo-400", "ring-sky-400", "ring-emerald-400"];

export function CompareContent() {
  const searchParams = useSearchParams();
  const { loading, candidates } = useCandidates();
  const initialIds = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  const [slots, setSlots] = useState<(string | null)[]>([
    initialIds[0] ?? null,
    initialIds[1] ?? null,
    initialIds[2] ?? null,
  ]);

  const selected = slots
    .map((id) => candidates.find((c) => c.id === id))
    .filter((c): c is CandidateViewModel => Boolean(c));

  const allSkillNames = useMemo(() => {
    const names = new Set<string>();
    selected.forEach((c) => c.skills.forEach((s) => names.add(s.skill)));
    return Array.from(names);
  }, [selected]);

  const top = selected.length
    ? [...selected].sort((a, b) => b.overallFit - a.overallFit)[0]
    : null;

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Compare candidates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick up to three candidates for a side-by-side, evidence-backed comparison.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {slots.map((slotId, i) => (
          <Select
            key={i}
            items={Object.fromEntries(candidates.map((c) => [c.id, `${c.name} · ${c.overallFit}`]))}
            value={slotId ?? undefined}
            onValueChange={(v: string | null) =>
              setSlots((prev) => prev.map((p, idx) => (idx === i ? v : p)))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Candidate ${String.fromCharCode(65 + i)}`} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.overallFit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {selected.length < 2 ? (
        <div className="mt-8">
          <EmptyState
            icon={GitCompare}
            title="Select at least two candidates"
            description="Choose candidates above to see score, evidence and skill comparisons."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {selected.map((c, i) => (
              <div key={c.id} className={`rounded-xl border border-border bg-card p-5 ring-1 ${SLOT_COLORS[i]}`}>
                <div className="flex items-center gap-3">
                  <CandidateAvatar name={c.name} colorClass={c.avatarColor} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{c.name}</span>
                      {top?.id === c.id && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.title}</div>
                  </div>
                  <div className="ml-auto text-xl font-semibold text-indigo-600">{c.overallFit}</div>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <ScoreRow label="Semantic" value={c.scores.semantic} />
                  <ScoreRow label="Required" value={c.scores.required} />
                  <ScoreRow label="Preferred" value={c.scores.preferred} />
                  <ScoreRow label="Experience" value={c.scores.experience} />
                  <ScoreRow label="Confidence" value={c.confidence} />
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Score comparison</h2>
            <ScoreRadarChart candidates={selected} />
          </section>

          {top && selected.length > 1 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-1 text-sm font-semibold">
                Why does {top.name} rank above {selected.filter((c) => c.id !== top.id).map((c) => c.name).join(" / ")}?
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">Explanation derived from current sub-scores and evidence — not a new judgment.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {selected
                  .filter((c) => c.id !== top.id)
                  .map((other) => (
                    <div key={other.id} className="rounded-lg border border-border/70 p-4">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">
                        {top.name} vs. {other.name}
                      </div>
                      <ul className="space-y-1.5">
                        {explainRanking(top, other).map((bullet, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm">
                            <span className="mt-0.5 text-emerald-600">+</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Skill coverage matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 text-left">Skill</th>
                    {selected.map((c) => (
                      <th key={c.id} className="px-2 py-2 text-center">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allSkillNames.map((skill) => (
                    <tr key={skill}>
                      <td className="px-2 py-2.5 font-medium">{skill}</td>
                      {selected.map((c) => {
                        const evidence = c.skills.find((s) => s.skill === skill);
                        return (
                          <td key={c.id} className="px-2 py-2.5 text-center">
                            {evidence ? (
                              <Tooltip>
                                <TooltipTrigger render={<span className="inline-block" />}>
                                  <SkillStatusBadge status={evidence.status} />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">{evidence.evidence}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-7 text-right font-medium">{value}</span>
    </div>
  );
}
