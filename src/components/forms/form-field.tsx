import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared by both components below and by ApplyForm's own focusField() helper
// -- turns a label string into the same DOM id on both sides so a validation
// failure can look a field up by its exact label text without every call
// site having to pass an explicit id prop.
export function slugifyFieldLabel(label: string): string {
  return `field-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, className, children }: FormFieldProps) {
  return (
    <label id={slugifyFieldLabel(label)} className={cn("scroll-mt-24 grid gap-1.5 rounded-lg text-sm transition-shadow", className)}>
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

// Same required-field styling as FormField, but the body is collapsed by
// default behind a clickable heading -- for the handful of longer
// multi-select blocks (Previous Industries, Preferred Cities to Relocate,
// Secondary Specializations) that don't need to be open by default and just
// add scroll length to the page when they are.
//
// Previously this rendered as bare text + a small chevron with no container
// -- visually indistinguishable from a section sub-heading, so candidates
// scanning the page didn't register it as a fillable field at all. Now
// wrapped in the same bordered/background treatment as a real input so it
// reads as its own distinct row, and shows a live summary (via the
// `summary` prop) so its current state -- filled or empty -- is visible
// without opening it.
interface CollapsibleFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultOpen?: boolean;
  summary?: string;
  summaryFilled?: boolean;
  children: React.ReactNode;
}

export function CollapsibleFormField({
  label,
  required,
  error,
  className,
  defaultOpen = false,
  summary,
  summaryFilled,
  children,
}: CollapsibleFormFieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  const needsAttention = required && !summaryFilled;
  return (
    <div
      id={slugifyFieldLabel(label)}
      data-collapsible-field="true"
      className={cn(
        "scroll-mt-24 rounded-lg border text-sm transition-shadow",
        needsAttention ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/60",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-medium text-slate-700">
            {label}
            {required ? <span className="text-red-600"> *</span> : null}
          </span>
          {summary && (
            <span className={cn("truncate text-xs", needsAttention ? "font-medium text-amber-700" : "text-slate-500")}>
              {summary}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-slate-200 px-3 pb-3 pt-3">
          {children}
          {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
        </div>
      )}
    </div>
  );
}
