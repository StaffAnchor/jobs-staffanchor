import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, className, children }: FormFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
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
interface CollapsibleFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleFormField({
  label,
  required,
  error,
  className,
  defaultOpen = false,
  children,
}: CollapsibleFormFieldProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("grid gap-1.5 text-sm", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 text-left"
      >
        <span className="font-medium text-slate-700">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          {children}
          {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </>
      )}
    </div>
  );
}
