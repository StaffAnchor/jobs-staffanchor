"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, Zap } from "lucide-react";
import { logPriorityClick } from "@/lib/priority-click";
import { useAuthStore } from "@/modules/auth/store";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import NotificationBell from "./notification-bell";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, role, logout } = useAuthStore();
  const [candidateSignedIn, setCandidateSignedIn] = useState<boolean | null>(null);
  // The phone menu is open only for the page it was opened on, so navigating
  // (including browser back/forward) closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const isCandidatesActive =
    pathname.startsWith("/dashboard/admin/candidates") ||
    pathname.startsWith("/dashboard/candidate-profile/");
  const isDashboardActive =
    pathname === "/dashboard" ||
    (role === "ADMIN" && pathname.startsWith("/dashboard/admin") && !isCandidatesActive);

  // Client Portal pages (client-login, client-portal/*) are a completely
  // separate audience from candidates -- they should never see candidate-
  // facing nav items (Current Openings, Sign Up/Login, Build My Profile). Routed
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
          <Link href="/client-portal" className="flex items-center">
            <Image src="/Staffanchor_Logo.svg" alt="StaffAnchor" width={116} height={40} priority className="h-9 w-auto" />
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

  const closeMenu = () => setMenuPath(null);
  const signedOut = !isAuthenticated && !candidateSignedIn;

  async function candidateLogout() {
    await supabase.auth.signOut();
    window.location.href = "/candidate-login";
  }

  const mobileLink = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={closeMenu}
      className={`flex h-12 items-center rounded-xl px-4 text-[15px] font-semibold ${
        active ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* Which StaffAnchor site you are on, and a way across. The company site
          (employers, services, about) and this Job Portal are separate
          properties; this strip makes the relationship obvious and gives
          candidates a one-click way back. */}
      <div className="bg-[#0A1630]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[12.5px] sm:px-6 lg:px-8">
          <div className="flex h-full items-stretch">
            <a
              href="https://www.staffanchor.com"
              className="flex items-center gap-1 pr-4 font-medium text-blue-100/75 transition hover:text-white"
            >
              StaffAnchor.com <ArrowUpRight className="h-3 w-3" />
            </a>
            <Link
              href="/"
              aria-current="page"
              onClick={closeMenu}
              className="flex items-center border-b-2 border-blue-400 px-1 font-semibold text-white"
            >
              Job Portal
            </Link>
          </div>
          <a
            href="https://www.staffanchor.com/employers"
            className="hidden items-center gap-1 font-medium text-blue-100/75 transition hover:text-white sm:flex"
          >
            Hiring? For employers <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" onClick={closeMenu}>
          <Image src="/Staffanchor_Logo.svg" alt="StaffAnchor" width={116} height={40} priority className="h-9 w-auto" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/jobs">
            <Button variant={pathname.startsWith("/jobs") ? "default" : "ghost"}>Current Openings</Button>
          </Link>
          <Link href="/mock-interview">
            <Button variant={pathname.startsWith("/mock-interview") ? "default" : "ghost"}>Mock Interview</Button>
          </Link>
          <Link href="/ats-score">
            <Button variant={pathname.startsWith("/ats-score") ? "default" : "ghost"}>ATS Score</Button>
          </Link>
          {/* Standout gradient pill -- the one paid upsell in the nav, so it
              is deliberately not styled like the free utility links. */}
          <Link
            href="/priority-applicant"
            onClick={() => logPriorityClick("nav_pill")}
            className="group relative mx-0.5 flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-transform duration-200 hover:scale-105 hover:shadow-md hover:shadow-indigo-500/35"
          >
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            Priority Applicant
          </Link>
          {candidateSignedIn && (
            <>
              <NotificationBell />
              <Link href="/candidate-portal">
                <Button variant={pathname.startsWith("/candidate-portal") ? "default" : "ghost"}>My Account</Button>
              </Link>
              <Button variant="outline" onClick={candidateLogout}>
                Log out
              </Button>
            </>
          )}
          {/* Two clearly different jobs: come back (sign in) vs start (create a profile). */}
          {signedOut && (
            <>
              <Link href="/candidate-login">
                <Button variant={pathname.startsWith("/candidate-login") ? "default" : "ghost"}>Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Create free profile</Button>
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

        {/* Phone: logo, one primary action, and a menu. Nothing wraps. */}
        <div className="flex items-center gap-1.5 md:hidden">
          {candidateSignedIn && <NotificationBell />}
          {signedOut && (
            <Link
              href="/candidate-login"
              onClick={closeMenu}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuPath(menuOpen ? null : pathname)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100vh-6.25rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {mobileLink("/jobs", "Current Openings", pathname.startsWith("/jobs"))}
            {mobileLink("/mock-interview", "Mock Interview", pathname.startsWith("/mock-interview"))}
            {mobileLink("/ats-score", "ATS Score", pathname.startsWith("/ats-score"))}
            <Link
              href="/priority-applicant"
              onClick={() => {
                logPriorityClick("nav_pill");
                closeMenu();
              }}
              className="mt-1 flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-[15px] font-semibold text-white"
            >
              <Zap className="h-4 w-4" /> Priority Applicant
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
            {signedOut && (
              <>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="flex h-12 items-center justify-center rounded-xl bg-blue-600 text-[15px] font-semibold text-white"
                >
                  Create free profile
                </Link>
                <Link
                  href="/candidate-login"
                  onClick={closeMenu}
                  className="flex h-12 items-center justify-center rounded-xl border border-slate-300 text-[15px] font-semibold text-slate-800"
                >
                  Sign in
                </Link>
              </>
            )}
            {candidateSignedIn && (
              <>
                {mobileLink("/candidate-portal", "My Account", pathname.startsWith("/candidate-portal"))}
                <button
                  type="button"
                  onClick={candidateLogout}
                  className="flex h-12 items-center rounded-xl px-4 text-left text-[15px] font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Log out
                </button>
              </>
            )}
            {isAuthenticated && (
              <>
                {mobileLink("/dashboard", role === "ADMIN" ? "Admin Dashboard" : "Dashboard", isDashboardActive)}
                {role === "ADMIN" && mobileLink("/dashboard/admin/candidates", "Candidates", isCandidatesActive)}
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="flex h-12 items-center rounded-xl px-4 text-left text-[15px] font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
