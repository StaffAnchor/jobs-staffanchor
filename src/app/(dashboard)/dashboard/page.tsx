"use client";

import { AuthGuard } from "@/components/common/auth-guard";
import { AdminDashboard } from "@/components/common/admin-dashboard";
import { CandidateDashboard } from "@/components/common/candidate-dashboard";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store";
import { userApi } from "@/modules/user/api";

export default function DashboardPage() {
  const { role: storedRole, isAuthenticated, hasHydrated } = useAuthStore();
  const { data: account } = useQuery({
    queryKey: ["user-me"],
    queryFn: userApi.me,
    enabled: hasHydrated && isAuthenticated,
  });
  const role = storedRole ?? account?.role ?? null;

  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {role === "ADMIN" ? (
          <AdminDashboard />
        ) : (
          <CandidateDashboard />
        )}
      </main>
    </AuthGuard>
  );
}
