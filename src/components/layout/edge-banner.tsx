"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";

const KEY = "sa_edge_banner_until";
const HIDE_DAYS = 7;

// Pages where the banner would be noise: Edge itself, the paid-upsell and resume pages, and the client and admin areas.
const SKIP = ["/edge", "/resume", "/resume-writing", "/priority-applicant", "/client-login", "/client-portal", "/dashboard"];

// A slim, dismissible strip that points jobseekers to StaffAnchor Edge. Closing it hides it for a week. Browser storage
// can be blocked, so every read and write is guarded and the banner simply shows if storage is unavailable.
export default function EdgeBanner({ pathname }: { pathname: string }) {
  const [show, setShow] = useState(false);
  const skip = SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    let hidden = false;
    try {
      const until = Number(window.localStorage.getItem(KEY));
      hidden = Number.isFinite(until) && until > Date.now();
    } catch {
      hidden = false;
    }
    const t = setTimeout(() => setShow(!hidden), 0);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, String(Date.now() + HIDE_DAYS * 86400000));
    } catch {
      /* storage blocked: it just comes back next visit */
    }
  }

  if (skip || !show) return null;
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-[13px] sm:px-6 lg:px-8">
        <Link href="/edge?src=jobs_banner" className="group flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          <span className="min-w-0 truncate">
            <span className="font-semibold">StaffAnchor Edge</span>
            <span className="hidden sm:inline"> · 1:1 mock interviews, job strategy and resume writing for sales professionals</span>
            <span className="sm:hidden"> · mock interviews and resume writing</span>
          </span>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold transition group-hover:bg-white/25">
            Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <button type="button" onClick={close} aria-label="Hide this for a week" className="shrink-0 rounded p-1 text-white/80 hover:bg-white/15 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
