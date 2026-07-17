import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Public, unauthenticated lookup used only by Quick Apply's real-time
// "you're already registered" check. Deliberately returns the minimum
// possible surface -- existence + first name only, never email/phone/full
// profile -- to avoid turning this into a data-enumeration endpoint. Uses the
// service-role key purely to read past RLS (candidates rows aren't
// individually owned by an anon session pre-login), same pattern as
// candidate-submit.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fail open (as "not found") rather than blocking Quick Apply if this
    // isn't configured -- the candidate can still fill the full form.
    return NextResponse.json({ exists: false });
  }

  let body: { email?: string; mandateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ exists: false });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey);

  try {
    const { data: candidate } = await admin
      .from("candidates")
      .select("id, full_name")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (!candidate) {
      return NextResponse.json({ exists: false });
    }

    let alreadyApplied = false;
    if (body.mandateId) {
      const { data: link } = await admin
        .from("candidate_mandate_links")
        .select("id")
        .eq("candidate_id", candidate.id)
        .eq("mandate_id", body.mandateId)
        .limit(1)
        .maybeSingle();
      alreadyApplied = !!link;
    }

    const firstName = (candidate.full_name ?? "").trim().split(" ")[0] || null;
    return NextResponse.json({ exists: true, firstName, alreadyApplied });
  } catch {
    // Best-effort only -- never block the form on a lookup failure.
    return NextResponse.json({ exists: false });
  }
}
