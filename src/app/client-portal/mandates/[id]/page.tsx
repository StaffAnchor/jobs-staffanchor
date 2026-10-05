"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { getResumeSignedUrl, getRoleBoard, submitMyFeedback } from "@/modules/client-portal/api";
import RoleBoardView from "@/modules/client-portal/v2/RoleBoardView";
import type { RoleBoard } from "@/modules/client-portal/v2/types";

export default function ClientMandateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [board, setBoard] = useState<RoleBoard | null>(null);
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
        const data = await getRoleBoard(params.id);
        if (!cancelled) setBoard(data);
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
  if (!board) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }
  return (
    <RoleBoardView
      board={board}
      backHref="/client-portal"
      getResumeUrl={getResumeSignedUrl}
      onFeedback={async (linkId, value, at) => {
        await submitMyFeedback(linkId, value, at);
        // A proposed interview time is the one thing a recruiter must act on: email them.
        if (value === "interview_requested") {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            fetch("/api/client/interview-request", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ linkId }),
            }).catch(() => {});
          }
        }
      }}
    />
  );
}
