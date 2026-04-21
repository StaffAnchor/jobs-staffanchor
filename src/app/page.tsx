import Link from "next/link";
import { ArrowRight, BadgeCheck, ChartColumn, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const profileHighlights = [
  {
    title: "Job history with role context",
    description:
      "Capture each role with dates, industry context, and sales motion so hiring teams can understand the story behind the resume.",
    icon: ChartColumn,
  },
  {
    title: "Performance and quota snapshots",
    description:
      "Share target achievement, average deal size, and outcomes to move beyond generic claims and vague summaries.",
    icon: BadgeCheck,
  },
  {
    title: "Skills, location, and salary intent",
    description:
      "Show what you are good at, where you want to work, and expected compensation for better role matching.",
    icon: MapPin,
  },
];

const journey = [
  {
    step: "01",
    title: "Create your account",
    description: "Register in minutes, verify your email, and choose the profile path that matches your goals.",
  },
  {
    step: "02",
    title: "Build a complete profile",
    description: "Add experience, metrics, skills, preferred locations, and salary expectations in one structured flow.",
  },
  {
    step: "03",
    title: "Get discovered by hiring teams",
    description: "Verified hiring teams find you through filters and reach out directly when there is a strong match.",
  },
];

const audience = [
  {
    title: "BDRs, AEs, and sales managers",
    description: "Highlight quota history, pipeline impact, and selling approach in a hiring-team-friendly format.",
    icon: Users,
  },
  {
    title: "Early-career jobseekers",
    description: "Show internships, transferable skills, and potential with a profile designed for first roles.",
    icon: Sparkles,
  },
  {
    title: "Career transition candidates",
    description: "Map previous achievements to sales competencies hiring teams actively search for.",
    icon: ArrowRight,
  },
  {
    title: "Experienced passive talent",
    description: "Stay visible to serious opportunities without applying to dozens of unrelated jobs.",
    icon: ShieldCheck,
  },
];

const trustPoints = [
  {
    title: "Always free for candidates",
    description: "You can create, maintain, and update your profile at no cost.",
  },
  {
    title: "Verified hiring teams only",
    description: "Profiles are visible to screened hiring teams, not random browsers.",
  },
  {
    title: "You control visibility",
    description: "Pause discovery when needed and reactivate whenever you are ready.",
  },
];

export default function Home() {
  return (
    <main className="bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(to_bottom,#f8fbff_0%,#ffffff_40%,#f8fafc_100%)] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.02),transparent_45%,rgba(20,184,166,0.04))]" />
        <div className="relative container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              For jobseekers
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-(family-name:--font-space-grotesk) text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
                Let the right hiring teams discover you, not your inbox spam.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Build one structured profile and get in front of verified hiring teams. No cold outreach, no blind applications, and no noise.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="h-11 rounded-full bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-500">
                  Create Free Profile
                </Button>
              </Link>
              <a href="#workflow">
                <Button variant="outline" className="h-11 rounded-full border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  See How It Works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Free for candidates
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-sky-600" />
                Verified hiring teams only
              </div>
              <div className="flex items-center gap-2">
                <ChartColumn className="h-4 w-4 text-teal-600" />
                Usually under 10 minutes
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="relative space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Candidate snapshot preview</p>
                <p className="mt-2 text-sm text-slate-600">Strong profile with performance metrics and role clarity</p>
              </div>
              <div className="grid gap-4">
                {profileHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-slate-900 p-2 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="font-semibold text-slate-950">{item.title}</h2>
                          <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white/70">
        <div className="container-page grid gap-4 py-8 md:grid-cols-4 md:py-10">
          {[
            { value: "3x", label: "more profile views for complete profiles" },
            { value: "<10 min", label: "average profile completion time" },
            { value: "100%", label: "access is verified and reviewed" },
            { value: "Free", label: "always free for candidates" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-2xl font-black text-slate-950">{stat.value}</p>
              <p className="text-sm leading-6 text-slate-600">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="profile" className="container-page space-y-6 py-14 md:py-16">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            More than a resume. A profile hiring teams can act on.
          </h2>
          <p className="text-slate-600">CVs tell your story. Structured data helps hiring teams shortlist with confidence.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profileHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="space-y-4 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="inline-flex rounded-xl bg-slate-900 p-2 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-slate-50/70">
        <div className="container-page py-14 md:py-16">
          <div className="mb-8 max-w-2xl space-y-2">
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Three simple steps to get discovered
            </h2>
            <p className="text-slate-600">A straightforward journey from signup to hiring-team outreach.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {journey.map((item) => (
              <Card key={item.step} className="space-y-4 p-5">
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold tracking-[0.18em] text-white">
                  STEP {item.step}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-16">
        <div className="mb-8 max-w-2xl space-y-2">
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Who this is built for
          </h2>
          <p className="text-slate-600">Whether you are actively searching or passively open, you stay visible to the right opportunities.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {audience.map((group) => {
            const Icon = group.icon;

            return (
              <Card key={group.title} className="space-y-3 p-5">
                <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-950">{group.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{group.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="trust" className="border-y border-emerald-100 bg-emerald-50/80 text-slate-900">
        <div className="container-page py-14 md:py-16">
          <div className="mb-8 max-w-3xl space-y-2">
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight md:text-4xl">
              Built on transparency and candidate control
            </h2>
            <p className="text-slate-600">Your data is shown to verified hiring teams in the network, not sold to third-party lists.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trustPoints.map((point) => (
              <Card key={point.title} className="space-y-2 border-emerald-200 bg-white p-5 text-slate-800">
                <h3 className="text-lg font-bold text-slate-950">{point.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{point.description}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-6 border-emerald-200 bg-white p-5 text-slate-800">
            <p className="text-sm leading-6 text-slate-600">
              Your profile is used for hiring-team matching only. StaffAnchor does not run candidate advertising and does not sell candidate data.
            </p>
          </Card>
        </div>
      </section>

      <section className="container-page py-14 md:py-16">
        <Card className="relative overflow-hidden border-slate-200 bg-[linear-gradient(135deg,#0f766e_0%,#0891b2_55%,#0f172a_100%)] p-6 text-white shadow-[0_24px_90px_-45px_rgba(15,23,42,0.8)] md:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="space-y-2">
              <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight md:text-4xl">
                Ready to be discovered?
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-teal-50 md:text-base">
                Create your free profile today. It goes live for verified hiring teams as soon as your details are complete.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-teal-800 hover:bg-teal-50">
                  Create Free Profile
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-11 rounded-full border-white/50 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}