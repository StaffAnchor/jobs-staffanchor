"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/modules/auth/store";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, role, logout } = useAuthStore();
  const [candidateSignedIn, setCandidateSignedIn] = useState<boolean | null>(null);
  const isCandidatesActive =
    pathname.startsWith("/dashboard/admin/candidates") ||
    pathname.startsWith("/dashboard/candidate-profile/");
  const isDashboardActive =
    pathname === "/dashboard" ||
    (role === "ADMIN" && pathname.startsWith("/dashboard/admin") && !isCandidatesActive);

  // Client Portal pages (client-login, client-portal/*) are a completely
  // separate audience from candidates -- they should never see candidate-
  // facing nav items (All Jobs, Sign Up/Login, Build My Profile). Routed
  // purely off the URL namespace rather than session type, since both
  // candidates and clients authenticate through the same Supabase Auth
  // users table and telling them apart would need an extra client_users
  // lookup on every page just for the navbar.
  const isClientPortalArea = pathname.startsWith("/client-portal") || pathname.startsWith("/client-login");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCandidateSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCandidateSignedIn(!!session?.user);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (isClientPortalArea) {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/client-portal" className="text-lg font-bold tracking-tight text-slate-900">
            StaffAnchor
          </Link>
          <nav className="flex items-center gap-2">
            {candidateSignedIn && (
              <>
                <Link href="/client-portal">
                  <Button variant={pathname === "/client-portal" ? "default" : "ghost"}>My Hiring</Button>
                </Link>
                <Link href="/client-portal/request-mandate">
                  <Button variant={pathname.startsWith("/client-portal/request-mandate") ? "default" : "ghost"}>
                    Request a Role
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/client-login";
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          StaffAnchor
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/jobs">
            <Button variant={pathname.startsWith("/jobs") ? "default" : "ghost"}>All Jobs</Button>
          </Link>
          {candidateSignedIn ? (
            <Link href="/candidate-portal">
              <Button variant={pathname.startsWith("/candidate-portal") ? "default" : "ghost"}>My Account</Button>
            </Link>
          ) : (
            <Link href="/candidate-login">
              <Button variant={pathname.startsWith("/candidate-login") ? "default" : "ghost"}>Sign Up / Login</Button>
            </Link>
          )}
          {!isAuthenticated && (
            <Link href={candidateSignedIn ? "/candidate-portal" : "/register"}>
              <Button>Build My Profile</Button>
            </Link>
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
