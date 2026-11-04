import TrackedLink from "@/components/edge/tracked-link";
import { ArrowRight, CalendarClock, Compass, FileText, Mic, PhoneCall, ShieldCheck } from "lucide-react";
import { PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";
import { nextOpenSlot, slotLabel } from "@/lib/edge-slot";

const EDGE = "/edge?src=jobs_home";

const SERVICES = [
  { id: "mock-interview", icon: Mic, title: "Interview Prep + Mock Interview", line: "A real 60-minute interview loop, then the honest debrief", price: "₹1,999" },
  { id: "resume-writing", icon: FileText, title: "Resume Writing", line: "Written for you by experience level, in Word and PDF", price: "from ₹1,199" },
  { id: "job-search-strategy", icon: Compass, title: "Job Strategy + Resume Rebuild", line: "Both together, 20% less than buying them apart", price: "from ₹1,758" },
];

// The hero's right-hand side: a short story and the three Edge services, with every row and the button leading to /edge.
// The open slot is read live from the calendar and left out if it can't be read.
export default async function EdgeHero() {
  const slot = await nextOpenSlot();
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="pointer-events-none absolute -right-10 top-6 h-72 w-72 rounded-full bg-indigo-500/35 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

      {slot && (
        <TrackedLink
          href={EDGE}
          from="home"
          track="hero-slot-chip"
          className="animate-float absolute -top-4 right-3 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-slate-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] sm:right-0"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Next open slot · {slotLabel(slot)}
        </TrackedLink>
      )}

      <div className="relative z-10 overflow-hidden rounded-3xl bg-white p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] sm:p-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
          StaffAnchor Edge · 1:1 with Gagan Sharma
        </span>
        <h2 className="mt-4 text-[26px] font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-[30px]">
          You sell for a living. <span className="text-indigo-600">Is your pitch for yourself as sharp?</span>
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
          Gagan has built and led sales teams for 15+ years and managed ₹100-150 Cr+ in revenue. He interviews you the way a hiring manager would, then tells you exactly where you would have been screened out, and how to fix it.
        </p>

        <ul className="mt-5 space-y-2.5">
          {SERVICES.map((s) => (
            <li key={s.id}>
              <TrackedLink
                href={`${EDGE}#${s.id}`}
                from="home"
                track={`hero-row-${s.id}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-indigo-300 hover:bg-indigo-50/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-tight text-slate-900">{s.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{s.line}</span>
                </span>
                <span className="shrink-0 text-right text-[13.5px] font-extrabold text-slate-900">{s.price}</span>
              </TrackedLink>
            </li>
          ))}
          <li>
            <TrackedLink
              href="/jobs?src=jobs_home_call"
              from="home"
              track="hero-recruiter-call"
              className="group flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                <PhoneCall className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-tight text-slate-900">Get a call from a recruiter</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-600">Apply to any role and a recruiter phones you within {PAID_CALL_WORKING_DAYS} working days, match or not</span>
              </span>
              <span className="shrink-0 text-right text-[13.5px] font-extrabold text-slate-900">₹{PAID_CALL_RUPEES}</span>
            </TrackedLink>
          </li>
        </ul>

        <TrackedLink
          href={EDGE}
          from="home"
          track="hero-button"
          className="group mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500"
        >
          Explore StaffAnchor Edge <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </TrackedLink>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11.5px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Pay online, no account needed</span>
          <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5 text-emerald-600" /> Pick your own time</span>
        </p>
      </div>
    </div>
  );
}
