"use client";

import { useParams } from "next/navigation";
import JobDetail from "@/modules/jobs/JobDetail";

export default function JobPage() {
  const params = useParams<{ id: string }>();
  return <JobDetail mandateId={params.id} />;
}
