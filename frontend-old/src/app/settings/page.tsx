"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RankingWeightsPanel } from "@/components/ranking-weights-panel";
import { Trash2 } from "lucide-react";

const WORKSPACE_KEY = "talentiq:workspace";
const NOTIFS_KEY = "talentiq:notifications";

interface NotifPrefs {
  weeklyDigest: boolean;
  newCandidateAlerts: boolean;
  biasFlags: boolean;
}

const defaultNotifs: NotifPrefs = { weeklyDigest: true, newCandidateAlerts: true, biasFlags: false };

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState(() =>
    typeof window === "undefined" ? "Nexora" : (localStorage.getItem(WORKSPACE_KEY) ?? "Nexora")
  );
  const [notifs, setNotifs] = useState<NotifPrefs>(() => {
    if (typeof window === "undefined") return defaultNotifs;
    try {
      const n = localStorage.getItem(NOTIFS_KEY);
      return n ? JSON.parse(n) : defaultNotifs;
    } catch {
      return defaultNotifs;
    }
  });
  const [savedFlash, setSavedFlash] = useState(false);

  function save() {
    localStorage.setItem(WORKSPACE_KEY, workspace);
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  function clearLocalData() {
    localStorage.removeItem("talentiq:weights");
    localStorage.removeItem(WORKSPACE_KEY);
    localStorage.removeItem(NOTIFS_KEY);
    setWorkspace("Nexora");
    setNotifs(defaultNotifs);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Workspace preferences for this recruiter session.</p>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Workspace</h2>
        <div className="space-y-1.5">
          <Label htmlFor="workspace">Workspace name</Label>
          <Input id="workspace" value={workspace} onChange={(e) => setWorkspace(e.target.value)} className="max-w-xs" />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Notifications</h2>
        <div className="space-y-4">
          <ToggleRow
            label="Weekly digest"
            description="Summary of new applicants and score changes."
            checked={notifs.weeklyDigest}
            onChange={(v) => setNotifs((n) => ({ ...n, weeklyDigest: v }))}
          />
          <ToggleRow
            label="New candidate alerts"
            description="Notify when a resume is added to an active job."
            checked={notifs.newCandidateAlerts}
            onChange={(v) => setNotifs((n) => ({ ...n, newCandidateAlerts: v }))}
          />
          <ToggleRow
            label="Bias flag alerts"
            description="Notify when a job description gets a low inclusivity score."
            checked={notifs.biasFlags}
            onChange={(v) => setNotifs((n) => ({ ...n, biasFlags: v }))}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Default ranking weights</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Applies to Candidates and Compare views. Recruiters can still adjust these per-session.
        </p>
        <RankingWeightsPanel />
      </section>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save}>Save changes</Button>
        {savedFlash && <span className="text-xs font-medium text-emerald-600">Saved</span>}
      </div>

      <section className="mt-10 rounded-xl border border-rose-200 bg-rose-50/40 p-5">
        <h2 className="text-sm font-semibold text-rose-900">Danger zone</h2>
        <p className="mt-1 text-xs text-rose-700/80">
          Clears locally saved preferences (weights, workspace name, notification settings) from this browser.
        </p>
        <Button variant="outline" className="mt-3 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-100" onClick={clearLocalData}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear local data
        </Button>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
