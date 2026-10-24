import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { crmCall } from "@/lib/pro-sessions";
import { sanitize, type CvData } from "@/lib/cv-brief/config";
import CvForm from "./cv-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your sales career | StaffAnchor Edge", robots: { index: false, follow: false } };

// The private link StaffAnchor sends to a candidate. It shows only that candidate's own answers.
export default async function CvPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await crmCall<{ name?: string; status?: string; data?: unknown; cvName?: string | null; consent?: boolean }>("/api/internal/cv-brief/info", { token, view: true });
  if (!r.json.ok) notFound();
  const data: CvData = sanitize(r.json.data);
  return <CvForm token={token} name={r.json.name ?? ""} initial={data} status={r.json.status ?? "sent"} cvName={r.json.cvName ?? null} consented={!!r.json.consent} />;
}
