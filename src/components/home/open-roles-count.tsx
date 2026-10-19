"use client";

import { useEffect, useState } from "react";
import { listOpenJobs } from "@/modules/jobs/api";

// A real number from the database (never a made-up statistic).
export default function OpenRolesCount({ initial = null }: { initial?: number | null }) {
  // Starts from the number the server already fetched, so the page never shows a placeholder dash.
  const [n, setN] = useState<number | null>(initial);
  useEffect(() => {
    let cancelled = false;
    listOpenJobs()
      .then((j) => {
        if (!cancelled) setN(j.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return <>{n ?? "—"}</>;
}
