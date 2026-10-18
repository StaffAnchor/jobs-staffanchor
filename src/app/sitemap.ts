import type { MetadataRoute } from "next";
import { getOpenJobsServer, SITE } from "@/lib/jobs-server";
import { canonicalUrl, isLive } from "@/lib/job-seo";

export const revalidate = 3600;

// The pages search engines should know about: the home page, the jobs list, and every LIVE role.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = (await getOpenJobsServer()).filter(isLive);
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    ...jobs.map((j) => ({ url: canonicalUrl(j), lastModified: new Date(j.created_at), changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
