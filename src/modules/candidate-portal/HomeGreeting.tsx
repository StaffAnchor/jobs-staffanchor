"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Sparkles } from "lucide-react";
import {
  formatWhen,
  loadMyApplications,
  loadMyNotifications,
  type ApplicationRow,
  type CandidateNotification,
} from "./applications";
import type { CoachStep } from "./profile-score";

type TabKey = "profile" | "pipeline" | "refer";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Top of Home: who you are talking to, and the few things that need you right
// now -- an interview coming up, new updates, the single best profile step.
// When nothing needs attention it says so, instead of showing an empty box.
export default function HomeGreeting({
  fullName,
  score,
  topStep,
  onNavigate,
}: {
  fullName: string | null | undefined;
  score: number;
  topStep: CoachStep | undefined;
  onNavigate: (tab: TabKey) => void;
}) {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [notes, setNotes] = useState<CandidateNotification[]>([]);
  // Captured once so render stays pure.
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMyApplications(), loadMyNotifications(30)])
      .then(([a, n]) => {
        if (cancelled) return;
        setApps(a);
        setNotes(n);
      })
      .catch(() => {
        // Greeting still works without the extras.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const first = fullName?.trim().split(/\s+/)[0] ?? "";
  const now = new Date(nowMs);
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  const upcoming = apps
    .filter((a) => a.confirmed_interview_at && new Date(a.confirmed_interview_at).getTime() > nowMs - 2 * 3600 * 1000)
    .sort((a, b) => new Date(a.confirmed_interview_at!).getTime() - new Date(b.confirmed_interview_at!).getTime())[0];
  const unread = notes.filter((n) => !n.read_at).length;

  let subtitle = "Here is what is happening with your search.";
  if (upcoming) subtitle = `You have an interview ${formatWhen(upcoming.confirmed_interview_at!)}.`;
  else if (unread > 0) subtitle = `You have ${unread} new update${unread === 1 ? "" : "s"} on your applications.`;
  else if (score < 65) subtitle = "A few more details will make your profile much stronger.";

  const items: { key: string; icon: typeof Sparkles; tone: string; title: string; body: string; actions: React.ReactNode }[] = [];
  if (upcoming) {
    items.push({
      key: "interview",
      icon: CalendarClock,
      tone: "bg-blue-600 text-white",
      title: `Interview · ${upcoming.role_title}`,
      body: `${upcoming.client_display} · ${formatWhen(upcoming.confirmed_interview_at!)}`,
      actions: (
        <>
          <Link href="/mock-interview" className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            Prepare
          </Link>
          <button onClick={() => onNavigate("pipeline")} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Details
          </button>
        </>
      ),
    });
  }
  if (unread > 0) {
    items.push({
      key: "updates",
      icon: BellRing,
      tone: "bg-amber-100 text-amber-700",
      title: `${unread} new update${unread === 1 ? "" : "s"}`,
      body: notes.find((n) => !n.read_at)?.title ?? "Your applications have moved.",
      actions: (
        <button onClick={() => onNavigate("pipeline")} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          View
        </button>
      ),
    });
  }
  if (topStep) {
    items.push({
      key: "coach",
      icon: Sparkles,
      tone: "bg-emerald-100 text-emerald-700",
      title: topStep.label,
      body: `${topStep.why} (+${topStep.impact}% on your profile)`,
      actions: (
        <button onClick={() => onNavigate("profile")} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          Do it <ArrowRight className="h-3 w-3" />
        </button>
      ),
    });
  }

  return (
    <section className="mb-8">
      <p className="text-[13px] font-semibold text-slate-400">{dateLabel}</p>
      <h1 className="mt-1.5 font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {greetingFor(Number(now.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" })))}
        {first && (
          <>
            ,{" "}
            <span className="font-(family-name:--font-fraunces) font-medium italic text-blue-600">{first}</span>
          </>
        )}
      </h1>
      <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>

      {items.length > 0 ? (
        <div className="mt-6 space-y-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.key} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${it.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-slate-900">{it.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{it.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">{it.actions}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm font-medium text-emerald-900">
          You are all caught up. Check your best-fit roles below.
        </p>
      )}
    </section>
  );
}
