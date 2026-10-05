import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getClientContext } from "@/lib/client-auth";

export const runtime = "nodejs";

// A client proposed an interview time. That is the one portal event a client is
// waiting on us for, so it gets an email (everything else stays in-app).
const IST = "Asia/Kolkata";
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }) + " IST";

export async function POST(req: NextRequest) {
  const ctx = await getClientContext(req.headers.get("authorization"));
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { linkId } = (await req.json().catch(() => ({}))) as { linkId?: string };
  if (!linkId) return NextResponse.json({ error: "linkId is required" }, { status: 400 });

  const { data: link } = await ctx.admin
    .from("candidate_mandate_links")
    .select("id, mandate_id, requested_interview_at, candidates(full_name), mandates(role_title, client_id)")
    .eq("id", linkId)
    .single();
  const mand = link?.mandates as unknown as { role_title: string; client_id: string | null } | null;
  const cand = link?.candidates as unknown as { full_name: string } | null;
  if (!link || !mand || mand.client_id !== ctx.clientId || !cand) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!link.requested_interview_at) return NextResponse.json({ ok: true, sent: 0 });

  // Assigned recruiters; fall back to admins if nobody is assigned.
  const { data: assigned } = await ctx.admin.from("mandate_assignments").select("freelancer_id").eq("mandate_id", link.mandate_id);
  const ids = (assigned ?? []).map((a) => a.freelancer_id as string);
  let { data: staff } = ids.length ? await ctx.admin.from("profiles").select("email").in("id", ids) : { data: [] as { email: string | null }[] };
  if (!staff || staff.length === 0) {
    ({ data: staff } = await ctx.admin.from("profiles").select("email").eq("role", "admin"));
  }
  const to = Array.from(new Set((staff ?? []).map((s) => s.email).filter((e): e is string => !!e)));
  if (to.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return NextResponse.json({ ok: false, skipped: "Email not configured" });

  const crm = process.env.NEXT_PUBLIC_CRM_URL ?? "https://clients.staffanchor.com";
  const slot = when(link.requested_interview_at as string);
  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
    await transporter.sendMail({
      from: `"StaffAnchor" <${gmailUser}>`,
      to: to.join(", "),
      subject: `Client wants to interview ${cand.full_name} for ${mand.role_title}: ${slot}`,
      text: `${ctx.clientName} (${ctx.email}) proposed an interview with ${cand.full_name} for ${mand.role_title}.\n\nProposed time: ${slot}\n\nConfirm the time here: ${crm}/interviews\n`,
      html: `<p><strong>${ctx.clientName}</strong> (${ctx.email}) proposed an interview with <strong>${cand.full_name}</strong> for <strong>${mand.role_title}</strong>.</p><p>Proposed time: <strong>${slot}</strong></p><p><a href="${crm}/interviews">Confirm the time</a> in the CRM.</p>`,
    });
  } catch (e) {
    console.error("Interview-request email failed", e);
    return NextResponse.json({ error: "Could not send the email." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, sent: to.length });
}
