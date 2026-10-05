"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { LABEL } from "@/modules/client-portal/v2/ui";

type TeamData = {
  clientName: string;
  members: { email: string; full_name: string | null; last_login_at: string | null; is_me: boolean }[];
  pending: { email: string; created_at: string }[];
  canInvite: boolean;
  inviteDomain: string;
};

async function call(method: "GET" | "POST", body?: unknown) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");
  const res = await fetch("/api/client/team", {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "Something went wrong.");
  return json;
}

export default function ClientTeamPage() {
  const router = useRouter();
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await call("GET")) as TeamData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your team.");
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/client-login");
      else void load();
    });
  }, [router, load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const r = await call("POST", { email });
      toast.success(r.emailed ? "Invite sent." : "Access added. We couldn't send the email, so ask them to sign in at the client login page.");
      setEmail("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the invite.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(addr: string) {
    try {
      await call("POST", { remove: addr });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw the invite.");
    }
  }

  if (error) return <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-red-600">{error}</div>;
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/client-portal" className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All your roles
      </Link>
      <p className={`${LABEL} mt-4`}>Team</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-slate-900">Who can see {data.clientName}&apos;s shortlists</h1>
      <p className="mt-1.5 text-[13px] text-slate-500">Invite the colleagues who help you decide: your co-founder, hiring manager or HR lead. They sign in with a one-time email code.</p>

      <div className="mt-6 rounded-2xl border border-[#ece7de] bg-white p-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
          <UserPlus className="h-4 w-4 text-indigo-600" /> Invite a colleague
        </h2>
        {data.canInvite ? (
          <form onSubmit={invite} className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`name@${data.inviteDomain}`}
              className="min-w-0 flex-1 rounded-xl border border-[#e3ddd1] bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-60">
              {busy ? "Sending…" : "Send invite"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-[13px] text-slate-500">Your account uses a personal email address, so your StaffAnchor recruiter adds colleagues for you. Just ask them.</p>
        )}
        {data.canInvite && <p className="mt-2 text-[11.5px] text-slate-400">Only @{data.inviteDomain} addresses can be added here. For anyone else, ask your StaffAnchor recruiter.</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-[#ece7de] bg-white p-5">
        <h2 className="text-[14px] font-semibold text-slate-900">People with access</h2>
        <div className="mt-2 divide-y divide-[#f1ece3]">
          {data.members.map((m) => (
            <div key={m.email} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
              <span className="min-w-0 truncate text-slate-800">
                {m.full_name ? `${m.full_name} · ` : ""}
                {m.email}
                {m.is_me && <span className="ml-1.5 rounded-full bg-[#f4efe6] px-2 py-0.5 text-[11px] text-slate-500">You</span>}
              </span>
              <span className="shrink-0 text-[11.5px] text-slate-400">{m.last_login_at ? `Last seen ${new Date(m.last_login_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Not signed in yet"}</span>
            </div>
          ))}
          {data.pending.map((p) => (
            <div key={p.email} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 truncate text-slate-600">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {p.email}
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">Invite pending</span>
              </span>
              <button type="button" onClick={() => withdraw(p.email)} className="inline-flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-rose-600">
                <X className="h-3 w-3" /> Withdraw
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
