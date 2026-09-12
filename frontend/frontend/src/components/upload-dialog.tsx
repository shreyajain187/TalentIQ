"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

function DropZone({
  label,
  hint,
  multiple,
  files,
  onFiles,
}: {
  label: string;
  hint: string;
  multiple?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-indigo-400 bg-indigo-50/60" : "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        <UploadCloud className="mb-2 h-6 w-6 text-indigo-500" />
        <p className="text-sm font-medium">Drop files here</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept=".pdf,.docx,.txt,.xml"
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={f.name + i} className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => onFiles(files.filter((_, idx) => idx !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UploadDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [jdFiles, setJdFiles] = useState<File[]>([]);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function handleAnalyze() {
  setError(null);

  if (jdFiles.length !== 1) {
    setError("Please upload exactly one job description.");
    return;
  }

  if (resumeFiles.length === 0) {
    setError("Please upload at least one resume.");
    return;
  }

  if (resumeFiles.length > 18) {
    setError("You can upload a maximum of 18 resumes.");
    return;
  }

  const formData = new FormData();

  formData.append(
    "jd",
    jdFiles[0]
  );

  for (const resume of resumeFiles) {
    formData.append(
      "resumes",
      resume
    );
  }

  setOpen(false);
  setProcessing(true);

  try {
    const response = await fetch(
      "http://localhost:8000/api/analyze",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(
        () => null
      );

      throw new Error(
        body?.detail ??
          `Analysis failed (${response.status})`
      );
    }

    const result = await response.json();

    localStorage.setItem(
      "talentiq:analysis",
      JSON.stringify(result)
    );

    setProcessing(false);

    router.push("/candidates");

  } catch (err) {
    console.error(err);

    setProcessing(false);
    setOpen(true);

    setError(
      err instanceof Error
        ? err.message
        : "Candidate analysis failed."
    );
  }
}

  function handleDone() {
  // Navigation happens after the real API request finishes.
}

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={trigger as React.ReactElement} />
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload job description &amp; resumes</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <DropZone
              label="Job description"
              hint="PDF, DOCX, TXT, XML up to 10MB · 1 file"
              files={jdFiles}
              onFiles={(f) => setJdFiles(f.slice(0, 1))}
            />
            <DropZone
              label="Resumes"
              hint="PDF, DOCX, TXT, XML up to 10MB · up to 18 files"
              multiple
              files={resumeFiles}
              onFiles={(files) => setResumeFiles(files.slice(0, 18))}
            />
            <p className="text-xs text-muted-foreground">
  Upload one job description and up to 18 resumes.
  TalentIQ will parse, rank, explain, and generate interview questions
  for the candidates.
</p>
          </div>
          {error && (
  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {error}
  </div>
)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
  onClick={handleAnalyze}
  className="gap-1.5"
  disabled={
    jdFiles.length !== 1 ||
    resumeFiles.length === 0 ||
    resumeFiles.length > 18
  }
>
              <UploadCloud className="h-4 w-4" />
              Analyze candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {processing && <ProcessingOverlay onDone={handleDone} />}
    </>
  );
}
