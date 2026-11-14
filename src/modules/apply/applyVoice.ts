// The optional voice note a candidate can add when applying ("why do you suit this role?"). It is held here between the
// questions window and the submit call, so the three apply paths only need to read it when they send the application.

export const APPLY_VOICE_ENABLED = process.env.NEXT_PUBLIC_APPLY_VOICE !== "off";
export const APPLY_VOICE_MAX_SECONDS = 60;

export type PendingVoice = { audioBase64: string; seconds: number; mime: "audio/wav" };
let pending: (PendingVoice & { mandateId: string }) | null = null;

export const setPendingVoice = (v: PendingVoice | null, mandateId = "") => {
  pending = v ? { ...v, mandateId } : null;
};
/** Spread into the submit body: adds the voice note when there is one. */
export const voiceField = (mandateId?: string | null): { voiceNote?: PendingVoice } => {
  if (!pending || !mandateId || pending.mandateId !== mandateId) return {};
  const { audioBase64, seconds, mime } = pending;
  return { voiceNote: { audioBase64, seconds, mime } };
};
export const clearPendingVoice = () => {
  pending = null;
};
