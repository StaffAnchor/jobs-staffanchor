"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore, type UserRole } from "@/modules/auth/store";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (roles?.length && role && !roles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, pathname, role, roles, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (roles?.length && role && !roles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
