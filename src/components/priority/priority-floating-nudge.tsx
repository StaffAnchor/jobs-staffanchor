"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Zap } from "lucide-react";

// The sidebar teaser on the job detail page only lives near the top --
// once a candidate scrolls down into the actual apply form (or, on
// /register, into the multi-step profile builder) they're looking at a
// full-width form with nothing beside it, so the offer disappears right
// when they're spending the most time on the page and are most primed to
// see it (mid-form, re-reading a field, deciding what to fill in next).
// This is a small fixed card that stays on screen through that whole
// stretch instead of scrolling out of view with the rest of the sidebar.
//
// Deliberately not sticky-positioned inside a column (ApplyForm manages
// its own internal max-width/grid and squeezing a column next to it here
// would fight that layout) -- fixed positioning sidesteps the page's
// column structure entirely and works the same whether it's sitting next
// to a 3-field email gate or a 4-stage profile form.
export default function PriorityFloatingNudge({ mandateId }: { mandateId?: string | null }) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Small delay so it doesn't compete with the page's own entrance/scroll
  // for attention in the first moment of landing.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
      <div className="group relative w-64 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-600 p-3.5 shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 transition-all">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/15 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link href={`/priority-applicant${mandateId ? `?mandateId=${mandateId}` : ""}`} className="block pr-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </span>
            <p className="text-[12.5px] font-bold leading-tight text-white">Want to be seen first?</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-white/85">
            Flag this application for the recruiter&apos;s first pass — from ₹79.
          </p>
        </Link>
      </div>
    </div>
  );
}
