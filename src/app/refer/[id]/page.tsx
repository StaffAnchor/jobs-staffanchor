import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { verifyRefer } from "@/lib/refer-token";
import ReferForm from "@/components/refer/ReferForm";

export const metadata: Metadata = { title: "Refer someone | StaffAnchor", robots: { index: false, follow: false } };

const LEVEL: Record<string, string> = { ic: "Individual contributor", team_lead: "Team lead", manager: "Manager", director: "Director", vp_plus: "VP or above" };

export default async function ReferPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; m?: string }> }) {
  const { id } = await params;
  const { t, m } = await searchParams;
  const valid = /^[0-9a-f-]{36}$/i.test(id) && !!t && verifyRefer(id, t);
  let first = "";
  // The role the referral is for, when the link names one that is still open. Never the client, never pay.
  let role: { title: string; city: string | null; experience: string | null; level: string | null } | null = null;
  const code = typeof m === "string" && /^[a-z0-9]{4,12}$/i.test(m) ? m.toLowerCase() : null;
  if (valid) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const admin = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await admin.from("candidates").select("full_name").eq("id", id).maybeSingle();
      first = (data?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
      if (code) {
        const { data: mid } = await admin.rpc("resolve_job_code", { p_code: code });
        if (typeof mid === "string") {
          const { data: r } = await admin.from("mandates").select("role_title, city, cities, experience_min, experience_max, seniority_band, status, is_archived, listing_kind").eq("id", mid).maybeSingle();
          if (r && r.status === "open" && !r.is_archived && r.listing_kind !== "pipeline") {
            const cities = (r.cities as string[] | null) ?? [];
            role = {
              title: r.role_title as string,
              city: cities[0] ?? (r.city as string | null) ?? null,
              experience: r.experience_min != null ? `${r.experience_min}-${r.experience_max ?? r.experience_min}+ years` : null,
              level: LEVEL[(r.seniority_band as string | null) ?? ""] ?? null,
            };
          }
        }
      }
    }
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      {valid ? (
        <>
          <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950">
            {role ? (first ? `${first}, know someone for this role?` : "Know someone for this role?") : first ? `${first}, who is the best seller you know?` : "Who is the best seller you know?"}
          </h1>
          {role && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">We&apos;re hiring</p>
              <p className="mt-1 text-xl font-extrabold text-slate-950">{role.title}</p>
              <p className="mt-1 text-sm text-slate-600">{[role.city, role.experience, role.level].filter(Boolean).join(" · ")}</p>
            </div>
          )}
          <p className="mt-4 text-[15px] leading-7 text-slate-600">
            {role ? "Share a sales professional who would fit." : "Share a sales or revenue professional you'd back."} We&apos;ll only contact them with a relevant role. If we place them and they stay 90 days, you earn up to ₹10,000.
          </p>
          <ReferForm candidateId={id} token={t as string} roleCode={role ? code : null} roleTitle={role?.title ?? null} />
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">This link isn&apos;t valid</h1>
          <p className="mt-2 text-sm text-slate-600">Please use the link from your email, or write to us and we&apos;ll help.</p>
        </div>
      )}
    </main>
  );
}
