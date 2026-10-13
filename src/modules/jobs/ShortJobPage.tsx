"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/ui/spinner";
import JobDetail from "@/modules/jobs/JobDetail";

// Opens a role from its short code and keeps the short address in the browser,
// so a shared link stays short (jobs.staffanchor.com/j/ab12cd). An unknown or
// closed code falls back to the jobs list.
export default function ShortJobPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [mandateId, setMandateId] = useState<string | null>(null);

  useEffect(() => {
    const clean = String(code ?? "").trim().toLowerCase();
    if (!/^[a-z0-9]{4,12}$/.test(clean)) {
      router.replace("/jobs");
      return;
    }
    let cancelled = false;
    supabase.rpc("resolve_job_code", { p_code: clean }).then(({ data }) => {
      if (cancelled) return;
      if (typeof data === "string") setMandateId(data);
      else router.replace("/jobs");
    });
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (!mandateId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return <JobDetail mandateId={mandateId} />;
}
