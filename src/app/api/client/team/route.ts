import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getClientContext } from "@/lib/client-auth";

export const runtime = "nodejs";

const MAX_PEOPLE = 10;
// Personal mailbox providers: a shared company domain can't be inferred from these.
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com", "live.com", "icloud.com", "proton.me", "protonmail.com", "rediffmail.com"]);

const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

export async function GET(req: NextRequest) {
  const ctx = await getClientContext(req.headers.get("authorization"));
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const [{ data: members }, { data: pending }] = await Promise.all([
    ctx.admin.from("client_users").select("id, email, full_name, last_login_at").eq("client_id", ctx.clientId).order("created_at"),
    ctx.admin.from("client_invites").select("email, created_at").eq("client_id", ctx.clientId).is("consumed_at", null).order("created_at", { ascending: false }),
  ]);
  const myDomain = domainOf(ctx.email);
  return NextResponse.json({
    clientName: ctx.clientName,
    members: (members ?? []).map((m) => ({ email: m.email, full_name: m.full_name, last_login_at: m.last_login_at, is_me: m.id === ctx.userId })),
    pending: pending ?? [],
    canInvite: !!myDomain && !FREE_MAIL.has(myDomain),
    inviteDomain: myDomain,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getClientContext(req.headers.get("authorization"));
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = (await req.json().catch(() => ({}))) as { email?: unknown; remove?: unknown };

  // Withdraw an invite that hasn't been used yet.
  if (typeof body.remove === "string") {
    await ctx.admin.from("client_invites").delete().eq("client_id", ctx.clientId).eq("email", body.remove.toLowerCase()).is("consumed_at", null);
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const myDomain = domainOf(ctx.email);
  if (!myDomain || FREE_MAIL.has(myDomain)) {
    return NextResponse.json({ error: "Your account uses a personal email address, so please ask your StaffAnchor recruiter to add colleagues." }, { status: 403 });
  }
  if (domainOf(email) !== myDomain) {
    return NextResponse.json({ error: `Please use a colleague's work email at @${myDomain}. For anyone else, ask your StaffAnchor recruiter.` }, { status: 403 });
  }

  const [{ data: members }, { data: pending }] = await Promise.all([
    ctx.admin.from("client_users").select("email").eq("client_id", ctx.clientId),
    ctx.admin.from("client_invites").select("email").eq("client_id", ctx.clientId).is("consumed_at", null),
  ]);
  const taken = new Set([...(members ?? []), ...(pending ?? [])].map((r) => String(r.email).toLowerCase()));
  if (taken.has(email)) return NextResponse.json({ error: "That person already has access or a pending invite." }, { status: 409 });
  if (taken.size >= MAX_PEOPLE) return NextResponse.json({ error: `You can have up to ${MAX_PEOPLE} people on your account. Ask your recruiter to add more.` }, { status: 409 });

  const { error: insErr } = await ctx.admin.from("client_invites").insert({ client_id: ctx.clientId, email, invited_by: ctx.userId });
  if (insErr) return NextResponse.json({ error: "Could not create the invite. Please try again." }, { status: 500 });

  await ctx.admin.from("audit_log").insert({ actor: ctx.userId, action: "client_colleague_invited", entity: "client", entity_id: ctx.clientId, detail: { to: email, by: ctx.email } });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  let emailed = false;
  if (gmailUser && gmailPass) {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobs.staffanchor.com"}/client-login?email=${encodeURIComponent(email)}`;
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
      await transporter.sendMail({
        from: `"StaffAnchor" <${gmailUser}>`,
        to: email,
        subject: `${ctx.email} gave you access to ${ctx.clientName}'s hiring on StaffAnchor`,
        text: `Hi,\n\n${ctx.email} has given you access to the StaffAnchor client portal for ${ctx.clientName}, where you can review candidate shortlists and share feedback.\n\nSign in here (no password, we email you a one-time code): ${loginUrl}\n\nThanks,\nStaffAnchor Team`,
        html: `<p>Hi,</p><p><strong>${ctx.email}</strong> has given you access to the StaffAnchor client portal for <strong>${ctx.clientName}</strong>, where you can review candidate shortlists and share feedback.</p><p><a href="${loginUrl}">Sign in here</a> — no password, we email you a one-time code.</p><p>Thanks,<br/>StaffAnchor Team</p>`,
      });
      emailed = true;
    } catch (e) {
      console.error("Client colleague invite email failed", e);
    }
  }
  return NextResponse.json({ ok: true, emailed });
}
