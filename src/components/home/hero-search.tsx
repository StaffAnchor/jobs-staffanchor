"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const QUICK_SEARCHES = ["B2B Sales", "B2C Sales", "SaaS", "Team Lead", "Remote", "Delhi", "Bangalore"];

// The first thing a visitor can DO: type what they want and land on the jobs
// list already filtered (the jobs page reads ?q=).
export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/jobs?q=${encodeURIComponent(term)}` : "/jobs");
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex flex-1 items-center gap-3 px-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search roles"
            placeholder="Search role, company, city or skill"
            className="h-12 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Search jobs
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Popular:</span>
        {QUICK_SEARCHES.map((s) => (
          <Link
            key={s}
            href={`/jobs?q=${encodeURIComponent(s)}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
