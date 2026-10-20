import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Check, ChevronDown, CreditCard, FileText, Mic, Compass, Sparkles, Video, Clock, Target, Users, TrendingUp } from "lucide-react";
import Reveal from "@/components/home/reveal";
import StickyCta from "@/components/edge/sticky-cta";
import { CRM } from "@/lib/pro-sessions";

// The one StaffAnchor Edge page. staffanchor.com/edge sends visitors here.
export const metadata: Metadata = {
  title: "StaffAnchor Edge | Mock Interview, Job Search Strategy and Resume Rebuild",
  description:
    "1:1 video sessions with Gagan Sharma, founder of StaffAnchor, for sales and leadership professionals: a full mock interview, a job search strategy with a resume rebuild, and resume writing.",
  alternates: { canonical: "https://jobs.staffanchor.com/edge" },
};

const BOOK = "/edge/book";

// A source tag in the link (for example ?src=linkedin_profile) is carried to the booking pages, so each booking
// records where the visitor came from. Anything else falls back to jobs_site.
const cleanSrc = (raw: string | undefined) => (raw && /^[a-z0-9_-]{1,40}$/i.test(raw) ? raw : "jobs_site");

// The earliest open time for a session, read live from the calendar (through the CRM). Hidden if it can't be read.
async function nextOpenSlot(): Promise<string | null> {
  try {
    const res = await fetch(`${CRM}/api/pro/slots?service=mock-interview`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const j = (await res.json()) as { ok?: boolean; days?: Record<string, string[]> };
    if (!j.ok || !j.days) return null;
    const first = Object.keys(j.days).sort()[0];
    return first ? j.days[first][0] ?? null : null;
  } catch {
    return null;
  }
}
const slotLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

const DISPLAY = "font-(family-name:--font-poppins)";
const SERIF = "font-(family-name:--font-fraunces)";
const EYEBROW = "inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700";

const SESSIONS = [
  {
    id: "mock-interview",
    icon: Mic,
    title: "Mock interview",
    sub: "Sales and Leadership Role",
    tagline: "A real interview, then the feedback nobody gives you.",
    meta: "60 mins · Video meeting",
    price: "₹1,899",
    points: [
      "A full interview loop for the role you're targeting: discovery on your numbers, a scenario on team or pipeline management, and the tough questions on gaps and attrition.",
      "A plain debrief on exactly where you'd have been screened out, and how to fix it.",
      "Bring a specific role or JD if you have one.",
    ],
  },
  {
    id: "job-search-strategy",
    icon: Compass,
    title: "Job Search Strategy + Resume Rebuild",
    sub: "",
    tagline: "Fix the resume. Then fix how you're using it.",
    meta: "45 mins · Video meeting",
    price: "₹1,999",
    popular: true,
    points: [
      "Your resume reworked line by line, so it shows numbers, scale, ownership and the levers behind the result.",
      "A sharper LinkedIn headline and About section.",
      "A map of where your next role actually comes from: which companies, which route in, what to say.",
      "Send your resume 24 hours before, so the call is spent on strategy and not on reading.",
    ],
  },
];

const GUIDE = [
  { when: "I have an interview coming up", then: "Mock interview", href: "#mock-interview" },
  { when: "I'm not getting shortlisted or called", then: "Job Search Strategy + Resume Rebuild", href: "#job-search-strategy" },
  { when: "I just want a great resume, written for me", then: "Resume Writing", href: "#resume-writing" },
];

const LOOP = [
  { n: "1", title: "Discovery on your numbers", text: "Quota, attainment, deal sizes, pipeline: the questions a sharp hiring manager opens with." },
  { n: "2", title: "A team or pipeline scenario", text: "A realistic situation to handle live, as you would in the final round." },
  { n: "3", title: "The tough questions", text: "Gaps, attrition, missed targets: the ones most candidates dodge." },
  { n: "4", title: "The debrief", text: "Exactly where you'd have been screened out, and how to fix it." },
];

const STEPS = [
  { icon: CalendarCheck, title: "Pick a time", text: "Choose a day and slot that suits you. Times are in India Standard Time." },
  { icon: CreditCard, title: "Pay securely", text: "Pay online with Razorpay. Your slot is held while you pay." },
  { icon: Video, title: "Get your invite", text: "A calendar invite with the Google Meet link lands in your inbox right away." },
];

const FAQ = [
  { q: "Do I need to create an account?", a: "No. A name, email and mobile number is all we need to book." },
  { q: "How do I join the session?", a: "Right after you pay, you get a Google Calendar invite with the Meet link, and a confirmation email from StaffAnchor with what to prepare." },
  { q: "What should I prepare?", a: "For the mock interview, bring the role or job description you're targeting. For the strategy session, send your resume at least 24 hours before." },
  { q: "Can I reschedule?", a: "Yes. Reply to your confirmation email and we'll move it." },
  { q: "Do prices include GST? Can I get an invoice?", a: "Yes, prices include GST. A tax invoice is generated for every payment. Reply to your confirmation email and we'll send it to you." },
  { q: "Are the sessions only for sales professionals?", a: "They're built for sales and revenue professionals, from BDRs to leaders. If you're in another field you can still book, but the interview scenarios and examples are sales-focused." },
  { q: "What's the difference between the strategy session and Resume Writing?", a: "In the 45-minute session we work through your resume together and plan your search, live on a call. Resume Writing is done for you: you fill in a short form and receive a finished resume as Word and PDF." },
];

export default async function EdgePage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const src = cleanSrc((await searchParams).src);
  const next = await nextOpenSlot();
  const book = (id: string) => `${BOOK}/${id}?src=${src}`;

  return (
    <main className="overflow-x-clip bg-white text-[#12131A]">
      {/* ───────── Hero ───────── */}
      <section className="relative isolate">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_10%,rgba(99,102,241,0.18),transparent_70%),radial-gradient(50%_50%_at_5%_40%,rgba(139,92,246,0.10),transparent_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
          <div>
            <span className={EYEBROW}><Sparkles className="h-3.5 w-3.5" /> StaffAnchor Edge</span>
            <h1 className={`${DISPLAY} mt-5 text-[40px] font-light leading-[1.05] tracking-tight sm:text-6xl`}>
              Your <span className={`${SERIF} font-medium italic text-indigo-600`}>edge</span> in sales hiring.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              1:1 video sessions with Gagan Sharma, who has built and led sales teams for 15+ years. Practise a real interview, rebuild your resume, and get a plan for where your next role really comes from.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#sessions" className="group inline-flex items-center rounded-xl bg-[#12131A] px-7 py-4 text-[15px] font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-indigo-600">
                Book a session <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#free-tools" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-[15px] font-semibold text-slate-800 transition hover:border-slate-900">
                Try a free tool first
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["No account needed", "Pay securely online", "Calendar invite with Meet link"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-transparent blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-200">
              <Image src="/gagan-sharma.jpg" alt="Gagan Sharma, Founder of StaffAnchor" width={800} height={800} priority className="aspect-[4/4.4] w-full rounded-[1.5rem] object-cover object-top" />
            </div>
            <div className="absolute -left-4 top-8 hidden rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <p className="text-2xl font-semibold leading-none">15+</p>
              <p className="mt-1 text-xs text-slate-500">years leading sales teams</p>
            </div>
            {next && (
              <div className="absolute -bottom-5 left-1/2 w-[88%] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                  Next open slot
                </p>
                <p className="mt-0.5 text-[15px] font-semibold">{slotLabel(next)} IST</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Who is behind it ───────── */}
      <section className="border-y border-slate-100 bg-[#F7F7F4]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 md:grid-cols-4">
          {[
            { icon: Clock, v: "15+ years", l: "scaling sales teams and revenue" },
            { icon: Users, v: "400+", l: "people in the largest teams built and led" },
            { icon: TrendingUp, v: "₹100–150 Cr+", l: "in revenues managed" },
            { icon: Target, v: "Sales & revenue", l: "roles are all we work on" },
          ].map((s) => (
            <div key={s.l} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"><s.icon className="h-4.5 w-4.5" /></span>
              <div>
                <p className={`${DISPLAY} text-lg font-semibold leading-tight`}>{s.v}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Sessions ───────── */}
      <section id="sessions" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className={EYEBROW}>Pick your session</span>
            <h2 className={`${DISPLAY} mt-4 max-w-2xl text-3xl font-light leading-tight tracking-tight sm:text-5xl`}>Three ways to sharpen your edge.</h2>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Not sure where to start?</p>
              <div className="grid gap-1 md:grid-cols-3">
                {GUIDE.map((g) => (
                  <a key={g.then} href={g.href} className="group rounded-xl px-4 py-3 transition hover:bg-indigo-50">
                    <p className="text-[15px] font-medium text-slate-900">{g.when}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-indigo-700">{g.then} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></p>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {SESSIONS.map((s, i) => (
              <Reveal key={s.id} delay={i * 90}>
                <div id={s.id} className={`relative flex h-full scroll-mt-24 flex-col rounded-3xl bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/10 ${s.popular ? "border-2 border-indigo-500 shadow-xl shadow-indigo-900/10" : "border border-slate-200 shadow-sm"}`}>
                  {s.popular && <span className="absolute -top-3 left-7 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md">Most popular</span>}
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><s.icon className="h-6 w-6" /></span>
                  <p className="mt-5 text-xs font-medium text-slate-500">{s.meta}</p>
                  <h3 className={`${DISPLAY} mt-1 text-[22px] font-semibold leading-snug tracking-tight`}>{s.title}{s.sub ? <span className="block text-base font-medium text-slate-500">{s.sub}</span> : null}</h3>
                  <p className="mt-3 font-medium text-slate-900">{s.tagline}</p>
                  <ul className="mt-4 flex-1 space-y-2.5 text-[14.5px] leading-relaxed text-slate-600">
                    {s.points.map((p) => (
                      <li key={p} className="flex gap-2.5"><BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-indigo-500" /> <span>{p}</span></li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    <div>
                      <p className={`${DISPLAY} text-2xl font-semibold`}>{s.price}</p>
                      <p className="text-xs text-slate-500">incl. GST</p>
                    </div>
                    <Link href={book(s.id)} className="group inline-flex items-center whitespace-nowrap rounded-xl bg-[#12131A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600">
                      Book this session <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={180}>
              <div id="resume-writing" className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileText className="h-6 w-6" /></span>
                <p className="mt-5 text-xs font-medium text-slate-500">Delivered in Word and PDF</p>
                <h3 className={`${DISPLAY} mt-1 text-[22px] font-semibold leading-snug tracking-tight`}>Resume Writing</h3>
                <p className="mt-3 font-medium text-slate-900">Written for you by StaffAnchor, ready for applicant tracking systems.</p>
                <ul className="mt-4 flex-1 space-y-2.5 text-[14.5px] leading-relaxed text-slate-600">
                  {["Priced by experience level: 0-5, 6-12 and 13+ years.", "ATS-friendly structure with role-specific keywords and impact-led bullet points.", "Revision round included."].map((p) => (
                    <li key={p} className="flex gap-2.5"><BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-indigo-500" /> <span>{p}</span></li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <div>
                    <p className={`${DISPLAY} text-2xl font-semibold`}>From ₹1,199</p>
                    <p className="text-xs text-slate-500">incl. GST</p>
                  </div>
                  <Link href="/resume-writing?src=edge_page" className="group inline-flex items-center whitespace-nowrap rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900">
                    See resume writing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Inside the mock interview ───────── */}
      <section className="bg-[#12131A] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">Inside the mock interview</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light leading-tight tracking-tight sm:text-5xl`}>Not a chat. A <span className={`${SERIF} font-medium italic text-indigo-300`}>real</span> interview loop.</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">You get the questions a hiring manager would actually ask for the role you want, then the honest verdict most candidates never hear.</p>
            <a href={`${BOOK}/mock-interview?src=${src}`} className="group mt-8 inline-flex items-center rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-[#12131A] transition hover:bg-indigo-100">
              Book the mock interview <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Reveal>
          <Reveal delay={100}>
            <ol className="relative space-y-4 border-l border-white/15 pl-8">
              {LOOP.map((l) => (
                <li key={l.n} className="relative rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                  <span className="absolute -left-[2.85rem] top-5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold ring-4 ring-[#12131A]">{l.n}</span>
                  <p className={`${DISPLAY} text-lg font-semibold`}>{l.title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-slate-300">{l.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>How it works</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-5xl`}>Booked in under two minutes.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <span className="absolute right-6 top-5 text-5xl font-semibold text-slate-100">{i + 1}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><s.icon className="h-6 w-6" /></span>
                  <h3 className={`${DISPLAY} mt-5 text-xl font-semibold`}>{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Free tools ───────── */}
      <section id="free-tools" className="scroll-mt-20 bg-[#F7F7F4] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Free · no sign-up needed</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-5xl`}>Start with a free tool.</h2>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">Warm up before you book a session. Both tools are free and open to anyone.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              { href: "/mock-interview", title: "AI Mock Interview", text: "Answer real discovery, objection-handling, pitching and closing questions, and get instant, specific feedback before your next interview.", cta: "Start practising", icon: Mic },
              { href: "/ats-score", title: "ATS Score Checker", text: "Upload your resume to see how it scores for ATS-parsability and keyword match, against a specific job description or general best practices.", cta: "Check my score", icon: FileText },
            ].map((t, i) => (
              <Reveal key={t.title} delay={i * 90}>
                <Link href={t.href} className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-slate-900 hover:shadow-xl">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><t.icon className="h-6 w-6" /></span>
                  <h3 className={`${DISPLAY} mt-5 text-2xl font-semibold`}>{t.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{t.text}</p>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-700">{t.cta} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── About Gagan ───────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-[2rem] ring-1 ring-slate-200">
              <Image src="/gagan-sharma.jpg" alt="Gagan Sharma, Founder of StaffAnchor" width={800} height={800} className="aspect-square w-full object-cover object-top" />
            </div>
          </Reveal>
          <Reveal delay={90}>
            <span className={EYEBROW}>Your coach</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-4xl`}>Gagan Sharma</h2>
            <p className="mt-1 font-medium text-indigo-700">Building StaffAnchor | Empowering Revenue Professionals with the Right Opportunities</p>
            <p className="mt-5 leading-relaxed text-slate-600">With 15+ years of experience in scaling high-performing sales teams and driving revenue growth, I have built and led regional and national teams of 400+ across EdTech, AgriTech, Recruitment, and Matrimonial services.</p>
            <p className="mt-3 leading-relaxed text-slate-600">Managing revenues of ₹100 Cr to ₹150 Cr+, my expertise lies in optimizing sales funnels, improving conversions, and building structured, data-driven sales engines that drive sustainable business growth.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["EdTech", "AgriTech", "Recruitment", "Matrimonial"].map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="bg-[#F7F7F4] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <span className={EYEBROW}>Questions</span>
            <h2 className={`${DISPLAY} mt-4 text-3xl font-light tracking-tight sm:text-4xl`}>Good to know before you book.</h2>
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
          <h2 className={`${DISPLAY} mx-auto max-w-2xl text-3xl font-light leading-tight tracking-tight sm:text-5xl`}>Ready to sharpen your <span className={`${SERIF} font-medium italic text-indigo-300`}>edge</span>?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">Pick a time that suits you. You will have your invite in minutes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`${BOOK}/job-search-strategy?src=${src}`} className="group inline-flex items-center rounded-xl bg-white px-7 py-4 text-[15px] font-semibold text-[#12131A] transition hover:bg-indigo-100">
              Book strategy + resume <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href={`${BOOK}/mock-interview?src=${src}`} className="inline-flex items-center rounded-xl border border-white/30 px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white/10">
              Book a mock interview
            </a>
          </div>
        </Reveal>
      </section>

      <StickyCta />
    </main>
  );
}
