"use client";

import { useCandidates } from "@/lib/candidates-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export function JDViewerDialog({ trigger }: { trigger: React.ReactNode }) {
  const { jd, requiredSkills, preferredSkills } = useCandidates();

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            {jd?.filename ?? "job_description.pdf"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {requiredSkills.map((s) => (
                <Badge key={s} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                  {s}
                </Badge>
              ))}
              {preferredSkills.map((s) => (
                <Badge key={s} variant="outline" className="text-muted-foreground">
                  {s}
                </Badge>
              ))}
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-foreground/90 font-sans">
              {jd?.pages[0]?.text ?? "Loading…"}
            </pre>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
