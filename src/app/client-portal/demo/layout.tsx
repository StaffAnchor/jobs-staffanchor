import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client portal preview | StaffAnchor",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
