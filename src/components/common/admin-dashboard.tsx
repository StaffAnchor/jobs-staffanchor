"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin } from "lucide-react";
import { adminApi } from "../../modules/admin/api";
import { AdminLoading } from "@/components/common/admin-loading";
import type { AdminCandidateTableRow } from "@/modules/admin/types";

export function AdminDashboard() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-candidates-overview"],
    queryFn: () => adminApi.getCandidates({ page: 1, limit: 5 }),
  });

  const candidates = stats?.items ?? [];

  const formatUpdatedAt = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/dashboard/admin/candidates")}>
            Manage Candidates
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/candidates")}> 
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Recent Candidates</span>
            <Badge>{stats?.total ?? 0} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <AdminLoading compact title="Loading recent candidates" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            </>
          ) : candidates.length ? (
            <div className="space-y-3">
              {candidates.map((candidate: AdminCandidateTableRow) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/candidate-profile/${candidate.id}`)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{candidate.name}</p>
                      <p className="text-sm text-slate-600">{candidate.email} • {candidate.phone}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {candidate.city ?? "City not provided"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge>{candidate.currentJobTitle ?? "Role not provided"}</Badge>
                      <span className="text-sm text-slate-500">
                        Updated: {formatUpdatedAt(candidate.lastProfileUpdatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/admin/candidates")}>
                View All Candidates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No candidates found.
            </div>
          )}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            <strong className="mr-1">Admin:</strong>
            Use the candidates page to browse, paginate, and apply advanced filters across full profile data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
