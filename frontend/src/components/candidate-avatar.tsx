import { cn } from "@/lib/utils";

export function CandidateAvatar({
  name,
  colorClass,
  size = "md",
}: {
  name: string;
  colorClass: string;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        colorClass,
        size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
      )}
    >
      {initials}
    </div>
  );
}
