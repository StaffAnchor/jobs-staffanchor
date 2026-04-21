import { Spinner } from "@/components/ui/spinner";

interface AdminLoadingProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function AdminLoading({
  title = "Loading admin workspace",
  subtitle = "Please wait while data is being prepared.",
  compact = false,
}: AdminLoadingProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
        <Spinner className="h-4 w-4" />
        {title}
      </div>
    );
  }

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <Spinner className="h-8 w-8 text-slate-700" />
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
