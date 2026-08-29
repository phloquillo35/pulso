import { cn } from "@/lib/utils";
import { formatCompact, formatDelta } from "@/lib/utils";

export function Stat({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: string | number;
  delta?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">
        {typeof value === "number" ? formatCompact(value) : value}
      </span>
      {delta !== undefined && (
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]",
          )}
        >
          {formatDelta(delta)}
        </span>
      )}
    </div>
  );
}
