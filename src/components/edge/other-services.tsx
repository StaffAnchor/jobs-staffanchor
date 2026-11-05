import { ArrowRight, Compass, FileText, Mic, PhoneCall } from "lucide-react";
import TrackedLink from "@/components/edge/tracked-link";
import { PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";
import { COMBO_FROM_RUPEES, MOCK_INTERVIEW_FROM, RESUME_FROM_RUPEES, inr } from "@/lib/edge-prices";

// On a booking page: the other StaffAnchor Edge services, so someone who arrived for one can see what else is there.
// Placed below the booking area so it never gets between a visitor and paying. Clicks are recorded as "booking-page".
const ALL = [
  { slug: "mock-interview", what: "mock-interview", icon: Mic, title: "Interview Prep + Mock Interview", line: "60 or 90 mins with Gagan Sharma: a real interview loop, then the honest debrief.", price: MOCK_INTERVIEW_FROM, href: "/edge/book/mock-interview" },
  { slug: "job-search-strategy", what: "strategy", icon: Compass, title: "Job Strategy + Resume Rebuild", line: "A 45-minute strategy session plus your resume written for you. 20% off the two.", price: `from ${inr(COMBO_FROM_RUPEES)}`, href: "/edge/book/job-search-strategy" },
  { slug: "resume-writing", what: "resume", icon: FileText, title: "Resume Writing", line: "Written for you by experience level, ATS-friendly, in Word and PDF.", price: `from ${inr(RESUME_FROM_RUPEES)}`, href: "/resume-writing" },
  { slug: "recruiter-call", what: "recruiter-call", icon: PhoneCall, title: "Apply + Recruiter call", line: `Apply to any role and a recruiter phones you within ${PAID_CALL_WORKING_DAYS} working days.`, price: inr(PAID_CALL_RUPEES), href: "/jobs" },
];

export default function OtherServices({ current, className = "" }: { current: string; className?: string }) {
  const others = ALL.filter((s) => s.slug !== current);
  return (
    <section className={className}>
      <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">Also with StaffAnchor Edge</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {others.map((s) => (
          <TrackedLink
            key={s.slug}
            href={`${s.href}?src=booking-page`}
            from="promo"
            track={`booking-page-${s.what}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><s.icon className="h-4.5 w-4.5" /></span>
              <span className="text-[13.5px] font-extrabold text-slate-900">{s.price}</span>
            </span>
            <span className="mt-3 text-[14.5px] font-bold leading-tight text-slate-900">{s.title}</span>
            <span className="mt-1 flex-1 text-[12.5px] leading-snug text-slate-600">{s.line}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-indigo-700">
              See details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </TrackedLink>
        ))}
      </div>
    </section>
  );
}
