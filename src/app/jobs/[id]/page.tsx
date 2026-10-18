import type { Metadata } from "next";
import JobDetail from "@/modules/jobs/JobDetail";
import { getJobByIdServer } from "@/lib/jobs-server";
import { canonicalUrl, descriptionText, isLive, jobPostingJsonLd, jsonLdString } from "@/lib/job-seo";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobByIdServer(id);
  if (!job) return { robots: { index: false } };
  const title = `${job.role_title ?? "Sales role"}${job.city ? ` in ${job.city}` : ""} | StaffAnchor`;
  return {
    title,
    description: descriptionText(job, 155),
    alternates: { canonical: canonicalUrl(job) },
    // Pipeline roles are shortlists, not vacancies: kept out of search results.
    robots: isLive(job) ? undefined : { index: false, follow: true },
    openGraph: { title, description: descriptionText(job, 155), url: canonicalUrl(job), type: "website" },
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobByIdServer(id);
  return (
    <>
      {job && isLive(job) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jobPostingJsonLd(job)) }} />}
      <JobDetail mandateId={id} />
    </>
  );
}
