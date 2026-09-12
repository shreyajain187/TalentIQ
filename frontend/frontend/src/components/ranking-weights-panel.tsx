"use client";

import { useCandidates } from "@/lib/candidates-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { RankingWeights } from "@/lib/types";

const rows: { key: keyof RankingWeights; label: string }[] = [
  { key: "semantic", label: "Semantic fit" },
  { key: "required", label: "Required skills" },
  { key: "preferred", label: "Preferred skills" },
  { key: "experience", label: "Experience" },
];

export function RankingWeightsPanel() {
  const { weights, setWeights, resetWeights } = useCandidates();

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <div>
            <h3 className="text-sm font-semibold">Ranking weights</h3>
            <p className="text-xs text-muted-foreground">Tune what matters most for this role.</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={resetWeights}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        {rows.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums text-muted-foreground">{weights[key]}%</span>
            </div>
            <Slider
              value={[weights[key]]}
              max={100}
              step={1}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                setWeights({ ...weights, [key]: next });
              }}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Weights recalculate scores instantly. Total weight can exceed 100% for emphasis.
      </p>
    </div>
  );
}
