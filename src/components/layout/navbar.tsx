"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/modules/auth/store";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, role, logout } = useAuthStore();
  const isCandidatesActive =
    pathname.startsWith("/dashboard/admin/candidates") ||
    pathname.startsWith("/dashboard/candidate-profile/");
  const isDashboardActive =
    pathname === "/dashboard" ||
    (role === "ADMIN" && pathname.startsWith("/dashboard/admin") && !isCandidatesActive);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          StaffAnchor
        </Link>
        <nav className="flex items-center gap-2">
          {!isAuthenticated && (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link href="/dashboard">
                <Button
                  variant={isDashboardActive ? "default" : "ghost"}
                  aria-current={isDashboardActive ? "page" : undefined}
                >
                  {role === "ADMIN" ? "Admin Dashboard" : "Dashboard"}
                </Button>
              </Link>
              {role === "ADMIN" && (
                <Link href="/dashboard/admin/candidates">
                  <Button
                    variant={isCandidatesActive ? "default" : "ghost"}
                    aria-current={isCandidatesActive ? "page" : undefined}
                  >
                    Candidates
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
