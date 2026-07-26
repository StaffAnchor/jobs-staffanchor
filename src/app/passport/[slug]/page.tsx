"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, MapPin, Briefcase, IndianRupee, ShieldCheck, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { categoryLabel } from "@/modules/jobs/api";
import { posthog } from "@/lib/posthog";

type PublicPassport = {
  full_name: string | null;
  current_job_title: string | null;
  current_industry: string | null;
  current_location: string | null;
  total_experience_years: number | null;
  category: string | null;
  sub_domain: string | null;
  secondary_sub_domains: string[] | null;
  skills: string | null;
  industries: string[] | null;
  expected_fixed_ctc: number | null;
  notice_period: string | null;
  open_to_relocation: string | null;
  verification_level: number | null;
  ai_summary: string | null;
  candidate_number: number | null;
};

const VERIFICATION_LABEL: Record<number, string> = {
  0: "Self-reported",
  1: "Call-verified by StaffAnchor",
  2: "Reference-checked",
  3: "Outcome-confirmed",
};

// The public, no-login side of the candidate-controlled passport toggle
// (see SharePassportCard.tsx in the candidate portal). Deliberately shows
// only a curated, safe field set -- no phone, no email, no exact resume
// text -- pulled through get_public_passport(), a SECURITY DEFINER RPC that
// enforces public_profile_enabled = true server-side regardless of what
// this page requests.
export default function PublicPassportPage() {
  const params = useParams<{ slug: string }>();
  const [passport, setPassport] = useState<PublicPassport | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("get_public_passport", { p_slug: params.slug }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setPassport(null);
        return;
      }
      setPassport(data as PublicPassport);
      posthog.capture("passport_viewed", { slug: params.slug });
    });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (passport === undefined) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (passport === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <p className="text-lg font-semibold text-slate-900">This passport link isn&apos;t available</p>
        <p className="mt-2 text-sm text-slate-500">
          It may have been unpublished, or the link is incorrect.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Go to StaffAnchor
        </Link>
      </div>
    );
  }

  const otherIndustries = (passport.industries ?? []).filter((i) => i !== passport.current_industry);

  return (
    <div className="bg-[#f7f9fc] py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" /> StaffAnchor Sales Passport
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">{passport.full_name}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {passport.current_job_title}
                  {passport.current_industry ? ` · ${passport.current_industry}` : ""}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" /> {passport.current_location ?? "Location not shared"}
                  {passport.total_experience_years != null ? ` · ${passport.total_experience_years} yrs experience` : ""}
                </p>
              </div>
              {passport.verification_level != null && passport.verification_level > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> {VERIFICATION_LABEL[passport.verification_level]}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-8">
            {passport.ai_summary && <p className="text-sm leading-6 text-slate-700">{passport.ai_summary}</p>}

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Briefcase className="h-3 w-3" /> Function
                </p>
                <p className="mt-0.5 font-medium text-slate-800">{categoryLabel(passport.category)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Specialization</p>
                <p className="mt-0.5 font-medium text-slate-800">{passport.sub_domain ?? "—"}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <IndianRupee className="h-3 w-3" /> Expected CTC
                </p>
                <p className="mt-0.5 font-medium text-slate-800">
                  {passport.expected_fixed_ctc ? `₹${passport.expected_fixed_ctc}L` : "Not disclosed"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Days to join</p>
                <p className="mt-0.5 font-medium text-slate-800">{passport.notice_period ?? "—"}</p>
              </div>
            </div>

            {passport.open_to_relocation && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <BadgeCheck className="h-4 w-4 text-blue-500" /> Open to relocation: {passport.open_to_relocation}
              </div>
            )}

            {passport.skills && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {passport.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                        {s}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {otherIndustries.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Industries</p>
                <div className="flex flex-wrap gap-1.5">
                  {otherIndustries.map((i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center sm:px-8">
            <p className="text-xs text-slate-400">
              Verified and represented by{" "}
              <a href="https://www.staffanchor.com" className="font-semibold text-slate-600 hover:text-slate-800">
                StaffAnchor
              </a>
              {passport.candidate_number != null ? ` · Ref C-${String(passport.candidate_number).padStart(6, "0")}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
