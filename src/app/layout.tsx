import type { Metadata } from "next";
import { Manrope, Space_Grotesk, Fraunces } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Serif display face used for a single accent phrase inside the homepage
// hero headline (italic, brand-accent colour) -- matches the same treatment
// applied on staffanchor.com so both properties share the trick, not just
// the flat sans-serif everywhere.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "StaffAnchor | Sales Recruitment Specialists",
  description: "StaffAnchor is a specialist recruitment firm for B2B and B2C sales talent — BDRs, AEs, sales managers, and sales leadership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,#f6f9ff_0%,#ffffff_40%)] text-slate-900">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
