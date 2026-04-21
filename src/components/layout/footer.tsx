import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} StaffAnchor</p>
        {/* <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-slate-900">
            About
          </Link>
          <Link href="#" className="hover:text-slate-900">
            Contact
          </Link>
          <Link href="#" className="hover:text-slate-900">
            Privacy
          </Link>
        </div> */}
      </div>
    </footer>
  );
}
