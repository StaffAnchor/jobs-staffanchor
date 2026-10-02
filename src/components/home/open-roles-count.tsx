"use client";

import { useEffect, useState } from "react";
import { listOpenJobs } from "@/modules/jobs/api";

// A real number from the database (never a made-up statistic).
export default function OpenRolesCount() {
  const [n, setN] = useState<number | null>(null);
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
