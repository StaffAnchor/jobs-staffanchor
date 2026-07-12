"use client";

import { useState } from "react";
import { UserCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { categoryOptions } from "@/modules/apply/options";

// Closes a real gap: get_or_create_my_candidate_profile() (called the moment
// someone verifies their magic-link sign-in) inserts a candidates row with
// full_name = '' and nothing else -- so a person who signs in and then
// closes the tab leaves behind a ghost row with only an email address,
// useless to a recruiter trying to follow up. This gate blocks the rest of
// the portal until Name, Phone, and Function/Domain are captured, so even
// someone who never returns has left a usable lead (name + phone + email +
// function) instead of nothing. Shown only when any of those three are
// still missing; the full profile wizard (My Profile tab) remains where
// everything else gets filled in on their own time.
export default function MandatoryBasicsGate({
  candidateId,
  email,
  onComplete,
}: {
  candidateId: string;
  email: string;
  onComplete: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return setError("Full name is required.");
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) return setError("A valid 10-digit phone number is required.");
    if (!category) return setError("Please select Function / Domain.");

    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        full_name: fullName.trim(),
        phone: phone.replace(/\D/g, ""),
        category,
      })
      .eq("id", candidateId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onComplete();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <UserCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900">A few basics first</h1>
            <p className="text-[13px] text-slate-500">Just three quick fields -- you can fill in the rest of your profile after.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">Email</label>
            <input
              disabled
              value={email}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">
              Function / Domain <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Select...</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
