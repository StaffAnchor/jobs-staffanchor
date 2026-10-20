import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { crmCall } from "@/lib/pro-sessions";
import IntakeForm from "./intake-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your details | StaffAnchor Resume Writing", robots: { index: false } };

// The link in the order confirmation email. Only a paid order's own link works.
export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await crmCall<{ tierLabel?: string; name?: string; alreadySubmitted?: boolean }>("/api/internal/resume/intake-info", { token });
  if (!r.json.ok) notFound();
  return <IntakeForm token={token} name={r.json.name ?? ""} tierLabel={r.json.tierLabel ?? "Resume Writing"} alreadySubmitted={!!r.json.alreadySubmitted} />;
}
