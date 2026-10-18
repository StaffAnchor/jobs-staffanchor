import type { Metadata } from "next";
import ShortJobPage from "@/modules/jobs/ShortJobPage";
import { getJobByCodeServer } from "@/lib/jobs-server";
import { canonicalUrl } from "@/lib/job-seo";

// The LinkedIn version of a short link. It shows the same role, but search engines are pointed at the one canonical page.
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const job = await getJobByCodeServer(code);
  return { robots: { index: false, follow: true }, ...(job ? { alternates: { canonical: canonicalUrl(job) } } : {}) };
}

export default function Page() {
  return <ShortJobPage />;
}
