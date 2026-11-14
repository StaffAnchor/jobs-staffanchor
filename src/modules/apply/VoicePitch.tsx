"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import { recordingToWav } from "@/lib/voice-wav";
import { APPLY_VOICE_MAX_SECONDS, setPendingVoice } from "./applyVoice";

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });

// "Tell us in 60 seconds why you are right for this role." Optional, but recommended: the hiring team hears it with the application.
export default function VoicePitch({ mandateId }: { mandateId: string }) {
  const [state, setState] = useState<"idle" | "recording" | "working" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const elapsed = useRef(0);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  async function start() {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("unsupported");
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mr = new MediaRecorder(s);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      mr.onstop = () => void finish(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" }));
      rec.current = mr;
      mr.start();
      elapsed.current = 0;
      setSecs(0);
      setState("recording");
      timer.current = setInterval(() => {
        elapsed.current += 1;
        setSecs(elapsed.current);
        if (elapsed.current >= APPLY_VOICE_MAX_SECONDS) stop();
      }, 1000);
    } catch {
      setError("We could not use your microphone. You can skip this and apply without it.");
      setState("idle");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    setState("working");
  }

  async function finish(blob: Blob) {
    try {
      if (elapsed.current < 3) {
        setError("That was very short. Try again, a few sentences is perfect.");
        setState("idle");
        return;
      }
      const wav = await recordingToWav(blob);
      if (wav.size > 2_400_000) throw new Error("too big");
      setPendingVoice({ audioBase64: await toBase64(wav), seconds: elapsed.current, mime: "audio/wav" }, mandateId);
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(wav);
      });
      setState("done");
    } catch {
      setError("We could not save that recording. You can try again or skip it.");
      setState("idle");
    }
  }

  function redo() {
    setPendingVoice(null);
    setUrl(null);
    setState("idle");
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
      <p className="text-[13px] font-semibold text-slate-900">Why are you right for this role? Tell us in {APPLY_VOICE_MAX_SECONDS} seconds.</p>
      <p className="mt-0.5 text-xs text-slate-600">Optional, but applications with a voice note get noticed. Speak in English or Hindi, whatever is easiest.</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {state === "idle" && (
          <button type="button" onClick={() => void start()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
            <Mic className="h-4 w-4" /> Record a voice note
          </button>
        )}
        {state === "recording" && (
          <>
            <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white">
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
            <span className="inline-flex items-center gap-1.5 text-[13px] tabular-nums text-slate-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> {secs}s / {APPLY_VOICE_MAX_SECONDS}s
            </span>
          </>
        )}
        {state === "working" && <span className="text-[13px] text-slate-500">Getting it ready…</span>}
        {state === "done" && url && (
          <>
            <audio controls src={url} className="h-9 max-w-full" />
            <button type="button" onClick={redo} className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" /> Record again
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
