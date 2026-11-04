import type { MetadataRoute } from "next";
import { getOpenJobsServer, SITE } from "@/lib/jobs-server";
import { canonicalUrl, isLive } from "@/lib/job-seo";
import { benchmarkSlug, getBenchmarks, slugify } from "@/lib/salary-pages";

export const revalidate = 3600;

// The pages search engines should know about: the home page, the jobs list, and every LIVE role.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = (await getOpenJobsServer()).filter(isLive);
  const bench = await getBenchmarks();
  const ALIAS: Record<string, string> = { bangalore: "bengaluru", "new-delhi": "delhi" };
  const cityKeys = Array.from(new Set(jobs.flatMap((j) => (j.cities?.length ? j.cities : j.city ? [j.city] : [])).map((c) => ALIAS[slugify(c)] ?? slugify(c)).filter((k) => k && k !== "remote")));
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    // StaffAnchor Edge: the paid services for jobseekers, and the free tools that lead to them.
    { url: `${SITE}/edge`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/edge/book/mock-interview`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/edge/book/job-search-strategy`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/resume-writing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/mock-interview`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/ats-score`, changeFrequency: "monthly", priority: 0.6 },
    ...cityKeys.map((k) => ({ url: `${SITE}/jobs-in/${k}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...(bench.length ? [{ url: `${SITE}/salary`, changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    ...bench.map((b) => ({ url: `${SITE}/salary/${benchmarkSlug(b)}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...jobs.map((j) => ({ url: canonicalUrl(j), lastModified: new Date(j.created_at), changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
