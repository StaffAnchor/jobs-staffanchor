import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpenJobsServer } from "@/lib/jobs-server";
import { canonicalPath, isLive } from "@/lib/job-seo";
import { slugify } from "@/lib/salary-pages";
import { budgetLabel, experienceLabel, type JobListing } from "@/modules/jobs/api";

export const revalidate = 1800;

// Bangalore and Bengaluru are one city; New Delhi is Delhi.
const ALIAS: Record<string, string> = { bangalore: "bengaluru", "new-delhi": "delhi" };
const cityKey = (c: string) => ALIAS[slugify(c)] ?? slugify(c);
const cityName = (key: string, jobs: JobListing[]) => {
  for (const j of jobs) for (const c of j.cities?.length ? j.cities : j.city ? [j.city] : []) if (cityKey(c) === key) return key === "bengaluru" ? "Bengaluru" : key === "delhi" ? "Delhi" : c;
  return key;
};
const inCity = (j: JobListing, key: string) => (j.cities?.length ? j.cities : j.city ? [j.city] : []).some((c) => cityKey(c) === key);

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const jobs = (await getOpenJobsServer()).filter(isLive).filter((j) => inCity(j, city));
  if (jobs.length === 0) return { robots: { index: false } };
  const name = cityName(city, jobs);
  return {
    title: `Sales jobs in ${name} | StaffAnchor`,
    description: `${jobs.length} open sales and revenue roles in ${name}, from companies hiring now. Apply with StaffAnchor.`,
    alternates: { canonical: `https://jobs.staffanchor.com/jobs-in/${city}` },
  };
}

export default async function CityJobs({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const jobs = (await getOpenJobsServer()).filter(isLive).filter((j) => inCity(j, city));
  if (jobs.length === 0) notFound();
  const name = cityName(city, jobs);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-(family-name:--font-space-grotesk) text-4xl font-black tracking-tight text-slate-950">Sales jobs in {name}</h1>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">{jobs.length} open sales and revenue role{jobs.length === 1 ? "" : "s"} in {name}, from companies hiring now. Apply and a StaffAnchor recruiter gets back to you.</p>
      <ul className="mt-8 space-y-3">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={canonicalPath(j)} className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-sm">
              <p className="text-lg font-extrabold text-slate-950">{j.role_title ?? "Sales role"}</p>
              <p className="mt-1 text-sm text-slate-500">{[j.client_display, experienceLabel(j.experience_min, j.experience_max)].filter(Boolean).join(" · ")}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">{budgetLabel(j.budget_min, j.budget_max)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link href="/register" className="inline-block rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">Create a free profile and get matched</Link>
      </div>
    </main>
  );
}
