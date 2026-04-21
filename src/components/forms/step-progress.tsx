import { cn } from "@/lib/utils";

interface StepProgressProps {
  current: number;
  labels: string[];
  completedSteps: number[];
}

export function StepProgress({ current, labels, completedSteps }: StepProgressProps) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">Onboarding Progress</p>
      <div className="grid gap-2 md:grid-cols-7">
        {labels.map((label, index) => {
          const step = index + 1;
          const isActive = current === step;
          const isDone = completedSteps.includes(step);

          return (
            <div
              key={label}
              className={cn(
                "rounded-md border px-2 py-2 text-xs",
                isActive && "border-slate-900 bg-slate-900 text-white",
                !isActive && isDone && "border-emerald-400 bg-emerald-50 text-emerald-700",
                !isActive && !isDone && "border-slate-200 text-slate-500"
              )}
            >
              <span className="block font-semibold">Step {step}</span>
              <span className="line-clamp-1">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
