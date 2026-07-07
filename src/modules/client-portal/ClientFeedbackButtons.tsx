"use client";

import { useState } from "react";
import { toast } from "sonner";
import { submitMyFeedback } from "@/modules/client-portal/api";

const OPTIONS: { value: string; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "interview_requested", label: "Schedule interview" },
  { value: "not_interested", label: "Not interested" },
];

export default function ClientFeedbackButtons({ linkId, current }: { linkId: string; current: string | null }) {
  const [feedback, setFeedback] = useState(current);
  const [saving, setSaving] = useState(false);

  async function submit(value: string) {
    setSaving(true);
    try {
      await submitMyFeedback(linkId, value);
      setFeedback(value);
      toast.success("Feedback sent to your recruiter.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => submit(o.value)}
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
  );
}
