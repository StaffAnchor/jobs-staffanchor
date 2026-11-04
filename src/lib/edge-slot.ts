import { CRM } from "@/lib/pro-sessions";

// The earliest open time for a session, read live from the calendar (through the CRM). Null if it can't be read, so
// callers simply leave the line out.
export async function nextOpenSlot(): Promise<string | null> {
  try {
    const res = await fetch(`${CRM}/api/pro/slots?service=mock-interview`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const j = (await res.json()) as { ok?: boolean; days?: Record<string, string[]> };
    if (!j.ok || !j.days) return null;
    const first = Object.keys(j.days).sort()[0];
    return first ? j.days[first][0] ?? null : null;
  } catch {
    return null;
  }
}

export const slotLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
