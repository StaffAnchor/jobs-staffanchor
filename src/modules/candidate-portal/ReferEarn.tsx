"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gift, IndianRupee, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { supabase } from "@/lib/supabaseClient";

type Referral = {
  id: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string | null;
  status: string;
  reward_amount: number | null;
  created_at: string;
  placed_at: string | null;
  paid_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  referred: "Referred",
  registered: "Registered",
  submitted: "Submitted to a client",
  interviewing: "Interviewing",
  placed: "Placed — payout pending",
  paid: "Paid out",
  not_selected: "Not selected this time",
};

const STATUS_COLORS: Record<string, string> = {
  referred: "bg-slate-100 text-slate-600",
  registered: "bg-blue-100 text-blue-700",
  submitted: "bg-indigo-100 text-indigo-700",
  interviewing: "bg-cyan-100 text-cyan-700",
  placed: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  not_selected: "bg-red-100 text-red-600",
};

export default function ReferEarn() {
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReferrals() {
    const { data, error } = await supabase.rpc("get_my_referrals");
    if (error) {
      setError(error.message);
      return;
    }
    setReferrals((data ?? []) as Referral[]);
  }

  useEffect(() => {
    loadReferrals();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Please enter their name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_referral", {
      p_name: form.name.trim(),
      p_email: form.email.trim(),
      p_phone: form.phone.trim() || null,
      p_note: form.note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success(`Thanks! We'll reach out to ${form.name.trim()}.`);
    setForm({ name: "", email: "", phone: "", note: "" });
    loadReferrals();
  }

  const paidTotal = (referrals ?? [])
    .filter((r) => r.status === "paid" && r.reward_amount)
    .reduce((sum, r) => sum + Number(r.reward_amount), 0);
  const activeCount = (referrals ?? []).filter((r) => r.status !== "not_selected").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 lg:order-2">
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-900">Refer & earn up to ₹10,000</p>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Know someone great in sales? Refer them below. If they get placed through StaffAnchor and stay
              in the role for 90 days, you earn a reward of up to ₹10,000 — no limit on how many people you
              can refer.
            </p>
            <div className="grid grid-cols-2 gap-2 border-t border-blue-100 pt-3 text-center">
              <div>
                <p className="text-lg font-bold text-slate-900">{activeCount}</p>
                <p className="text-[11px] text-slate-500">Active referrals</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-0.5 text-lg font-bold text-emerald-700">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {paidTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-500">Earned so far</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-5">
            <p className="mb-3 text-sm font-semibold text-slate-900">Refer someone</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormField label="Their name">
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </FormField>
              <FormField label="Their email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Their phone (optional)">
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </FormField>
              <FormField label="Anything we should know? (optional)">
                <Textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </FormField>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit referral"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:order-1">
        <p className="mb-3 text-sm text-slate-500">Track every person you've referred and where they stand.</p>
        {referrals === null ? (
          <p className="text-sm text-slate-400">Loading your referrals…</p>
        ) : referrals.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-10 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-500">
                You haven&apos;t referred anyone yet. Use the form to refer your first candidate.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {referrals.map((r) => (
              <Card key={r.id} className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{r.referred_name}</p>
                    <p className="truncate text-xs text-slate-500">{r.referred_email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.reward_amount != null && (
                      <span className="text-xs font-semibold text-emerald-700">
                        ₹{Number(r.reward_amount).toLocaleString("en-IN")}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                        STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
