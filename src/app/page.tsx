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
import { LiveRolesTicker } from "@/components/common/live-roles-ticker";
import HeroSearch from "@/components/home/hero-search";
import HeroLiveCard from "@/components/home/hero-live-card";
import OpenRolesCount from "@/components/home/open-roles-count";

const steps = [
  {
    icon: UserPlus,
    title: "Create your profile in a minute",
    description: "Upload your resume, pick from a few dropdowns, and you are in. We read your resume to fill in what we can.",
  },
  {
    icon: Target,
    title: "See roles ranked by fit",
    description: "Every role shows how well it matches you and why — your specialisation, city, experience and pay band.",
  },
  {
    icon: Activity,
    title: "Follow every step",
    description: "From applied to interview to offer, your application status updates live. No more silence after you apply.",
  },
];

const features = [
  {
    icon: Target,
    title: "Know why a role fits",
    description: "Match scores come with plain reasons, so you apply where you actually have a shot.",
  },
  {
    icon: Activity,
    title: "Live application tracking",
    description: "A clear timeline for each application, and an update the moment it moves.",
  },
  {
    icon: BellRing,
    title: "Saved roles and alerts",
    description: "Heart the roles you like and set an alert for the kind of job you want next.",
    href: "/jobs",
    cta: "Browse roles",
  },
  {
    icon: Mic,
    title: "Practise your interview",
    description: "Run a mock interview before the real one and get feedback on your answers.",
    href: "/mock-interview",
    cta: "Try Mock Interview",
  },
  {
    icon: FileCheck2,
    title: "Check your resume",
    description: "See how your resume scores with applicant tracking systems and what to fix.",
    href: "/ats-score",
    cta: "Check my resume",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    description: "Free for candidates. Your details go to hiring teams for matching only, never sold.",
  },
];

const audience = [
  { title: "BDRs and AEs", description: "Show quota history and selling approach in a format hiring teams actually read." },
  { title: "Sales managers and leaders", description: "Stay visible to serious opportunities without applying to dozens of unrelated jobs." },
  { title: "Early-career jobseekers", description: "Show internships, transferable skills and potential with a profile built for first roles." },
  { title: "Career switchers", description: "Map what you have achieved to the sales skills hiring teams look for." },
];

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-[#f4f7ff] via-white to-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent 75%)",
          }}
        />
        <div className="relative container-page grid gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
              <Sparkles className="h-3.5 w-3.5" />
              Sales careers, handled by specialists
            </div>
            <h1 className="mt-5 max-w-2xl font-(family-name:--font-space-grotesk) text-4xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
              Find your next sales role. We do the{" "}
              <span className="font-(family-name:--font-fraunces) font-medium italic text-blue-600">chasing.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Create a profile in about a minute, see roles ranked by how well they fit you, and follow every step of
              your application.
            </p>

            <div className="mt-8 max-w-xl">
              <HeroSearch />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create free profile
              </Link>
              <Link href="/candidate-login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Already registered? Sign in
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {["Free for candidates", "Profile in about a minute", "Updates at every step"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroLiveCard />
        </div>
      </section>

      <LiveRolesTicker />

      {/* Facts (all real or process facts, no invented statistics) */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4 md:py-10">
          {[
            { value: <OpenRolesCount />, label: "open roles right now" },
            { value: "1 min", label: "to create your profile" },
            { value: "Free", label: "always, for candidates" },
            { value: "Live", label: "status on every application" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="workflow" className="container-page py-16 md:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Three steps. No black hole.
          </h2>
          <p className="mt-3 text-slate-600">From signing up to your first interview, you always know where you stand.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-(family-name:--font-space-grotesk) text-4xl font-black text-slate-100">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-slate-50/70">
        <div className="container-page py-16 md:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Everything a job search needs, in one place
            </h2>
            <p className="mt-3 text-slate-600">Built around what candidates actually ask for: clarity, speed and a fair shot.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              const body = (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{f.description}</p>
                  {f.cta && (
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                      {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </>
              );
              return f.href ? (
                <Link
                  key={f.title}
                  href={f.href}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {body}
                </Link>
              ) : (
                <div key={f.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="container-page py-16 md:py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Built for sales people at every stage
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((a) => (
            <div key={a.title} className="rounded-3xl border border-slate-200 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-950">{a.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0a1630_0%,#14306b_60%,#2557e6_100%)] p-8 text-white md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight md:text-4xl">
              Ready for a search that keeps you in the loop?
            </h2>
            <p className="mt-3 text-blue-100">Create your free profile now. It takes about a minute, and you can add more detail whenever you like.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-blue-900 hover:bg-blue-50">
                Create free profile
              </Link>
              <Link href="/jobs" className="inline-flex h-12 items-center rounded-full border border-white/30 px-7 text-sm font-semibold text-white hover:bg-white/10">
                Browse current openings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
