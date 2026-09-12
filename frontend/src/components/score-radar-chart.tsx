"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CandidateViewModel } from "@/lib/types";

const axes = [
  { key: "semantic", label: "Semantic" },
  { key: "required", label: "Required" },
  { key: "preferred", label: "Preferred" },
  { key: "experience", label: "Experience" },
  { key: "confidence", label: "Confidence" },
] as const;

const seriesColors = ["#4f46e5", "#0ea5e9", "#10b981"];

export function ScoreRadarChart({ candidates }: { candidates: CandidateViewModel[] }) {
  const data = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.label };
    candidates.forEach((c) => {
      row[c.name] = axis.key === "confidence" ? c.confidence : c.scores[axis.key];
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="65%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        {candidates.map((c, i) => (
          <Radar
            key={c.id}
            name={c.name}
            dataKey={c.name}
            stroke={seriesColors[i % seriesColors.length]}
            fill={seriesColors[i % seriesColors.length]}
            fillOpacity={candidates.length > 1 ? 0.12 : 0.25}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 12 }}
        />
        {candidates.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}
