"use client";

import { useCallback, useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptLoadPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load payment checkout. Check your connection and try again."));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

export type PurchaseResult = { creditsGranted: number; remainingBalance: number; autoAppliedToLinkId: string | null };

// Shared Razorpay checkout flow used by every Priority Applicant purchase
// surface (product page, apply-flow upsell, confirmation-page card, portal
// tile). Handles: create order -> open Razorpay Checkout modal -> verify
// signature server-side -> report result. Never touches money client-side;
// the two API calls (create-order, verify) do all the real work.
export function usePriorityCheckout() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(
    (params: { candidateId: string; tier: number; mandateId?: string | null }): Promise<PurchaseResult | null> => {
      return new Promise((resolve) => {
        (async () => {
          setStatus("loading");
          setError(null);
          try {
            await loadRazorpayScript();

            const orderRes = await fetch("/api/priority/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: params.candidateId, tier: params.tier, mandateId: params.mandateId ?? null }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error ?? "Couldn't start payment.");

            const rzp = new window.Razorpay({
              key: orderData.keyId,
              amount: orderData.amount,
              currency: orderData.currency,
              name: "StaffAnchor",
              description: "Priority Applicant",
              order_id: orderData.orderId,
              prefill: { name: orderData.candidateName ?? "", email: orderData.candidateEmail ?? "" },
              theme: { color: "#4f46e5" },
              handler: async (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
              }) => {
                try {
                  const verifyRes = await fetch("/api/priority/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(response),
                  });
                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed.");
                  setStatus("idle");
                  resolve(verifyData as PurchaseResult);
                } catch (e) {
                  setStatus("error");
                  setError(e instanceof Error ? e.message : "Payment verification failed.");
                  resolve(null);
                }
              },
              modal: {
                ondismiss: () => {
                  // Candidate closed the checkout without paying -- not an
                  // error, just a no-op ("Never mind, continue" case).
                  setStatus("idle");
                  resolve(null);
                },
              },
            });
            rzp.open();
          } catch (e) {
            setStatus("error");
            setError(e instanceof Error ? e.message : "Couldn't start payment.");
            resolve(null);
          }
        })();
      });
    },
    []
  );

  return { purchase, status, error };
}
