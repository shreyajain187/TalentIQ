"use client";

import { useCandidates } from "@/lib/candidates-context";
import { Skeleton } from "@/components/ui/skeleton";
import { JDViewerDialog } from "@/components/jd-viewer-dialog";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyles = {
  warning: { icon: AlertTriangle, cls: "text-amber-600 bg-amber-50 border-amber-200" },
  info: { icon: Info, cls: "text-sky-600 bg-sky-50 border-sky-200" },
  good: { icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
} as const;

export default function InsightsPage() {
  const { loading, jdInsights } = useCandidates();

  if (loading || !jdInsights) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">JD quality &amp; bias insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated review of this listing&apos;s clarity, inclusivity and matching quality.
          </p>
        </div>
        <JDViewerDialog trigger={<Button variant="outline" className="gap-1.5"><FileText className="h-4 w-4" />View job description</Button>} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreTile label="Overall quality" value={jdInsights.qualityScore} />
        <ScoreTile label="Clarity" value={jdInsights.clarityScore} />
        <ScoreTile label="Inclusivity" value={jdInsights.inclusivityScore} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Flags</h2>
        <div className="space-y-2.5">
          {jdInsights.flags.map((f, i) => {
            const { icon: Icon, cls } = severityStyles[f.severity];
            return (
              <div key={i} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", cls)}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="mt-0.5 text-xs opacity-90">{f.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Suggested rewrites</h2>
        <div className="space-y-3">
          {jdInsights.suggestedRewrites.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground line-through decoration-rose-400/60">{r.original}</p>
              <div className="my-1.5 flex items-center gap-1.5 text-indigo-500">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm">{r.suggested}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight", color)}>{value}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
