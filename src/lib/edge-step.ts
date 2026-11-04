// Tells the server which step of the Edge booking or resume order a visitor has reached, so the CRM can show where people
// drop off. Fire and forget: it never blocks the page and does nothing if storage or the network is unavailable.
//
// To keep your own testing out of the numbers, open any page once with ?me=1 (for example /edge?me=1) on that browser.
// After that nothing from this browser is recorded.

type Flow = "edge" | "resume" | "home";
type Step = "view" | "slot" | "ready" | "pay_click" | "pay_open" | "pay_dismiss" | "paid" | "error" | "click";

const SID_KEY = "sa_edge_sid";
const OFF_KEY = "sa_internal";

function sessionId(): string | null {
  try {
    let sid = window.sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      window.sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

function muted(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("me") === "1") window.localStorage.setItem(OFF_KEY, "1");
    return window.localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

const seen = new Set<string>();

export function trackStep(flow: Flow, service: string, step: Step, extra: { src?: string; bookingId?: string; note?: string; once?: boolean } = {}) {
  try {
    if (muted()) return;
    const key = `${flow}|${service}|${step}`;
    if (extra.once !== false && (step === "view" || step === "slot" || step === "ready")) {
      if (seen.has(key)) return;
      seen.add(key);
    }
    const sid = sessionId();
    if (!sid) return;
    void fetch("/api/edge/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid, flow, service, step, src: extra.src, bookingId: extra.bookingId, note: extra.note }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}
