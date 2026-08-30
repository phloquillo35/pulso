import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  hint,
  className,
}: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-center",
        className,
      )}
    >
      <p className="text-[15px] font-medium text-[var(--fg)]">{title}</p>
      {hint ? <p className="text-sm text-[var(--muted)]">{hint}</p> : null}
    </Card>
  );
}
