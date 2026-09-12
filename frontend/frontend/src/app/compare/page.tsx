import { Suspense } from "react";
import { CompareContent } from "@/components/compare-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 md:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
