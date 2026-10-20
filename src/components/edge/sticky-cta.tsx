"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

// A thumb-friendly "Book a session" bar for phones, shown once the visitor has scrolled past the top of the page.
export default function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.25)] backdrop-blur transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <a href="#sessions" className="flex items-center justify-center gap-2 rounded-xl bg-[#12131A] px-5 py-3.5 text-[15px] font-semibold text-white">
        Book a session <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
