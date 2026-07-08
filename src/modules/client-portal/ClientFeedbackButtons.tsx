"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { submitMyFeedback } from "@/modules/client-portal/api";

const OPTIONS: { value: string; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "interview_requested", label: "Schedule interview" },
  { value: "not_interested", label: "Not interested" },
];

function formatSlot(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ClientFeedbackButtons({
  linkId,
  current,
  requestedInterviewAt,
  confirmedInterviewAt,
}: {
  linkId: string;
  current: string | null;
  requestedInterviewAt?: string | null;
  confirmedInterviewAt?: string | null;
}) {
  const [feedback, setFeedback] = useState(current);
  const [saving, setSaving] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [requestedAt, setRequestedAt] = useState(requestedInterviewAt ?? null);

  async function submit(value: string, interviewAt?: string) {
    setSaving(true);
    try {
      await submitMyFeedback(linkId, value, interviewAt);
      setFeedback(value);
      if (interviewAt) setRequestedAt(interviewAt);
      toast.success(
        value === "interview_requested" ? "Interview request sent to your recruiter." : "Feedback sent to your recruiter."
      );
      setShowScheduler(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  function handleClick(value: string) {
    if (value === "interview_requested") {
      setShowScheduler(true);
      return;
    }
    submit(value);
  }

  function submitSchedule() {
    if (!date || !time) {
      toast.error("Pick both a date and a time.");
      return;
    }
    const iso = new Date(`${date}T${time}`).toISOString();
    submit("interview_requested", iso);
  }

  const confirmedLabel = formatSlot(confirmedInterviewAt ?? null);
  const requestedLabel = formatSlot(requestedAt);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => handleClick(o.value)}
            disabled={saving}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
              feedback === o.value
                ? "bg-blue-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {showScheduler && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Preferred date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Preferred time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <button
            onClick={submitSchedule}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Send request
          </button>
          <button
            onClick={() => setShowScheduler(false)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {(confirmedLabel || requestedLabel) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {confirmedLabel ? (
            <span>
              Interview confirmed for <span className="font-medium text-slate-700">{confirmedLabel}</span>
            </span>
          ) : (
            <span>
              You proposed <span className="font-medium text-slate-700">{requestedLabel}</span> — awaiting confirmation
            </span>
          )}
        </p>
      )}
    </div>
  );
}
