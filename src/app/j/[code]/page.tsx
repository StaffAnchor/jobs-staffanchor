import type { Metadata } from "next";
import ShortJobPage from "@/modules/jobs/ShortJobPage";
import { getJobByCodeServer } from "@/lib/jobs-server";
import { canonicalUrl, descriptionText, isLive, jobPostingJsonLd, jsonLdString } from "@/lib/job-seo";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const job = await getJobByCodeServer(code);
  if (!job) return { robots: { index: false } };
  const title = `${job.role_title ?? "Sales role"}${job.city ? ` in ${job.city}` : ""} | StaffAnchor`;
  return {
    title,
    description: descriptionText(job, 155),
    alternates: { canonical: canonicalUrl(job) },
    robots: isLive(job) ? undefined : { index: false, follow: true },
    openGraph: { title, description: descriptionText(job, 155), url: canonicalUrl(job), type: "website" },
  };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = await getJobByCodeServer(code);
  return (
    <>
      {job && isLive(job) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jobPostingJsonLd(job)) }} />}
      <ShortJobPage />
    </>
  );
}
