import { PLATFORM_COLOR, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlatformIcon({
  platform,
  size = 28,
  className,
}: {
  platform: Platform;
  size?: number;
  className?: string;
}) {
  const color = PLATFORM_COLOR[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.42,
      }}
      title={PLATFORM_LABEL[platform]}
      aria-label={PLATFORM_LABEL[platform]}
    >
      {PLATFORM_LABEL[platform].slice(0, 1)}
    </span>
  );
}
