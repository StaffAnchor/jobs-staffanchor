import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  FileCheck2,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import HeroSearch from "@/components/home/hero-search";
import HeroVisual from "@/components/home/hero-visual";
import OpenRolesCount from "@/components/home/open-roles-count";
import OpenRolesGrid from "@/components/home/open-roles-grid";
import Reveal from "@/components/home/reveal";

const audience = [
  { title: "BDRs and AEs", description: "Show quota history and selling approach in a format hiring teams actually read." },
  { title: "Sales managers and leaders", description: "Stay visible to serious opportunities without applying to dozens of unrelated jobs." },
  { title: "Early-career jobseekers", description: "Show internships, transferable skills and potential with a profile built for first roles." },
  { title: "Career switchers", description: "Map what you have achieved to the sales skills hiring teams look for." },
];

const SECTION_TITLE = "font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight md:text-4xl";

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-[#0A1630] pb-28 text-white md:pb-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_10%,rgba(76,123,255,0.35),transparent_60%),radial-gradient(40%_50%_at_0%_100%,rgba(16,185,129,0.14),transparent_60%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(70% 70% at 50% 30%, black, transparent)",
          }}
        />
        <div className="relative container-page grid gap-14 pt-14 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Sales careers, handled by specialists
            </div>
            <h1 className="mt-6 max-w-2xl font-(family-name:--font-space-grotesk) text-5xl font-black leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Find your next sales role. We do the{" "}
              <span className="font-(family-name:--font-fraunces) font-medium italic text-[#8FB0FF]">chasing.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/80 md:text-lg">
              Create a profile in about a minute, see roles ranked by how well they fit you, and follow every step of your application.
            </p>

            <div className="mt-9 max-w-xl">
              <HeroSearch />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition hover:bg-blue-50"
              >
                Create free profile
              </Link>
              <Link href="/candidate-login" className="text-sm font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline">
                Already registered? Sign in
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/80">
              {["Free for candidates", "Profile in about a minute", "Updates at every step"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ───────── Floating facts (real or process facts only) ───────── */}
      <section className="container-page relative z-10 -mt-14 md:-mt-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-[0_30px_70px_-35px_rgba(10,22,48,0.5)] md:grid-cols-4">
          {[
            { value: <OpenRolesCount />, label: "open roles right now" },
            { value: "1 min", label: "to create your profile" },
            { value: "Free", label: "always, for candidates" },
            { value: "Live", label: "status on every application" },
          ].map((s) => (
            <div key={s.label} className="bg-white px-6 py-7 text-center">
              <p className="font-(family-name:--font-space-grotesk) text-4xl font-black tracking-tight text-slate-950">{s.value}</p>
              <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Live roles ───────── */}
      <OpenRolesGrid />

      {/* ───────── How it works ───────── */}
      <section id="workflow" className="border-y border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-page py-16 md:py-24">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">How it works</p>
            <h2 className={`${SECTION_TITLE} mt-3 text-slate-950`}>Three steps. No black hole.</h2>
            <p className="mt-3 text-slate-600">From signing up to your first interview, you always know where you stand.</p>
          </Reveal>

          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block" />

            <Reveal>
              <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30">
                  <UserPlus className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold tracking-tight text-slate-950">Create your profile in a minute</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Upload your resume and pick from a few dropdowns. We read your resume to fill in what we can.</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Resume uploaded", "B2B Sales", "Delhi", "5–9 yrs"].map((c, i) => (
                    <span key={c} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {i === 0 && "✓ "}
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30">
                  <Target className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold tracking-tight text-slate-950">See roles ranked by fit</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Every role shows how well it matches you and why: specialisation, city, experience and pay band.</p>
                <div className="mt-6 space-y-3">
                  {[
                    ["Specialisation", 92],
                    ["City", 100],
                    ["Experience", 78],
                  ].map(([label, pct]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  <Activity className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold tracking-tight text-slate-950">Follow every step</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">From applied to interview to offer, your status updates live. No more silence after you apply.</p>
                <ol className="mt-6 space-y-3">
                  {[
                    ["Profile shared with the client", true],
                    ["Client shortlisted you", true],
                    ["Interview scheduled", false],
                  ].map(([t, done]) => (
                    <li key={t as string} className="flex items-center gap-3 text-[13px] font-medium text-slate-700">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-blue-600 text-white" : "border-2 border-blue-300 bg-white"}`}>
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Feature bento (dark) ───────── */}
      <section className="relative overflow-hidden bg-[#0A1630] text-white">
        <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative container-page py-16 md:py-24">
          <Reveal className="mb-12 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Built for candidates</p>
            <h2 className={`${SECTION_TITLE} mt-3`}>Everything a job search needs, in one place</h2>
            <p className="mt-3 text-blue-100/70">Clarity, speed and a fair shot, built around what candidates actually ask for.</p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-4">
            <Reveal className="md:col-span-2">
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><Target className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight">Know why a role fits</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">Match scores come with plain reasons, so you apply where you actually have a shot.</p>
                <div className="mt-6 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold">Key Account Manager</p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Strong match · 88%</span>
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-emerald-700">Matches your specialisation · In your city · Pay band fits</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-2" delay={100}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300"><Activity className="h-5 w-5" /></span>
                <h3 className="mt-5 text-xl font-extrabold tracking-tight">Live application tracking</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">A clear timeline for each application, and an update the moment it moves.</p>
                <div className="mt-6 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between text-sm font-extrabold">
                    <span>Team Lead</span>
                    <span className="text-xs font-bold text-blue-700">Interview stage</span>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {[true, true, true, true, false].map((on, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${on ? "bg-blue-600" : "bg-slate-200"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {[
              { icon: BellRing, tone: "bg-amber-500/15 text-amber-300", title: "Saved roles and alerts", text: "Heart the roles you like and set an alert for the kind of job you want next.", href: "/jobs", cta: "Browse roles" },
              { icon: Mic, tone: "bg-violet-500/15 text-violet-300", title: "Practise your interview", text: "Run a mock interview before the real one and get feedback on your answers.", href: "/mock-interview", cta: "Try Mock Interview" },
              { icon: FileCheck2, tone: "bg-sky-500/15 text-sky-300", title: "Check your resume", text: "See how your resume scores with applicant tracking systems and what to fix.", href: "/ats-score", cta: "Check my resume" },
              { icon: ShieldCheck, tone: "bg-emerald-500/15 text-emerald-300", title: "You stay in control", text: "Free for candidates. Your details go to hiring teams for matching only, never sold." },
            ].map((f, i) => {
              const Icon = f.icon;
              const inner = (
                <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:bg-white/[0.1]">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/70">{f.text}</p>
                  {f.cta && (
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-300 transition group-hover:gap-2">
                      {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              );
              return (
                <Reveal key={f.title} delay={i * 80}>
                  {f.href ? <Link href={f.href} className="block h-full">{inner}</Link> : inner}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Audience ───────── */}
      <section className="container-page py-16 md:py-24">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Who it is for</p>
          <h2 className={`${SECTION_TITLE} mt-3 text-slate-950`}>Built for sales people at every stage</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-extrabold tracking-tight text-slate-950">{a.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{a.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="container-page pb-16 md:pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#0a1630_0%,#14306b_55%,#2557e6_100%)] px-8 py-14 text-center text-white md:px-16 md:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight md:text-5xl">
                Ready for a search that keeps you{" "}
                <span className="font-(family-name:--font-fraunces) font-medium italic text-[#8FB0FF]">in the loop?</span>
              </h2>
              <p className="mt-4 text-blue-100/80">Create your free profile now. It takes about a minute, and you can add more detail whenever you like.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="inline-flex h-12 items-center rounded-full bg-white px-8 text-sm font-bold text-blue-900 shadow-lg shadow-black/20 hover:bg-blue-50">
                  Create free profile
                </Link>
                <Link href="/jobs" className="inline-flex h-12 items-center rounded-full border border-white/30 px-8 text-sm font-semibold text-white hover:bg-white/10">
                  Browse current openings
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
