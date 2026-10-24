"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { getPreviewOverview } from "@/modules/client-portal/api";
import OverviewView from "@/modules/client-portal/v2/OverviewView";
import type { ClientOverview } from "@/modules/client-portal/v2/types";

// What a client sees on their portal home, opened by an admin from the CRM. Read only, no sign-in, expires in 30 minutes.
export default function ClientPortalPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ClientOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPreviewOverview(token)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load the preview."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
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
  return (
    <OverviewView
      data={data}
      roleHref={(id) => `/client-portal/preview/${token}/mandates/${id}`}
      banner={
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          Admin preview, read only. This is what the client sees. Nothing you click here is saved, and this link stops working after 30 minutes.
        </p>
      }
    />
  );
}
