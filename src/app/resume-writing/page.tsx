import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown, FileText, LayoutGrid, Search, ShieldCheck, TrendingUp, ClipboardList, PenLine, Send, RefreshCw, Sparkles, Check } from "lucide-react";
import Reveal from "@/components/home/reveal";
import StickyCta from "@/components/edge/sticky-cta";
import TierTabs, { type Tier } from "@/components/resume/tier-tabs";

export const metadata: Metadata = {
  title: "Resume Writing for Sales Professionals | StaffAnchor",
  description:
    "A professionally written, ATS-friendly resume delivered as Word and PDF, priced by your years of experience. First draft within 3 working days of your details.",
  alternates: { canonical: "https://jobs.staffanchor.com/resume-writing" },
};

// A source tag in the link (for example ?src=linkedin_profile) is carried to the order page. Anything else falls back.
const cleanSrc = (raw: string | undefined) => (raw && /^[a-z0-9_-]{1,40}$/i.test(raw) ? raw : "resume_page");

const DISPLAY = "font-(family-name:--font-poppins)";
const SERIF = "font-(family-name:--font-fraunces)";
const EYEBROW = "inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700";

const TIERS: Tier[] = [
  {
    key: "early",
    label: "Early Stage",
    band: "0-5 years",
    price: "₹1,199",
    headline: "Your first impression starts with your resume.",
    sub: "Whether you're a fresher or a few years in, your resume needs to communicate potential with clarity and confidence.",
    revisions: "1 revision round",
    finalDelivery: "about 5 working days",
    included: ["ATS-optimised structure", "Role-specific keyword research", "Impact-driven bullet points", "Professional visual design", "Strong positioning for entry-level roles", "Word + PDF delivery"],
  },
  {
    key: "mid",
    label: "Mid Level",
    band: "6-12 years",
    price: "₹1,799",
    headline: "Mid-career deserves mid-career positioning.",
    sub: "Your resume must go beyond listing roles and present leadership, ownership, and measurable business impact.",
    revisions: "1 revision round",
    finalDelivery: "about 5 working days",
    included: ["ATS-optimised structure", "Quantified impact bullet points", "Leadership and ownership language", "Domain keyword research (Naukri, LinkedIn)", "Professional visual layout", "LinkedIn profile summary included", "Word + PDF delivery"],
  },
  {
    key: "senior",
    label: "Senior / CXO",
    band: "13+ years",
    price: "₹2,499",
    headline: "Executive presence starts on the page.",
    sub: "Senior professionals need an executive narrative that communicates strategic leadership, scale, and transformation.",
    revisions: "2 revision rounds",
    finalDelivery: "about 7 working days",
    included: ["Executive career narrative and positioning", "C-suite and leadership language", "P&L and business transformation framing", "ATS-optimised with executive keywords", "Strategic accomplishments highlighted", "Premium visual design layout", "Cover letter included", "Word + PDF delivery"],
  },
];

const STEPS = [
  { icon: ClipboardList, title: "Share your profile", text: "Fill in a short form about your career in about 15 minutes, and attach your current resume." },
  { icon: PenLine, title: "We write your first draft", text: "Built around your target role, with your achievements turned into numbers a hiring manager notices." },
  { icon: Send, title: "First draft in 3 working days", text: "Counted from the day we receive your form. Working days are Monday to Saturday." },
  { icon: RefreshCw, title: "Review and finalise", text: "Share your feedback and use the revision rounds included in your plan." },
];

const DELIVERABLES = [
  { icon: ShieldCheck, title: "ATS-optimised by design", text: "Built with recruiter and applicant tracking system readability in mind, from the first line." },
  { icon: Search, title: "Keyword research", text: "Role-aligned keywords mapped to your target job and domain." },
  { icon: TrendingUp, title: "Impact-first bullet points", text: "Your experience reframed around outcomes, metrics and business value." },
  { icon: LayoutGrid, title: "Professional layout", text: "Clean, modern formatting that looks strong on screen and in print." },
  { icon: FileText, title: "Word and PDF", text: "An editable file and a share-ready file, for immediate applications." },
  { icon: RefreshCw, title: "Revisions included", text: "One round on the Early Stage and Mid Level plans, two on Senior / CXO." },
];

