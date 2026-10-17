import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { verifyRefer } from "@/lib/refer-token";
import ReferForm from "@/components/refer/ReferForm";

export const metadata: Metadata = { title: "Refer someone | StaffAnchor", robots: { index: false, follow: false } };

export default async function ReferPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t } = await searchParams;
  const valid = /^[0-9a-f-]{36}$/i.test(id) && !!t && verifyRefer(id, t);
  let first = "";
  if (valid) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { data } = await createClient(url, key, { auth: { persistSession: false } }).from("candidates").select("full_name").eq("id", id).maybeSingle();
      first = (data?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
    }
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      {valid ? (
        <>
          <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950">
            {first ? `${first}, who is the best seller you know?` : "Who is the best seller you know?"}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">
            Share a sales or revenue professional you&apos;d back. We&apos;ll only contact them with a relevant role. If we place them and they stay 90 days, you earn up to ₹10,000.
          </p>
          <ReferForm candidateId={id} token={t as string} />
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
