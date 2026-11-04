"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import EdgeBanner from "./edge-banner";
import { VISIT_COUNT_KEY } from "@/lib/attribution";
import { trackStep } from "@/lib/edge-step";

const DISMISS_KEY = "sa_return_nudge_until";
const DISMISS_DAYS = 14;
const MIN_VISITS = 3;
// Pages where someone is browsing for work. Job pages have their own apply bar, so they are left alone.
const PAGES = [/^\/$/, /^\/jobs$/, /^\/jobs-in\//, /^\/salary/];

// The slim strip at the top of the page. For someone who has visited three or more times without making a profile it asks
// them to build one; for everyone else it is the StaffAnchor Edge banner. Both are dismissible and never show on job pages.
export default function ReturnVisitStrip({ pathname, signedIn }: { pathname: string; signedIn: boolean | null }) {
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    let show = false;
    try {
      const visits = Number(window.localStorage.getItem(VISIT_COUNT_KEY)) || 0;
      const until = Number(window.localStorage.getItem(DISMISS_KEY)) || 0;
      const muted = window.localStorage.getItem("sa_internal") === "1";
      show = signedIn === false && visits >= MIN_VISITS && until < Date.now() && !muted && PAGES.some((re) => re.test(pathname));
    } catch {
      show = false;
    }
    const t = setTimeout(() => setNudge(show), 0);
    return () => clearTimeout(t);
  }, [pathname, signedIn]);

  function close() {
    setNudge(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86_400_000));
    } catch {
      /* storage blocked: it comes back next visit */
    }
  }

  if (!nudge) return <EdgeBanner pathname={pathname} />;
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-[13px] sm:px-6 lg:px-8">
        <Link
          href="/register"
          onClick={() => trackStep("promo", "return-nudge-register", "click")}
          className="group flex min-w-0 flex-1 items-center gap-2 py-1.5"
        >
          <span className="min-w-0 truncate">
            <span className="font-semibold">Back again?</span>
            <span className="hidden sm:inline"> Build a free profile in about a minute and we&apos;ll match you to roles and message you when one fits.</span>
            <span className="sm:hidden"> Build a free profile in a minute.</span>
          </span>
          <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold transition group-hover:bg-white/30">
            Create profile <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
        <button type="button" onClick={close} aria-label="Hide this for two weeks" className="-my-1 -mr-1.5 shrink-0 rounded p-2.5 text-white/80 hover:bg-white/15 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
