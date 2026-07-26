"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { posthog } from "@/lib/posthog";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://jobs.staffanchor.com";

// Candidate-controlled public passport link -- a single toggle that turns
// on a read-only, no-login page (see /passport/[slug]) with a curated,
// non-sensitive field set (no phone/email) so a candidate can hand a
// hiring manager one URL instead of a resume attachment. Off by default;
// nothing is ever shared without the candidate explicitly enabling it here.
export default function SharePassportCard({
  slug,
  enabled,
  onChange,
}: {
  slug: string | null | undefined;
  enabled: boolean | null | undefined;
  onChange: (next: { slug: string | null; enabled: boolean }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = slug ? `${SITE_ORIGIN}/passport/${slug}` : null;

  async function handleToggle() {
    setBusy(true);
    try {
      if (enabled) {
        const { error } = await supabase.rpc("disable_my_public_passport");
        if (error) throw error;
        posthog.capture("passport_share_toggled", { enabled: false });
        onChange({ slug: slug ?? null, enabled: false });
      } else {
        const { data, error } = await supabase.rpc("enable_my_public_passport");
        if (error) throw error;
        posthog.capture("passport_share_toggled", { enabled: true });
        onChange({ slug: data as string, enabled: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update your passport link.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Shareable passport link</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              A public, read-only summary of your profile — send it straight to a hiring manager instead of a resume.
              Never shows your phone or email.
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-violet-600" : "bg-slate-200"
          } disabled:opacity-60`}
          aria-pressed={!!enabled}
        >
          {busy ? (
            <Loader2 className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          ) : (
            <span
              className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          )}
        </button>
      </div>

      {enabled && url && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <span className="flex-1 truncate text-xs text-slate-600">{url}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-violet-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:ring-slate-300"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
