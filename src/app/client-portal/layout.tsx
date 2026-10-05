// Warm, calm canvas for every client portal page.
export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[calc(100vh-61px)] bg-[#faf8f4]">{children}</div>;
}
