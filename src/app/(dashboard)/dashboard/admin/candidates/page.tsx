"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/auth-guard";
import { AdminLoading } from "@/components/common/admin-loading";
import { CandidateFilter } from "@/components/common/candidate-filter";
import { adminApi } from "@/modules/admin/api";
import type { AdminCandidateFilterInput } from "@/modules/admin/types";

export default function AdminCandidatesPage() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filters, setFilters] = useState<AdminCandidateFilterInput>({ page: 1, limit: 20 });

  const candidatesQuery = useQuery({
    queryKey: ["admin-candidates", filters],
    queryFn: () => adminApi.filterCandidates(filters),
    placeholderData: keepPreviousData,
  });

  const handleFilter = (newFilters: AdminCandidateFilterInput) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatExperience = (value: string | null) => {
    if (!value) {
      return "N/A";
    }

    const experienceRangeLabels: Record<string, string> = {
      FRESHER: "Fresher",
      LT_1: "Less than 1 year",
      Y1_2: "1 - 2 years",
      Y2_3: "2 - 3 years",
      Y3_5: "3 - 5 years",
      Y5_7: "5 - 7 years",
      Y7_10: "7 - 10 years",
      Y10_12: "10 - 12 years",
      Y12_15: "12 - 15 years",
      Y15_20: "15 - 20 years",
      GT_20: "More than 20 years",
    };

    if (experienceRangeLabels[value]) {
      return experienceRangeLabels[value];
    }

    return value;
  };

  const totalPages = candidatesQuery.data
    ? Math.max(1, Math.ceil(candidatesQuery.data.total / candidatesQuery.data.limit))
    : 1;
  const isRefreshingResults = candidatesQuery.isFetching && Boolean(candidatesQuery.data);

  const renderSkills = (skills?: string[] | null) => {
    if (!skills?.length) {
      return <span className="text-slate-500">N/A</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, 3).map((skill) => (
          <Badge key={skill} className="border border-slate-200 bg-slate-50 text-slate-700">
            {skill}
          </Badge>
        ))}
        {skills.length > 3 ? (
          <Badge className="border border-slate-200 bg-slate-50 text-slate-700">+{skills.length - 3}</Badge>
        ) : null}
      </div>
    );
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <main className="w-full px-2 py-6 sm:px-3 lg:px-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manage Candidates</h1>
              <p className="text-slate-600 mt-1">
                Search and review candidate profiles with focused filters
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="gap-2"
            >
              {isFilterOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              {isFilterOpen ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className="flex gap-4">
            {isFilterOpen ? (
              <aside className="w-full max-w-sm shrink-0">
                <CandidateFilter onFilter={handleFilter} isLoading={candidatesQuery.isFetching} />
              </aside>
            ) : null}

            <section className="min-w-0 flex-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Candidates
                      {candidatesQuery.data?.total !== undefined && (
                        <span className="text-sm font-normal text-slate-500 ml-2">
                          ({candidatesQuery.data.total} total)
                        </span>
                      )}
                    </CardTitle>
                    {candidatesQuery.isFetching ? (
                      <AdminLoading compact title="Refreshing results" />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {isRefreshingResults ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/80 backdrop-blur-[1px]">
                      <AdminLoading compact title="Applying filters..." />
                    </div>
                  ) : null}
                  {candidatesQuery.isLoading ? (
                    <>
                      <AdminLoading
                        title="Loading candidates"
                        subtitle="Fetching candidate rows and applied filters."
                      />
                      <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-12 animate-pulse rounded-md border border-slate-200 bg-slate-100"
                          />
                        ))}
                      </div>
                    </>
                  ) : candidatesQuery.data?.items?.length ? (
                    <>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">City</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Profile Update</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Current Job Title</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Skills</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Current Fixed Salary</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Total Work Experience</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Total Sales Experience</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {candidatesQuery.data.items.map((candidate) => (
                              <tr
                                key={candidate.id}
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => router.push(`/dashboard/candidate-profile/${candidate.id}`)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    router.push(`/dashboard/candidate-profile/${candidate.id}`);
                                  }
                                }}
                                role="link"
                                tabIndex={0}
                              >
                                <td className="px-4 py-3 align-top">
                                  <Link
                                    href={`/dashboard/candidate-profile/${candidate.id}`}
                                    className="font-semibold text-slate-900 hover:text-blue-700"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    {candidate.name}
                                  </Link>
                                </td>
                                <td className="px-4 py-3 align-top text-slate-700">{candidate.city ?? "N/A"}</td>
                                <td className="px-4 py-3 align-top text-slate-700">
                                  {formatDateTime(candidate.lastProfileUpdatedAt)}
                                </td>
                                <td className="px-4 py-3 align-top text-slate-700">{candidate.email}</td>
                                <td className="px-4 py-3 align-top text-slate-700">{candidate.phone}</td>
                                <td className="px-4 py-3 align-top text-slate-700">{candidate.currentJobTitle ?? "N/A"}</td>
                                <td className="px-4 py-3 align-top">{renderSkills(candidate.skills)}</td>
                                <td className="px-4 py-3 align-top text-slate-700">{candidate.currentFixedSalary ?? "N/A"}</td>
                                <td className="px-4 py-3 align-top text-slate-700">
                                  {formatExperience(candidate.totalWorkExperience)}
                                </td>
                                <td className="px-4 py-3 align-top text-slate-700">
                                  {formatExperience(candidate.totalSalesExperience)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {candidatesQuery.data && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                          <p className="text-sm text-slate-600">
                            Page{" "}
                            <span className="font-semibold">
                              {candidatesQuery.data.page}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold">
                              {totalPages}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handlePageChange(
                                  Math.max(1, candidatesQuery.data.page - 1)
                                )
                              }
                              disabled={
                                candidatesQuery.data.page === 1 ||
                                candidatesQuery.isFetching
                              }
                              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() =>
                                handlePageChange(candidatesQuery.data.page + 1)
                              }
                              disabled={
                                candidatesQuery.data.page >=
                                  totalPages || candidatesQuery.isFetching
                              }
                              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                      </div>
                      )}
                    </>
                  ) : candidatesQuery.data ? (
                    <div className="text-center py-12">
                      <p className="text-slate-600">No candidates found</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600">
                        👋 Start browsing candidates
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Use the filters above to search and filter candidates
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}