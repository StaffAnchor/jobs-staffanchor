"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateMyClientId, listMyMandates, type ClientMandate } from "@/modules/client-portal/api";
import { budgetLabel, categoryLabel, experienceLabel } from "@/modules/jobs/api";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  on_hold: "On hold",
  closed: "Closed",
  filled: "Filled",
};

export default function ClientPortalPage() {
  const router = useRouter();
  const [mandates, setMandates] = useState<ClientMandate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        await getOrCreateMyClientId();
        const rows = await listMyMandates();
        if (!cancelled) setMandates(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your roles.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.assign("/client-login");
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
        <p className="mt-2 text-sm text-slate-500">
          Please reach out to your StaffAnchor recruiter to confirm your access.
        </p>
      </div>
    );
  }

  if (!mandates) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Client Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Your open roles</h1>
          <p className="mt-1 text-sm text-slate-500">Review shortlists and share feedback with your recruiter.</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>

      {mandates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No roles have been assigned to your account yet. Your StaffAnchor recruiter will notify you once one
            is live.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mandates.map((m) => (
            <Link key={m.id} href={`/client-portal/mandates/${m.id}`}>
              <Card className="h-full transition hover:border-blue-300 hover:shadow-sm">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">{m.role_title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {categoryLabel(m.category)}
                    {m.sub_domain ? ` · ${m.sub_domain}` : ""}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    {m.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {m.city}
                      </span>
                    )}
                    <span>{experienceLabel(m.experience_min, m.experience_max)}</span>
                    <span>{budgetLabel(m.budget_min, m.budget_max)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-blue-700">
                    <Users className="h-3.5 w-3.5" />
                    {m.shortlisted_count} candidate{m.shortlisted_count === 1 ? "" : "s"} shortlisted
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
