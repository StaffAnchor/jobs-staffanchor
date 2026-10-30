"use client";

import { useCallback, useState } from "react";
import { PAID_CALL_RUPEES } from "@/lib/paid-call";

// The other paid pages (resume orders, Edge bookings) read this same global, so it is declared once here.
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
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Couldn't load payment checkout. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

// Create the order, open Razorpay, then let the server check the payment signature. Resolves true only when the
// server has confirmed the payment; closing the checkout is not an error.
export function usePaidCallCheckout() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback((params: { candidateId: string; mandateId: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      (async () => {
        setStatus("loading");
        setError(null);
        try {
          await loadRazorpayScript();
          const orderRes = await fetch("/api/paid-call/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
          const order = await orderRes.json().catch(() => ({}));
          if (!orderRes.ok) throw new Error(order.error ?? "Couldn't start payment.");
          const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "StaffAnchor",
            description: `Recruiter call · ₹${PAID_CALL_RUPEES}`,
            order_id: order.orderId,
            prefill: { name: order.candidateName ?? "", email: order.candidateEmail ?? "" },
            theme: { color: "#0f766e" },
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              try {
                const res = await fetch("/api/paid-call/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
                const d = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(d.error ?? "Payment verification failed.");
                setStatus("idle");
                resolve(true);
              } catch (e) {
                setStatus("error");
                setError(e instanceof Error ? e.message : "Payment verification failed.");
                resolve(false);
              }
            },
            modal: {
              ondismiss: () => {
                setStatus("idle");
                resolve(false);
              },
            },
          });
          rzp.open();
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Couldn't start payment.");
          resolve(false);
        }
      })();
    });
  }, []);

  return { pay, status, error };
}
