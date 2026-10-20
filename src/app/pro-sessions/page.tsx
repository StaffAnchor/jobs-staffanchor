import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CreditCard, Video } from "lucide-react";

// The same content as staffanchor.com/pro-sessions, so search engines treat that one as the original.
export const metadata: Metadata = {
  title: "Pro Sessions | Mock Interview, Job Search Strategy and Resume Rebuild | StaffAnchor",
  description:
    "1:1 video sessions with Gagan Sharma, founder of StaffAnchor, for sales and leadership professionals: a full mock interview, a job search strategy with a resume rebuild, and resume writing.",
  alternates: { canonical: "https://www.staffanchor.com/pro-sessions" },
};

const BOOK = "https://clients.staffanchor.com/book";
const SESSIONS = [
  {
    slug: "mock-interview",
    title: "Mock interview | Sales and Leadership Role",
    tagline: "A real interview, then the feedback nobody gives you.",
    meta: "60 mins · Video meeting",
    price: "₹1,899",
    points: [
      "A full interview loop for the role you're targeting: discovery on your numbers, a scenario on team or pipeline management, and the tough questions on gaps and attrition.",
      "A plain debrief on exactly where you'd have been screened out, and how to fix it.",
      "Bring a specific role or JD if you have one.",
    ],
    href: `${BOOK}/mock-interview?src=jobs_site`,
    cta: "Book this session",
  },
  {
    slug: "job-search-strategy",
    title: "Job Search Strategy + Resume Rebuild",
    tagline: "Fix the resume. Then fix how you're using it.",
    meta: "45 mins · Video meeting",
    price: "₹1,999",
    popular: true,
    points: [
      "Your resume rewritten line by line, so it shows numbers, scale, ownership and the levers behind the result.",
      "A sharper LinkedIn headline and About section.",
      "A map of where your next role actually comes from: which companies, which route in, what to say.",
      "Send your resume 24 hours before, so the call is spent on strategy and not on reading.",
    ],
    href: `${BOOK}/job-search-strategy?src=jobs_site`,
    cta: "Book this session",
  },
  {
    slug: "resume-writing",
    title: "Resume Writing",
    tagline: "Written for you by StaffAnchor, ready for applicant tracking systems.",
    meta: "Delivered in Word and PDF",
    price: "From ₹999",
    points: ["Priced by experience level, from early career to senior.", "ATS-friendly structure with role-specific keywords and impact-led bullet points.", "Revision round included."],
    href: "https://www.staffanchor.com/resume-writing",
    cta: "See resume writing",
  },
];
const STEPS = [
  { icon: CalendarCheck, title: "Pick a time", text: "Choose a day and slot that suits you. Times are in India Standard Time." },
  { icon: CreditCard, title: "Pay securely", text: "Pay online with Razorpay. Your slot is held while you pay." },
  { icon: Video, title: "Get your invite", text: "A calendar invite with the Google Meet link lands in your inbox right away." },
];
const H = "font-(family-name:--font-space-grotesk) font-black tracking-tight text-slate-950";

export default function ProSessionsPage() {
  return (
    <main>
      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">Pro Sessions</span>
          <h1 className={`${H} text-4xl md:text-5xl`}>1:1 sessions to land your next sales role</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Practise with a hiring leader, fix your resume, and get a plan for where your next role really comes from. Book a time that suits you and pay securely online.
          </p>
          <a href="#sessions" className="mt-7 inline-flex items-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700">
            See the sessions <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </section>

      <section id="sessions" className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {SESSIONS.map((s) => (
            <div key={s.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-slate-900">
              <div className="mb-3 h-6">{s.popular && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Popular</span>}</div>
              <p className="mb-2 text-sm text-slate-500">{s.meta}</p>
              <h2 className={`${H} mb-2 text-xl`}>{s.title}</h2>
              <p className="mb-4 font-medium text-slate-900">{s.tagline}</p>
              <ul className="mb-6 flex-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-slate-600">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className={`${H} text-lg`}>{s.price}</span>
                <Link href={s.href} className="group inline-flex items-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  {s.cta} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className={`${H} mb-8 text-center text-3xl`}>How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><s.icon className="h-5 w-5" /></div>
                <h3 className={`${H} mb-1 text-lg`}>{i + 1}. {s.title}</h3>
                <p className="text-[15px] leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-8 md:flex-row">
          <Image src="/gagan-sharma.jpg" alt="Gagan Sharma, Founder of StaffAnchor" width={160} height={160} className="h-36 w-36 shrink-0 rounded-full object-cover" />
          <div>
            <h2 className={`${H} mb-1 text-3xl`}>Gagan Sharma</h2>
            <p className="mb-4 font-medium text-indigo-700">Building StaffAnchor | Empowering Revenue Professionals with the Right Opportunities</p>
            <p className="mb-3 leading-relaxed text-slate-600">
              With 15+ years of experience in scaling high-performing sales teams and driving revenue growth, I have built and led regional and national teams of 400+ across EdTech, AgriTech, Recruitment, and Matrimonial services.
            </p>
            <p className="leading-relaxed text-slate-600">
              Managing revenues of ₹100 Cr to ₹150 Cr+, my expertise lies in optimizing sales funnels, improving conversions, and building structured, data-driven sales engines that drive sustainable business growth.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
