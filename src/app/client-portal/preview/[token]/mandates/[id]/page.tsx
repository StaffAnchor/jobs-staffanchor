"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getPreviewRoleBoard, previewOnePagerGetter, previewResumeUrlGetter } from "@/modules/client-portal/api";
import RoleBoardView from "@/modules/client-portal/v2/RoleBoardView";
import type { RoleBoard } from "@/modules/client-portal/v2/types";

// One role's shortlist as the client sees it, for an admin. Feedback buttons do nothing here: this is a preview.
export default function ClientPortalPreviewRolePage() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const [board, setBoard] = useState<RoleBoard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPreviewRoleBoard(token, id)
      .then((b) => !cancelled && setBoard(b))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load this role."));
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const getResumeUrl = useMemo(() => previewResumeUrlGetter(token), [token]);
  const getOnePager = useMemo(() => previewOnePagerGetter(token), [token]);

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
      getResumeUrl={getResumeUrl}
      getOnePager={getOnePager}
      backHref={`/client-portal/preview/${token}`}
      onFeedback={async () => {
        toast("Preview only: nothing was saved.");
      }}
      banner={
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          Admin preview, read only. This is what the client sees. Buttons here do not save anything.
        </p>
      }
    />
  );
}
