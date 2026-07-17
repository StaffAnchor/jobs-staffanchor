import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// Server-side landing spot for every candidate submission (Build Your Profile,
// Quick Apply, and -- via the CRM's own equivalent route -- Create Candidate).
// Runs with the service-role key so it can (a) look up or create a real
// auth.users account for the candidate's email and (b) call the same
// submit_candidate / quick_apply RPCs the client used to call directly,
// then stamp candidates.user_id with that auth user's id. None of this needs
// RLS bypassed maliciously -- the RPCs themselves are the same ones the anon
// key already called; we're just adding the account-linking step server-side
// since admin.createUser/generateLink require the service-role key, which can
// never be shipped to the browser.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "This feature isn't fully configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  let body: { payload?: Record<string, unknown>; mandateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { payload, mandateId } = body;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "payload is required." }, { status: 400 });
  }
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey);

  try {
    const existingUser = await findAuthUserByEmail(admin, email);
    let userId: string;
    let isNewSignup = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        throw new Error(createError?.message ?? "Could not create an account for this email.");
      }
      userId = created.user.id;
      isNewSignup = true;
    }

    const rpcName = mandateId ? "quick_apply" : "submit_candidate";
    const rpcArgs = mandateId ? { payload, p_mandate_id: mandateId } : { payload };
    const { data: candidateId, error: rpcError } = await admin.rpc(rpcName, rpcArgs);
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    if (candidateId) {
      const { error: linkError } = await admin.from("candidates").update({ user_id: userId }).eq("id", candidateId);
      if (linkError) {
        // Non-fatal -- the candidate row itself saved fine; log for visibility
        // and let the caller know the submit still succeeded.
        console.error("Failed to link candidates.user_id after submit", linkError);
      }
    }

    if (isNewSignup) {
      // Best-effort -- a failed welcome email should never fail the submit
      // that already succeeded above.
      await sendMagicLinkWelcomeEmail(admin, email).catch((err) => {
        console.error("Failed to send magic-link welcome email", err);
      });
    }

    return NextResponse.json({ candidateId, isNewSignup });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Judgment call: this supabase-js version's admin.listUsers() has no
// email-filter parameter, so we page through results looking for a
// case-insensitive match. Fine at StaffAnchor's current candidate volume; if
// the user base grows large enough for this to matter, switch to a
// service-role SQL query against auth.users instead.
async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  const target = email.toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function sendMagicLinkWelcomeEmail(admin: SupabaseClient, email: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD not configured -- skipping candidate welcome email");
    return;
  }

  // Matches the redirect target used by the existing candidate-login page's
  // signInWithOtp() call, so a fresh signup's magic link lands in the same
  // place a returning candidate's does.
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobs.staffanchor.com"}/candidate-portal`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message ?? "Could not generate a magic-link login link.");
  }

  const actionLink = data.properties.action_link;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"StaffAnchor" <${gmailUser}>`,
    to: email,
    subject: "Welcome to StaffAnchor — here's your sign-in link",
    text: `Welcome to StaffAnchor!\n\nYour profile is on record. Use the link below any time to sign in and manage it -- no password needed:\n\n${actionLink}\n\nThanks,\nStaffAnchor Team`,
    html: `<p>Welcome to StaffAnchor!</p><p>Your profile is on record. Use the link below any time to sign in and manage it — no password needed:</p><p><a href="${actionLink}">${actionLink}</a></p><p>Thanks,<br/>StaffAnchor Team</p>`,
  });
}
