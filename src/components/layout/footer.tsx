"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Authenticated app shells (candidate portal, client portal, legacy dashboard)
// have their own in-app navigation/sign-out already, so the public marketing
// footer -- and especially a stray "Client Login" link -- doesn't belong
// there. It was showing up on every page, including a candidate's own
// account, which is confusing (why would a candidate need a client login?).
const AUTHENTICATED_APP_PREFIXES = ["/candidate-portal", "/client-portal", "/dashboard"];

export function Footer() {
  const pathname = usePathname();
  const isAuthenticatedApp = AUTHENTICATED_APP_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isAuthenticatedApp) return null;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} StaffAnchor</p>
        <Link href="/client-login" className="text-xs text-slate-400 hover:text-slate-600">
          Client Login
        </Link>
      </div>
    </footer>
  );
}
