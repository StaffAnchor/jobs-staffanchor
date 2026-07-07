"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { getMyShortlist, getResumeSignedUrl, type ShortlistCandidate } from "@/modules/client-portal/api";
import ClientFeedbackButtons from "@/modules/client-portal/ClientFeedbackButtons";

export default function ClientMandateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rows, setRows] = useState<ShortlistCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeUrls, setResumeUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/client-login");
        return;
      }

      try {
        const data = await getMyShortlist(params.id);
        if (cancelled) return;
        setRows(data);

        const entries = await Promise.all(
          data
            .filter((c) => c.resume_file_url)
            .map(async (c) => [c.candidate_id, await getResumeSignedUrl(c.resume_file_url!)] as const)
        );
        if (!cancelled) setResumeUrls(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this shortlist.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const recommended = rows.filter((r) => r.overall_recommendation === "Strong Fit");
  const others = rows.filter((r) => r.overall_recommendation !== "Strong Fit");
  const ordered = [...recommended, ...others];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/client-portal" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All your roles
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900">{rows[0]?.role_title ?? "Shortlist"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} candidate{rows.length === 1 ? "" : "s"} shortlisted for your review.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No candidates in this shortlist yet — your recruiter will add them here as they're screened.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordered.map((c) => (
            <Card key={c.link_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{c.full_name}</h2>
                      {c.overall_recommendation === "Strong Fit" && (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {c.current_job_title}
                      {c.current_employer ? ` at ${c.current_employer}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.current_location} · {c.total_experience_years ?? "—"} yrs experience
                    </p>
                  </div>
                  {c.resume_file_url && resumeUrls[c.candidate_id] && (
                    <a
                      href={resumeUrls[c.candidate_id]!}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Resume
                    </a>
                  )}
                </div>

                {c.ai_summary && <p className="mt-3 text-sm text-slate-700">{c.ai_summary}</p>}

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Sub-domain</p>
                    <p className="text-slate-700">{c.sub_domain ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expected fixed CTC</p>
                    <p className="text-slate-700">{c.expected_fixed_ctc ? `₹${c.expected_fixed_ctc}L` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Relocation — verified</p>
                    <p className="text-slate-700">{c.verified_relocation ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Notice period — verified</p>
                    <p className="text-slate-700">{c.verified_notice ?? "—"}</p>
                  </div>
                </div>

                <ClientFeedbackButtons linkId={c.link_id} current={c.client_feedback} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
