import { Suspense } from "react";
import type { Metadata } from "next";
import OrderClient from "./order-client";

export const metadata: Metadata = {
  title: "Order Resume Writing | StaffAnchor",
  description: "A professionally written, ATS-friendly resume for sales professionals. Priced by years of experience.",
  robots: { index: false },
};

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderClient />
    </Suspense>
  );
}
