import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { benchmarkSlug, cityLabel, getBenchmarks, roleTitle } from "@/lib/salary-pages";

export const revalidate = 21600;

async function find(slug: string) {
  return (await getBenchmarks()).find((b) => benchmarkSlug(b) === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = await find(slug);
  if (!b) return { robots: { index: false } };
  const title = `${roleTitle(b.cluster_slug)} salary in ${cityLabel(b.metro)} | StaffAnchor`;
  const description = `${roleTitle(b.cluster_slug)} fixed pay in ${cityLabel(b.metro)}: typically ${b.median} LPA, with most between ${b.p25} and ${b.p75} LPA, from ${b.n} StaffAnchor candidate profiles.`;
  return { title, description, alternates: { canonical: `https://jobs.staffanchor.com/salary/${slug}` }, openGraph: { title, description, type: "article" } };
}

export default async function SalaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getBenchmarks();
  const b = all.find((x) => benchmarkSlug(x) === slug);
  if (!b) notFound();
  const role = roleTitle(b.cluster_slug);
  const city = cityLabel(b.metro);
  const year = new Date().getFullYear();
  const others = all.filter((x) => benchmarkSlug(x) !== slug && (x.cluster_slug === b.cluster_slug || x.metro === b.metro)).slice(0, 6);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Salary guide {year}</p>
      <h1 className="mt-2 font-(family-name:--font-space-grotesk) text-4xl font-black leading-tight tracking-tight text-slate-950">
        {role} salary in {city}
      </h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="text-xs font-semibold text-teal-800">Typical fixed pay</p>
          <p className="mt-1 text-3xl font-black text-teal-900">{b.median} <span className="text-base font-bold">LPA</span></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Most people earn</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{b.p25}-{b.p75} <span className="text-base font-bold">LPA</span></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Based on</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{b.n} <span className="text-base font-bold">profiles</span></p>
        </div>
      </div>
      <p className="mt-6 text-[15px] leading-7 text-slate-700">
        A {role} in {city} typically earns around {b.median} lakhs a year in fixed pay. The middle half of people sit between {b.p25} and {b.p75} lakhs. Variable pay, commission and incentives are not included, and in sales they can add a lot.
      </p>
      <h2 className="mt-8 text-lg font-bold text-slate-900">How we worked this out</h2>
      <p className="mt-2 text-[14px] leading-7 text-slate-600">
        From {b.n} profiles registered with StaffAnchor whose current role is {role} and who are based in {city}. Pay is the fixed annual pay each person reported, in lakhs per year. It is a guide from our own candidates, not a market-wide survey, and individual pay varies with experience, company and the product sold. No individual is identified.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/jobs?q=${encodeURIComponent(city)}`} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">See roles in {city}</Link>
        <Link href="/register" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">Create a free profile and get matched</Link>
      </div>
      {others.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold text-slate-900">Related salary guides</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={benchmarkSlug(o)}>
                <Link href={`/salary/${benchmarkSlug(o)}`} className="inline-block rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-teal-300">
                  {roleTitle(o.cluster_slug)} in {cityLabel(o.metro)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
