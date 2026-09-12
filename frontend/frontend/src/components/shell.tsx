"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCandidates } from "@/lib/candidates-context";
import {
  LayoutGrid,
  Users,
  GitCompare,
  Sparkles,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Brain,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const nav = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/candidates", label: "Candidates", icon: Users, countKey: "candidates" as const },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/insights", label: "JD Insights", icon: Sparkles },
];

const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help center", icon: HelpCircle },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { candidates } = useCandidates();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <span className="font-semibold tracking-tight text-[15px]">TalentIQ</span>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            BETA
          </span>
        </div>

        <div className="px-3 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-slate-600 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.countKey && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {candidates.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-3">
          <nav className="flex flex-col gap-0.5 border-t border-sidebar-border pt-2">
            {bottomNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-slate-600 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center gap-2.5 rounded-md px-2.5 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              AC
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Alex Carter</div>
              <div className="truncate text-xs text-muted-foreground">Recruiting team</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card/70 px-4 md:px-6 backdrop-blur">
          <div className="relative hidden sm:block w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search candidates, skills, jobs…" className="pl-8 bg-muted/60 border-transparent focus-visible:bg-card" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500" />
          </div>
        </header>

        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
