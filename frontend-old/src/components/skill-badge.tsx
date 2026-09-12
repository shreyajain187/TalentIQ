import type { SkillStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<SkillStatus, string> = {
  EXACT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INFERRED: "bg-sky-50 text-sky-700 border-sky-200",
  WEAK: "bg-amber-50 text-amber-700 border-amber-200",
  MISSING: "bg-rose-50 text-rose-700 border-rose-200",
};

export function SkillStatusBadge({ status, className }: { status: SkillStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
