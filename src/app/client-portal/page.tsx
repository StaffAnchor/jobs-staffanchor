"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { getClientOverview, getOrCreateMyClientId } from "@/modules/client-portal/api";
import OverviewView from "@/modules/client-portal/v2/OverviewView";
import type { ClientOverview } from "@/modules/client-portal/v2/types";

export default function ClientPortalPage() {
  const router = useRouter();
  const [data, setData] = useState<ClientOverview | null>(null);
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
        const overview = await getClientOverview();
        if (!cancelled) setData(overview);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your roles.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
        <p className="mt-2 text-sm text-slate-500">Please reach out to your StaffAnchor recruiter to confirm your access.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }
  return <OverviewView data={data} roleHref={(id) => `/client-portal/mandates/${id}`} requestHref="/client-portal/request-mandate" teamHref="/client-portal/team" />;
}
