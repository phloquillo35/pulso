import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  glass = true,
}: {
  className?: string;
  children: React.ReactNode;
  glass?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] p-5",
        glass ? "glass-strong" : "border border-[var(--border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold text-[var(--muted)]", className)}>{children}</h3>
  );
}
