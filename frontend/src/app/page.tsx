"use client";

import Link from "next/link";
import { useCandidates } from "@/lib/candidates-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadCloud, FileText, ArrowRight, Sparkles } from "lucide-react";
import { UploadDialog } from "@/components/upload-dialog";
import { JDViewerDialog } from "@/components/jd-viewer-dialog";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { EmptyState } from "@/components/states";

export default function OverviewPage() {
  const { loading, candidates, jd } = useCandidates();

  const avgConfidence = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.confidence, 0) / candidates.length)
    : 0;
  const SHORTLIST_THRESHOLD = 30;

const shortlisted = candidates.filter(
  (candidate) =>
    candidate.overallFit >= SHORTLIST_THRESHOLD
);
  const evidenceCoverage = candidates.length
    ? Math.round(
        (candidates.reduce((s, c) => s + c.skills.filter((sk) => sk.status !== "MISSING").length, 0) /
          (candidates.length * 6)) *
          100
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
        Candidate Intelligence
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Senior Product Designer</h1>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading candidates…" : `${candidates.length} candidates ranked against your job description`} · Updated
            moments ago
          </p>
        </div>
        <div className="flex gap-2">
          <UploadDialog
            trigger={
              <Button variant="outline" className="gap-1.5">
                <UploadCloud className="h-4 w-4" />
                Upload resumes
              </Button>
            }
          />
          <JDViewerDialog
            trigger={
              <Button className="gap-1.5">
                <FileText className="h-4 w-4" />
                View job description
              </Button>
            }
          />
        </div>
      </div>

      <div>
  <p>Shortlist ready</p>

  <div className="flex items-end gap-2">
    <span className="text-3xl font-bold">
      {shortlisted.length}
    </span>

    <span className="text-sm text-muted-foreground">
      score ≥ 30
    </span>
  </div>
</div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold">Top ranked candidates</h2>
        <Button
          render={<Link href="/candidates" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="gap-1 text-indigo-600 hover:text-indigo-700"
        >
          View all candidates
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState title="No candidates yet" description="Upload a job description and resumes to get started." />
        ) : (
          <ul className="divide-y divide-border">
            {candidates.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/candidates/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <span className="w-5 text-xs font-semibold text-muted-foreground">#{c.rank}</span>
                  <CandidateAvatar name={c.name} colorClass={c.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-indigo-600">{c.overallFit}</div>
                    <div className="text-[11px] text-muted-foreground">fit</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/insights"
        className="mt-8 flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 px-5 py-4 transition-colors hover:from-indigo-100 hover:to-sky-100"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">JD quality &amp; bias insights available</div>
          <div className="text-xs text-muted-foreground">
            {jd ? "Review clarity, inclusivity and suggested rewrites for this listing." : "Loading…"}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-indigo-600" />
      </Link>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {value === null ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}
