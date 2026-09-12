"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const pipelineSteps = [
  "Parsing JD & resumes",
  "Keyword matching",
  "Semantic matching",
  "Building skill graph",
  "Hybrid ranking",
  "Collecting evidence",
  "Detecting skill gaps",
  "Generating explanations",
  "Drafting interview questions",
];

export function ProcessingOverlay({
  onDone,
  stepDurationMs = 380,
}: {
  onDone: () => void;
  stepDurationMs?: number;
}) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= pipelineSteps.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveStep((s) => s + 1), stepDurationMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Analyzing candidates</h3>
            <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {pipelineSteps.map((step, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <li key={step} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    current && !done && "border-indigo-500 bg-indigo-50",
                    !done && !current && "border-border bg-muted"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : current ? (
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                  ) : null}
                </span>
                <span className={cn(done ? "text-foreground" : current ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {step}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
