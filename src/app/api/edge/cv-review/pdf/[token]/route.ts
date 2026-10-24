import { NextResponse } from "next/server";
import { CRM } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The shared CV as a PDF for the candidate. The CRM makes it; this only passes it on, for the holder of the private link.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await fetch(`${CRM}/api/internal/cv-doc/pdf`, { method: "POST", headers: { "Content-Type": "application/json", "x-pro-secret": process.env.PRO_INTERNAL_SECRET ?? "" }, body: JSON.stringify({ token }), cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Not found." }, { status: res.status === 404 ? 404 : 502 });
  return new NextResponse(await res.arrayBuffer(), { headers: { "Content-Type": "application/pdf", "Content-Disposition": res.headers.get("content-disposition") ?? 'inline; filename="CV.pdf"', "Cache-Control": "no-store" } });
}
