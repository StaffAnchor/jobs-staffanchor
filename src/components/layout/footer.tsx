"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import EdgePromo from "@/components/edge/edge-promo";

// Authenticated app shells (candidate portal, client portal, legacy dashboard)
// have their own in-app navigation/sign-out already, so the public marketing
// footer -- and especially a stray "Client Login" link -- doesn't belong
// there. It was showing up on every page, including a candidate's own
// account, which is confusing (why would a candidate need a client login?).
const AUTHENTICATED_APP_PREFIXES = ["/candidate-portal", "/client-portal", "/dashboard"];

// Pages where the Edge line in the footer would be noise: Edge and resume pages themselves, sign-in and sign-up, onboarding,
// and the pages that carry their own promotion (job pages, the jobs list, city pages, the free tools).
const NO_PROMO = [/^\/edge/, /^\/resume/, /^\/(login|register|candidate-login|client-login|forgot-password|reset-password|verify-email|onboarding)/, /^\/jobs\/[^/]+/, /^\/jobs$/, /^\/jobs-in\//, /^\/ats-score/, /^\/mock-interview/, /^\/j\//, /^\/l\//, /^\/refer/, /^\/passport/];

export function Footer() {
  const pathname = usePathname();
  const isAuthenticatedApp = AUTHENTICATED_APP_PREFIXES.some((p) => pathname?.startsWith(p));

  // The candidate's private Sales CV form link is a focused page, so it has no site footer either.
  if (isAuthenticatedApp || pathname?.startsWith("/edge/cv")) return null;

  const promo = !NO_PROMO.some((re) => re.test(pathname ?? ""));

  return (
    <footer className="mt-auto bg-slate-50">
      {promo && <EdgePromo variant="footer" page="footer" />}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} StaffAnchor</p>
        <div className="flex items-center gap-4">
          <a href="https://www.staffanchor.com" className="py-2 text-xs text-slate-400 hover:text-slate-600">
            staffanchor.com
          </a>
          <Link href="/client-login" className="py-2 text-xs text-slate-400 hover:text-slate-600">
            Client Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
