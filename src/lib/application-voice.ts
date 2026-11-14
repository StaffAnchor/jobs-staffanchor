import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// The optional voice note that comes with an application ("why do you suit this role?"). The audio is kept in a private bucket
// the hiring team can play from the CRM, and an English transcript (translated if it was in Hindi) is saved next to it.

export type VoiceNoteInput = { audioBase64?: unknown; seconds?: unknown; mime?: unknown };

const MAX_BASE64 = 3_400_000;

export async function saveApplicationVoice(admin: SupabaseClient, input: { mandateId: string; candidateId: string; voice: VoiceNoteInput }): Promise<void> {
  const { mandateId, candidateId, voice } = input;
  if (typeof voice.audioBase64 !== "string" || voice.audioBase64.length < 1000 || voice.audioBase64.length > MAX_BASE64) return;
  const bytes = Buffer.from(voice.audioBase64, "base64");
  // Only plain WAV, which is what the browser step produces.
  if (bytes.length < 800 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WAVE") return;
  const seconds = Math.max(1, Math.min(75, Math.round(Number(voice.seconds) || 0)));

  const { data: link } = await admin.from("candidate_mandate_links").select("id").eq("mandate_id", mandateId).eq("candidate_id", candidateId).maybeSingle();
  if (!link) return;

  const path = `${mandateId}/${candidateId}.wav`;
  const up = await admin.storage.from("application-voice").upload(path, bytes, { contentType: "audio/wav", upsert: true });
  if (up.error) {
    console.error("Voice note upload failed", up.error);
    return;
  }
  const { error } = await admin
    .from("application_voice_notes")
    .upsert({ mandate_id: mandateId, candidate_id: candidateId, audio_path: path, seconds, transcript_en: null }, { onConflict: "mandate_id,candidate_id" });
  if (error) {
    console.error("Voice note row failed", error);
    return;
  }
  await transcribe(admin, mandateId, candidateId, voice.audioBase64);
}

async function transcribe(admin: SupabaseClient, mandateId: string, candidateId: string, audioBase64: string): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `This is a job candidate's short voice note about why they are right for a sales role. They may speak English, Hindi or Hinglish. Write what they said in plain English: if it is not English, translate it. Keep company names, product names and numbers exactly. Do not add anything they did not say. If there is no speech, return an empty string. Return only the text.`;
  for (const modelName of ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([{ inlineData: { mimeType: "audio/wav", data: audioBase64 } }, { text: prompt }]);
      const text = result.response.text().trim().slice(0, 4000);
      await admin.from("application_voice_notes").update({ transcript_en: text || null }).eq("mandate_id", mandateId).eq("candidate_id", candidateId);
      return;
    } catch (err) {
      console.error(`Voice note transcription failed with ${modelName}`, err);
    }
  }
}
