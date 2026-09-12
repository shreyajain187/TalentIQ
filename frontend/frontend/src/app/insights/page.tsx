"use client";

import { useCandidates } from "@/lib/candidates-context";
import { Skeleton } from "@/components/ui/skeleton";
import { JDViewerDialog } from "@/components/jd-viewer-dialog";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const { loading, jdInsights } = useCandidates();

  if (loading) {
    return <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 md:px-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!jdInsights) {
    return <div className="mx-auto max-w-4xl px-4 py-8 md:px-8"><h1 className="text-2xl font-semibold">JD quality insights</h1><p className="mt-2 text-sm text-muted-foreground">Upload and analyze a job description first.</p></div>;
  }

  const checks = [
    ["Requirements", jdInsights.checks.requirements],
    ["Responsibilities", jdInsights.checks.responsibilities],
    ["Skills", jdInsights.checks.skills],
    ["Education", jdInsights.checks.education],
    ["Experience", jdInsights.checks.experience],
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">JD quality insights</h1><p className="mt-1 text-sm text-muted-foreground">Structural review of the parsed job description and the criteria used by the matcher.</p></div>
        <JDViewerDialog trigger={<Button variant="outline" className="gap-1.5"><FileText className="h-4 w-4" />View job description</Button>} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreTile label="Structural completeness" value={jdInsights.qualityScore} />
        <MetricTile label="Required skills" value={jdInsights.stats.requiredSkillCount} />
        <MetricTile label="Preferred skills" value={jdInsights.stats.preferredSkillCount} />
      </div>

      <section className="mt-8"><h2 className="mb-3 text-sm font-semibold">Required skills</h2><div className="flex flex-wrap gap-2">{jdInsights.requiredSkills.length ? jdInsights.requiredSkills.map((skill) => <span key={skill} className="rounded-full border bg-card px-3 py-1 text-sm">{skill}</span>) : <span className="text-sm text-muted-foreground">No required skills identified.</span>}</div></section>
      <section className="mt-8"><h2 className="mb-3 text-sm font-semibold">Preferred skills</h2><div className="flex flex-wrap gap-2">{jdInsights.preferredSkills.length ? jdInsights.preferredSkills.map((skill) => <span key={skill} className="rounded-full border bg-card px-3 py-1 text-sm">{skill}</span>) : <span className="text-sm text-muted-foreground">No preferred skills identified.</span>}</div></section>

      <section className="mt-8"><h2 className="mb-3 text-sm font-semibold">Section checks</h2><div className="grid gap-2 sm:grid-cols-2">{checks.map(([label, passed]) => <div key={label} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"><span className="text-sm">{label}</span><span className={cn("flex items-center gap-1.5 text-xs font-medium", passed ? "text-emerald-600" : "text-muted-foreground")}>{passed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}{passed ? "Detected" : "Not detected"}</span></div>)}</div></section>

      <section className="mt-8 rounded-xl border bg-card p-4"><h2 className="text-sm font-semibold">Document summary</h2><div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3"><div><div className="text-muted-foreground">File</div><div className="mt-1 font-medium break-all">{jdInsights.filename}</div></div><div><div className="text-muted-foreground">Pages</div><div className="mt-1 font-medium">{jdInsights.stats.pageCount}</div></div><div><div className="text-muted-foreground">Sections detected</div><div className="mt-1 font-medium">{jdInsights.stats.sectionCount}</div></div></div></section>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-rose-600";
  return <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className={cn("mt-1 text-2xl font-semibold tracking-tight", color)}>{value}%</div><div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${value}%` }} /></div></div>;
}
function MetricTile({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div></div>; }
