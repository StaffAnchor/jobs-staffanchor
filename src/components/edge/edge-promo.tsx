import { ArrowRight, ChevronRight, FileText, Mic, PhoneCall, UserCheck } from "lucide-react";
import TrackedLink from "@/components/edge/tracked-link";
import { PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";
import { COMBO_FROM_RUPEES, MOCK_INTERVIEW_FROM, RESUME_FROM_RUPEES, inr } from "@/lib/edge-prices";

// Promotions for StaffAnchor Edge and the recruiter call, placed around the site. Each link records where it was clicked
// (flow "promo", the `page` name plus the service) so the CRM can show which placement brings paying leads.
//   job         on a job page: practise the interview for this role
//   job-top     a one-line teaser high on a job page (phones), so it is seen without scrolling
//   after-apply right after someone applies: prepare while they wait
//   strip       a band for list, city and tool pages: all three services
//   practice    after a free AI practice or score: the real thing with a sales leader
//   footer      one slim line at the bottom of every public page
//   profile-review  for someone who has built or is building a profile: have it reviewed live with Gagan
type Variant = "job" | "job-top" | "after-apply" | "strip" | "practice" | "footer" | "profile-review";

const MOCK = "/edge/book/mock-interview";

export default function EdgePromo({ variant, page, roleTitle, className = "" }: { variant: Variant; page: string; roleTitle?: string | null; className?: string }) {
  const src = `src=${page.replace(/[^a-z0-9_-]/gi, "_")}`;
  const link = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition";
  const primary = `${link} bg-indigo-600 text-white shadow-sm hover:bg-indigo-500`;
  const quiet = "text-[13px] font-semibold text-indigo-700 underline-offset-4 hover:underline";

  if (variant === "profile-review") {
    return (
      <section className={`rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm ${className}`}>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700"><UserCheck className="h-3.5 w-3.5" /> StaffAnchor Edge</p>
        <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-slate-900">Want your profile reviewed live?</p>
        <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600">
          A 1:1 video session with Gagan Sharma, who has built and led sales teams for 15+ years. He goes through your profile and resume with you, shows where you would be screened out, and plans where your next role comes from. Your resume is rewritten for you as part of it.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <TrackedLink href={`/edge/book/job-search-strategy?${src}`} from="promo" track={`${page}-profile-review`} className={primary}>
            <UserCheck className="h-4 w-4" /> Book a live profile review · from {inr(COMBO_FROM_RUPEES)}
          </TrackedLink>
          <TrackedLink href={`${MOCK}?${src}`} from="promo" track={`${page}-mock-interview`} className={quiet}>Interview prep {MOCK_INTERVIEW_FROM}</TrackedLink>
          <TrackedLink href={`/edge?${src}`} from="promo" track={`${page}-explore`} className={quiet}>All Edge services</TrackedLink>
        </div>
      </section>
    );
  }

  if (variant === "job-top") {
    return (
      <TrackedLink
        href={`${MOCK}?${src}`}
        from="promo"
        track={`${page}-mock-interview`}
        className={`group flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-3 transition hover:border-indigo-400 ${className}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Mic className="h-4.5 w-4.5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold leading-tight text-slate-900">Interview coming up?</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-600">Practise it with Gagan Sharma, 60 or 90 mins · {MOCK_INTERVIEW_FROM}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-indigo-600 transition-transform group-hover:translate-x-0.5" />
      </TrackedLink>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`border-t border-slate-200 bg-white ${className}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-[13px] sm:px-6 lg:px-8">
          <p className="text-slate-600">
            <b className="font-bold text-slate-900">StaffAnchor Edge</b> · interview prep {MOCK_INTERVIEW_FROM} · resume writing from {inr(RESUME_FROM_RUPEES)} · recruiter call {inr(PAID_CALL_RUPEES)}
          </p>
          <TrackedLink href={`/edge?${src}`} from="promo" track={`${page}-explore`} className="group inline-flex items-center gap-1.5 py-1 font-bold text-indigo-700 hover:underline">
            Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </TrackedLink>
        </div>
      </div>
    );
  }

  if (variant === "strip") {
    return (
      <section className={`overflow-hidden rounded-3xl bg-gradient-to-br from-[#12131A] to-[#2a2d6b] p-6 text-white shadow-lg sm:p-8 ${className}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">StaffAnchor Edge · 1:1 with Gagan Sharma</p>
        <h2 className="mt-2 font-(family-name:--font-space-grotesk) text-2xl font-black leading-tight tracking-tight sm:text-3xl">Get an edge in your next sales interview</h2>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-indigo-100/90">Practise with someone who has built and led sales teams for 15+ years, get a resume written for you, or have a recruiter call you about your profile.</p>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {[
            { icon: Mic, t: "Interview prep + mock interview", p: MOCK_INTERVIEW_FROM, href: `${MOCK}?${src}`, k: `${page}-mock-interview` },
            { icon: FileText, t: "Resume writing", p: `from ${inr(RESUME_FROM_RUPEES)}`, href: `/resume-writing?${src}`, k: `${page}-resume` },
            { icon: PhoneCall, t: "Recruiter call", p: inr(PAID_CALL_RUPEES), href: `/jobs?${src}`, k: `${page}-recruiter-call` },
          ].map((s) => (
            <TrackedLink key={s.k} href={s.href} from="promo" track={s.k} className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 transition hover:bg-white/15">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><s.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 text-[13.5px] font-bold leading-tight">{s.t}</span>
              <span className="shrink-0 text-[13px] font-extrabold">{s.p}</span>
            </TrackedLink>
          ))}
        </div>
        <TrackedLink href={`/edge?${src}`} from="promo" track={`${page}-explore`} className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#12131A] transition hover:bg-indigo-100">
          Explore StaffAnchor Edge <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </TrackedLink>
        <p className="mt-3 text-[12px] text-indigo-200/80">Pay online, no account needed. A recruiter call is a profile discussion within {PAID_CALL_WORKING_DAYS} working days, refunded if we miss it.</p>
      </section>
    );
  }

  if (variant === "practice") {
    return (
      <section className={`rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 ${className}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">StaffAnchor Edge</p>
        <p className="mt-1 text-[16px] font-extrabold leading-snug text-slate-900">That was practice with AI. Want the real thing?</p>
        <p className="mt-1 text-[13.5px] leading-6 text-slate-600">A 60 or 90-minute mock interview with Gagan Sharma, who has built and led sales teams for 15+ years, then an honest debrief on where you would be screened out and how to fix it.</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <TrackedLink href={`${MOCK}?${src}`} from="promo" track={`${page}-mock-interview`} className={primary}>Book interview prep · {MOCK_INTERVIEW_FROM}</TrackedLink>
          <TrackedLink href={`/resume-writing?${src}`} from="promo" track={`${page}-resume`} className={quiet}>Resume writing from {inr(RESUME_FROM_RUPEES)}</TrackedLink>
        </div>
      </section>
    );
  }

  const role = roleTitle?.trim();
  const after = variant === "after-apply";
  return (
    <section className={`rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">StaffAnchor Edge</p>
      <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-slate-900">
        {after ? "While you wait, get ready for the interview." : role ? `Interviewing for ${role}? Practise it first.` : "Interviewing for a sales role? Practise it first."}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600">
        A 60 or 90-minute mock interview with Gagan Sharma, who has built and led sales teams for 15+ years, then a plain debrief on where you would be screened out and how to fix it.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <TrackedLink href={`${MOCK}?${src}`} from="promo" track={`${page}-mock-interview`} className={primary}>
          <Mic className="h-4 w-4" /> Book interview prep · {MOCK_INTERVIEW_FROM}
        </TrackedLink>
        <TrackedLink href={`/resume-writing?${src}`} from="promo" track={`${page}-resume`} className={quiet}>Resume writing from {inr(RESUME_FROM_RUPEES)}</TrackedLink>
        <TrackedLink href={`/edge?${src}`} from="promo" track={`${page}-explore`} className={quiet}>All Edge services</TrackedLink>
      </div>
    </section>
  );
}
