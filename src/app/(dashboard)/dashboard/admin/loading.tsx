import { AuthGuard } from "@/components/common/auth-guard";
import { AdminLoading } from "@/components/common/admin-loading";

export default function AdminRoutesLoading() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <main className="w-full px-2 py-6 sm:px-3 lg:px-4">
        <AdminLoading
          title="Loading admin page"
          subtitle="Preparing candidate management data."
        />
      </main>
    </AuthGuard>
  );
}
