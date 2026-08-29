import type { BestTimeCell } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function Heatmap({
  cells,
  className,
}: {
  cells: BestTimeCell[];
  className?: string;
}) {
  // index by day*24 + hour
  const map = new Map<number, number>();
  for (const c of cells) map.set(c.day * 24 + c.hour, c.score);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-[3px]">
          {DAYS.map((d, day) => (
            <div key={`row-${day}`} className="contents">
              <div className="flex items-center justify-end pr-2 text-[11px] text-[var(--muted)]">
                {d}
              </div>
              {Array.from({ length: 24 }).map((_, hour) => {
                const score = map.get(day * 24 + hour) ?? 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    title={`${DAYS[day]} ${hour}:00 — intensidad ${(score * 100).toFixed(0)}%`}
                    className="aspect-square rounded-[3px]"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(
                        score * 100,
                      )}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <span>Menos</span>
          <div className="flex gap-[3px]">
            {[0.1, 0.35, 0.6, 0.85, 1].map((s) => (
              <div
                key={s}
                className="h-3 w-3 rounded-[3px]"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(
                    s * 100,
                  )}%, transparent)`,
                }}
              />
            ))}
          </div>
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
