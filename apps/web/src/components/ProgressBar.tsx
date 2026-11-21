import { Progress } from "@/components/ui/progress.js";
import { cn } from "@/lib/utils.js";

export interface ProgressBarProps {
  // 0–100
  percent: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const displayValue = label ?? `${clamped}%`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Progress value={clamped} className="flex-1" aria-label={label ?? displayValue} />
      <span className="text-label text-text-muted tabular-nums whitespace-nowrap">
        {displayValue}
      </span>
    </div>
  );
}
