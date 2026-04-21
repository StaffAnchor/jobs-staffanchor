import { AuthGuard } from "@/components/common/auth-guard";
import { AdminLoading } from "@/components/common/admin-loading";

export default function DashboardLoading() {
  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminLoading
          title="Loading dashboard"
          subtitle="Fetching the latest profile and admin data."
        />
      </main>
    </AuthGuard>
  );
}
