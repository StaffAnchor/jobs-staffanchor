"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PLANS, planForYears, type PlanKey } from "@/lib/resume-plans";

type RazorpayCtor = new (o: Record<string, unknown>) => { open: () => void };
// The site already declares window.Razorpay for Priority Applicant, so it is only read here.
const razorpay = () => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;

const field = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-slate-900";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function OrderClient() {
  const sp = useSearchParams();
  const src = sp.get("src") ?? "";
  const [years, setYears] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", consent: false, website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakeUrl, setIntakeUrl] = useState<string | null>(null);

  const y = years.trim() === "" ? null : Number(years);
  const valid = y !== null && Number.isInteger(y) && y >= 0 && y <= 50;
  const plan: PlanKey | null = valid ? planForYears(y!) : null;
  const detailsOk = valid && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 10 && form.consent;

  async function pay() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/resume/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, experienceYears: y, src }),
    });
    const json = await res.json().catch(() => ({ ok: false, error: "Something went wrong." }));
    if (!json.ok || !json.orderId) {
      setBusy(false);
      return setError(json.error ?? "Couldn't start the payment.");
    }
    const Rz = razorpay();
    if (!Rz) {
      setBusy(false);
      return setError("The payment window didn't load. Please refresh and try again.");
    }
    const rz = new Rz({
      key: json.keyId,
      amount: json.amountPaise,
      currency: "INR",
      order_id: json.orderId,
      name: "StaffAnchor",
      description: json.title,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: "#111111" },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setError("Payment wasn't completed. You can try again whenever you're ready.");
        },
      },
      handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const v = await fetch("/api/resume/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
        });
        const vj = await v.json().catch(() => ({ ok: false }));
        setBusy(false);
        if (vj.ok) setIntakeUrl(vj.intakeUrl);
        else setError("Your payment went through but we couldn't confirm it on screen. You'll get an email shortly; if not, write to info@staffanchor.com with your payment receipt.");
      },
    });
    rz.open();
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE] px-4 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm md:p-9">
        {intakeUrl ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Order confirmed</h1>
            <p className="text-[15px] text-slate-600">Next, tell us about your career so far. It takes about 15 minutes. We have also emailed you the link.</p>
            <a href={intakeUrl} className="inline-flex items-center rounded-xl bg-slate-950 px-6 py-3 text-[15px] font-semibold text-white">
              Fill in my details <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-slate-900">Order your resume</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Professionally written, ATS-friendly, and delivered as Word and PDF. The price depends on your years of experience, nothing else, and includes GST.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Your total years of experience</label>
              <input className={field} inputMode="numeric" placeholder="For example 8" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(PLANS) as PlanKey[]).map((k) => {
                const p = PLANS[k];
                const on = plan === k;
                return (
                  <div key={k} className={`rounded-2xl border p-4 text-sm ${on ? "border-slate-900 bg-slate-50" : "border-slate-200 opacity-70"}`}>
                    <p className="font-semibold text-slate-900">{p.label}</p>
                    <p className="text-slate-500">{p.band}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{inr(p.price)}</p>
                    <p className="text-xs text-slate-500">incl. GST</p>
                    <p className="mt-1 text-xs text-slate-500">{p.revisions} revision round{p.revisions > 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
            {plan && (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                For {y} {y === 1 ? "year" : "years"} of experience your plan is <b>{PLANS[plan].label}</b>: {inr(PLANS[plan].price)}. First draft 3 working days after your details, final resume in {PLANS[plan].finalDelivery}.
              </p>
            )}

            <div className="space-y-3">
              <input className={field} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              <input className={field} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              <input className={field} placeholder="Mobile number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden="true" />
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>I agree to the <a className="underline" href="https://www.staffanchor.com/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a className="underline" href="https://www.staffanchor.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={pay} disabled={!detailsOk || busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40">
              {busy ? "Please wait…" : plan ? `Pay ${inr(PLANS[plan].price)}` : "Enter your experience to continue"} {!busy && plan && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
