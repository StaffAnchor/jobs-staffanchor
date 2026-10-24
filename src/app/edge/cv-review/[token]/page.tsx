import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { crmCall } from "@/lib/pro-sessions";
import { sanitizeDoc, type CandidateResponse, type DocStatus, type SectionRef } from "@/lib/cv-doc/types";
import Review from "./review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review your CV | StaffAnchor Edge", robots: { index: false, follow: false } };

// The private link StaffAnchor sends once a CV is approved. It shows only that candidate's own CV.
export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await crmCall<{ name?: string; version?: number; status?: DocStatus; content?: unknown; sections?: SectionRef[]; photoUrl?: string | null; response?: CandidateResponse | null; superseded?: boolean }>("/api/internal/cv-doc/review-info", { token });
  if (!r.json.ok) notFound();
  return (
    <Review
      token={token}
      name={r.json.name ?? ""}
      version={r.json.version ?? 1}
      status={r.json.status ?? "shared"}
      doc={sanitizeDoc(r.json.content)}
      sections={r.json.sections ?? []}
      photoUrl={r.json.photoUrl ?? null}
      response={r.json.response ?? null}
      superseded={!!r.json.superseded}
    />
  );
}
