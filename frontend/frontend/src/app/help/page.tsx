"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mail, BookOpen, LifeBuoy } from "lucide-react";

const faqs = [
  {
    q: "How is the overall fit score calculated?",
    a: "Overall fit is a weighted average of four sub-scores — semantic fit, required-skill match, preferred-skill match and experience — using the weights you set on the Candidates page. Adjusting a slider instantly recalculates every candidate's score and re-sorts the list.",
  },
  {
    q: "What do EXACT / INFERRED / WEAK / MISSING mean?",
    a: "EXACT means the skill was found verbatim with strong supporting evidence. INFERRED means the engine derived the skill from related evidence (e.g. Node.js inferred from \"built REST APIs with Express.js\"). WEAK means evidence exists but is thin or indirect. MISSING means no supporting evidence was found in the resume.",
  },
  {
    q: "Where do interview questions come from?",
    a: "Interview Intelligence generates targeted questions from each candidate's INFERRED, WEAK and MISSING skills, so interviewers can probe the exact gaps the evidence couldn't confirm.",
  },
  {
    q: "Does TalentIQ call any external AI service?",
    a: "No. Everything in this demo runs locally against a built-in mock dataset — there are no external API calls, keys, or third-party AI services involved.",
  },
  {
    q: "Can I compare more than 3 candidates at once?",
    a: "Comparison is capped at three candidates side-by-side to keep the evidence and skill matrix readable. Use ranking weights and filters on the Candidates page to narrow your shortlist first.",
  },
  {
    q: "How do I read the JD quality/bias insights?",
    a: "Each flag highlights a specific risk in the listing — exclusionary language, vague requirements, or missing details — with a suggested rewrite. These are heuristics to prompt a human review, not a compliance judgment.",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const filtered = faqs.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100">
          <LifeBuoy className="h-5 w-5 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Help center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Answers about how TalentIQ ranks and explains candidates.</p>
        <div className="relative mx-auto mt-5 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles…" className="pl-8" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a href="#faq" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
          <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
          <div>
            <div className="text-sm font-medium">Browse FAQs</div>
            <div className="text-xs text-muted-foreground">Scoring, evidence & comparisons</div>
          </div>
        </a>
        <a href="mailto:support@talentiq.example" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
          <Mail className="h-4.5 w-4.5 text-indigo-600" />
          <div>
            <div className="text-sm font-medium">Contact support</div>
            <div className="text-xs text-muted-foreground">support@talentiq.example</div>
          </div>
        </a>
      </div>

      <section id="faq" className="mt-10">
        <h2 className="mb-3 text-sm font-semibold">Frequently asked questions</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No articles match &quot;{query}&quot;.</p>
        ) : (
          <Accordion className="rounded-xl border border-border bg-card px-2">
            {filtered.map((f, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="px-3 text-sm font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 text-center">
        <p className="text-sm">Still stuck? We usually reply within one business day.</p>
        <Button render={<a href="mailto:support@talentiq.example" />} nativeButton={false} className="mt-3">
          Email support
        </Button>
      </div>
    </div>
  );
}