const FAQ = [
  { q: "How is the price decided?", a: "By your years of experience only: ₹1,199 for 0-5 years, ₹1,799 for 6-12 years and ₹2,499 for 13 or more. All prices include GST." },
  { q: "What format will I receive my resume in?", a: "You receive your final resume in both editable Word and print-ready PDF formats." },
  { q: "How many revision rounds are included?", a: "Early Stage and Mid Level plans include 1 revision round. Senior / CXO includes 2 revision rounds." },
  { q: "When does the 3-day delivery clock start?", a: "The 3 working day timeline starts once we receive your completed details form. Working days are Monday to Saturday." },
  { q: "Is the resume ATS-compatible?", a: "Yes. Every resume is structured with clean formatting and role-specific keywords for strong ATS compatibility." },
  { q: "How many versions do I receive?", a: "One high-quality final resume, refined through your included revision rounds until it is submission ready." },
  { q: "Can I get a GST invoice?", a: "Yes. A tax invoice is generated for every payment. Reply to your confirmation email and we'll send it to you." },
  { q: "Do I need an account?", a: "No. A name, email and mobile number is all we need to place an order." },
];

export default async function ResumeWritingPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const src = cleanSrc((await searchParams).src);
  const order = `/resume/order?src=${src}`;

  return (
    <main className="overflow-x-clip bg-white text-[#12131A]">
      {/* ───────── Hero ───────── */}
      <section className="relative isolate">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_10%,rgba(99,102,241,0.18),transparent_70%),radial-gradient(50%_50%_at_5%_40%,rgba(139,92,246,0.10),transparent_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
          <div>
            <span className={EYEBROW}><Sparkles className="h-3.5 w-3.5" /> Resume Writing</span>
            <h1 className={`${DISPLAY} mt-5 text-[40px] font-light leading-[1.05] tracking-tight sm:text-6xl`}>
              A resume that gets you into the <span className={`${SERIF} font-medium italic text-indigo-600`}>interview room</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Professionally written, ATS-friendly and built around your achievements. Delivered as Word and PDF, with your first draft in 3 working days.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={order} className="group inline-flex items-center rounded-xl bg-[#12131A] px-7 py-4 text-[15px] font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-indigo-600">
                Order my resume <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/edge/book/job-search-strategy?src=resume_page" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-[15px] font-semibold text-slate-800 transition hover:border-slate-900">
                Add a strategy session, save 20%
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["From ₹1,199, GST included", "Word and PDF", "No account needed"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t}</li>
              ))}
            </ul>
          </div>

          {/* An illustrative layout, not a real candidate. */}
          <div className="relative mx-auto w-full max-w-sm">
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-transparent blur-2xl" />
            <div className="rotate-[1.5deg] rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-indigo-900/10">
              <div className="h-4 w-1/2 rounded bg-[#12131A]" />
              <div className="mt-2 h-2.5 w-1/3 rounded bg-indigo-400" />
              <div className="mt-6 space-y-2">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-11/12 rounded bg-slate-200" />
              </div>
              <div className="mt-6 h-2.5 w-1/4 rounded bg-slate-400" />
              <div className="mt-3 space-y-2.5">
                {[["w-5/6", "w-12"], ["w-4/5", "w-14"], ["w-11/12", "w-10"]].map(([a, b], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span className={`h-2 ${a} rounded bg-slate-200`} />
                    <span className={`h-2 ${b} shrink-0 rounded bg-indigo-200`} />
                  </div>
                ))}
              </div>
              <div className="mt-6 h-2.5 w-1/4 rounded bg-slate-400" />
              <div className="mt-3 space-y-2.5">
                <div className="h-2 w-full rounded bg-slate-200" />
                <div className="h-2 w-10/12 rounded bg-slate-200" />
                <div className="h-2 w-9/12 rounded bg-slate-200" />
              </div>
              <div className="mt-6 flex gap-2">
                {["ATS-ready", "Word + PDF"].map((t) => (
                  <span key={t} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{t}</span>
                ))}
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">Illustrative layout</p>
          </div>
        </div>
      </section>

      {/* ───────── Plans ───────── */}
      <section id="plans" className="scroll-mt-20 bg-[#F7F7F4] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>Priced by experience</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-5xl`}>Choose your career stage.</h2>
            <p className="mt-3 text-lg text-slate-600">See exactly what you get.</p>
          </Reveal>
          <Reveal delay={80} className="mt-10">
            <TierTabs tiers={TIERS} orderHref={order} />
          </Reveal>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>How it works</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-5xl`}>From profile to polished in 3 working days.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <span className="absolute right-6 top-5 text-5xl font-semibold text-slate-100">{i + 1}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><s.icon className="h-6 w-6" /></span>
                  <h3 className={`${DISPLAY} mt-5 text-lg font-semibold leading-snug`}>{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── What's in every resume ───────── */}
      <section className="bg-[#12131A] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">In every resume</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-5xl`}>One resume. Done <span className={`${SERIF} font-medium italic text-indigo-300`}>right</span>, the first time.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DELIVERABLES.map((d, i) => (
              <Reveal key={d.title} delay={i * 60}>
                <div className="h-full rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200"><d.icon className="h-5 w-5" /></span>
                  <h3 className={`${DISPLAY} mt-4 text-lg font-semibold`}>{d.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-300">{d.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Timelines ───────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>Timelines</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-4xl`}>Clear timelines, no surprises.</h2>
          </Reveal>
          <Reveal delay={80} className="mt-10">
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["Career stage", "First draft", "Revision rounds", "Final delivery", "Format", "Price (incl. GST)"].map((h) => (
                      <th key={h} className="px-5 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((t) => (
                    <tr key={t.key} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{t.label} <span className="text-slate-400">({t.band})</span></td>
                      <td className="px-5 py-4">3 working days</td>
                      <td className="px-5 py-4">{t.revisions.split(" ")[0]}</td>
                      <td className="px-5 py-4">{t.finalDelivery}</td>
                      <td className="px-5 py-4">Word + PDF</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{t.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">Working days are Monday to Saturday. The 3-day clock starts when we receive your completed details form.</p>
          </Reveal>
        </div>
      </section>

      {/* ───────── Talk first ───────── */}
      <section className="bg-[#F7F7F4] px-4 py-16 sm:px-6">
        <Reveal>
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
            <div>
              <h2 className={`${DISPLAY} text-2xl font-semibold tracking-tight`}>Add a strategy session and save 20%</h2>
              <p className="mt-2 max-w-xl text-slate-600">Take Resume Writing together with a 45-minute 1:1 strategy session with Gagan (₹999), where he maps where your next role comes from. The combo takes 20% off the total.</p>
            </div>
            <Link href="/edge/book/job-search-strategy?src=resume_page" className="group inline-flex shrink-0 items-center whitespace-nowrap rounded-xl border border-slate-300 px-6 py-3.5 text-[15px] font-semibold transition hover:border-slate-900">
              Book the combo · from ₹1,758 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>Questions</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-4xl`}>Good to know before you order.</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-6 py-4 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">Anything else? Write to <a className="font-medium text-indigo-700 underline" href="mailto:info@staffanchor.com">info@staffanchor.com</a>.</p>
        </div>
      </section>

      {/* ───────── Final call ───────── */}
      <section className="relative isolate overflow-hidden bg-[#12131A] px-4 py-20 text-center text-white sm:px-6">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(99,102,241,0.35),transparent_70%)]" />
        <Reveal>
          <h2 className={`${DISPLAY} mx-auto max-w-2xl text-3xl font-light leading-tight tracking-tight sm:text-5xl`}>Ready for a resume that <span className={`${SERIF} font-medium italic text-indigo-300`}>works</span>?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">Order in two minutes. Your first draft arrives within 3 working days of your details.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={order} className="group inline-flex items-center rounded-xl bg-white px-7 py-4 text-[15px] font-semibold text-[#12131A] transition hover:bg-indigo-100">
              Order my resume <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/edge" className="inline-flex items-center rounded-xl border border-white/30 px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white/10">
              See all StaffAnchor Edge sessions
            </Link>
          </div>
        </Reveal>
      </section>

      <StickyCta href="#plans" label="Order my resume" />
    </main>
  );
}
