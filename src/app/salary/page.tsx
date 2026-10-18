import type { Metadata } from "next";
import Link from "next/link";
import { benchmarkSlug, cityLabel, getBenchmarks, roleTitle } from "@/lib/salary-pages";

export const revalidate = 21600;
export const metadata: Metadata = {
  title: "Sales salaries in India by role and city | StaffAnchor",
  description: "What sales and revenue professionals earn in India, by role and city, from StaffAnchor's candidate profiles.",
  alternates: { canonical: "https://jobs.staffanchor.com/salary" },
};

export default async function SalaryHub() {
  const rows = await getBenchmarks();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-(family-name:--font-space-grotesk) text-4xl font-black tracking-tight text-slate-950">Sales salaries in India</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">What sales and revenue professionals earn, by role and city, from the profiles on StaffAnchor. Figures are fixed pay in lakhs per year (LPA), as reported by candidates.</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">New salary pages are added as we gather enough profiles for each role and city.</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={`${r.cluster_slug}|${r.metro}`}>
              <Link href={`/salary/${benchmarkSlug(r)}`} className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm">
                <p className="font-bold text-slate-900">{roleTitle(r.cluster_slug)}</p>
                <p className="text-sm text-slate-500">{cityLabel(r.metro)}</p>
                <p className="mt-2 text-lg font-extrabold text-teal-700">{r.median} LPA <span className="text-xs font-medium text-slate-400">typical</span></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
