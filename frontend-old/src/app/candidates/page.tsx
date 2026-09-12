"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCandidates } from "@/lib/candidates-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { RankingWeightsPanel } from "@/components/ranking-weights-panel";
import { EmptyState } from "@/components/states";
import { Search, ArrowUpDown, GitCompare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateViewModel } from "@/lib/types";

type SortKey = "overallFit" | "semantic" | "required" | "preferred" | "confidence";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "overallFit", label: "Overall fit" },
  { key: "semantic", label: "Semantic" },
  { key: "required", label: "Required skills" },
  { key: "preferred", label: "Preferred skills" },
  { key: "confidence", label: "Confidence" },
];

function sortValue(c: CandidateViewModel, key: SortKey) {
  if (key === "overallFit") return c.overallFit;
  if (key === "confidence") return c.confidence;
  return c.scores[key];
}

export default function CandidatesPage() {
  const { loading, candidates } = useCandidates();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("overallFit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string[]>([]);

  const roles = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.title))).sort(),
    [candidates]
  );

  const filtered = useMemo(() => {
    let list = candidates;
    if (role !== "all") list = list.filter((c) => c.title === role);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.skills.some((s) => s.status !== "MISSING" && s.skill.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
      return sortDir === "desc" ? -diff : diff;
    });
  }, [candidates, role, query, sortKey, sortDir]);

  function toggleSelected(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ranked candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sorted by explainable fit score · {candidates.length} total
          </p>
        </div>
        {selected.length >= 2 && (
          <Button
            className="gap-1.5"
            onClick={() => router.push(`/compare?ids=${selected.join(",")}`)}
          >
            <GitCompare className="h-4 w-4" />
            Compare {selected.length} selected
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, title or skill…"
                className="pl-8"
              />
            </div>
            <Select
              items={{ all: "All roles", ...Object.fromEntries(roles.map((r) => [r, r])) }}
              value={role}
              onValueChange={(v: string | null) => setRole(v ?? "all")}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={Object.fromEntries(sortOptions.map((o) => [o.key, `Sort: ${o.label}`]))}
              value={sortKey}
              onValueChange={(v: string | null) => v && setSortKey(v as SortKey)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    Sort: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              title={sortDir === "desc" ? "Descending" : "Ascending"}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="w-10 px-4 py-3"></th>
                    <th className="px-2 py-3 text-left">Candidate</th>
                    <th className="px-3 py-3 text-right">Overall fit</th>
                    <th className="px-3 py-3 text-right">Semantic</th>
                    <th className="px-3 py-3 text-right">Required</th>
                    <th className="px-3 py-3 text-right">Preferred</th>
                    <th className="px-3 py-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3.5">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))}
                  {!loading &&
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => router.push(`/candidates/${c.id}`)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(c.id)}
                            onChange={() => toggleSelected(c.id)}
                            className="h-4 w-4 rounded border-border accent-indigo-600"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <CandidateAvatar name={c.name} colorClass={c.avatarColor} size="sm" />
                            <div className="min-w-0">
                              <Link
                                href={`/candidates/${c.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-sm font-medium hover:text-indigo-600 hover:underline"
                              >
                                {c.name}
                              </Link>
                              <div className="truncate text-xs text-muted-foreground">{c.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-indigo-600">{c.overallFit}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{c.scores.semantic}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{c.scores.required}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{c.scores.preferred}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-sky-500"
                                style={{ width: `${c.confidence}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-xs text-muted-foreground">{c.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length === 0 && (
              <EmptyState
                icon={Sparkles}
                title="No candidates match your filters"
                description="Try clearing the search or role filter."
              />
            )}
          </div>
          <p className={cn("mt-2 text-xs text-muted-foreground", loading && "opacity-0")}>
            Showing {filtered.length} of {candidates.length} candidates · select 2–3 to compare
          </p>
        </div>

        <div className="space-y-4">
          <RankingWeightsPanel />
        </div>
      </div>
    </div>
  );
}
