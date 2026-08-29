import { PLATFORM_COLOR, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlatformIcon({
  platform,
  size = 28,
  className,
  decorative = false,
}: {
  platform: Platform;
  size?: number;
  className?: string;
  /** When the icon sits inside a link/label that already names the platform,
   *  mark it decorative so screen readers don't announce it twice. */
  decorative?: boolean;
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
      title={decorative ? undefined : PLATFORM_LABEL[platform]}
      aria-label={decorative ? undefined : PLATFORM_LABEL[platform]}
      aria-hidden={decorative ? true : undefined}
    >
      {PLATFORM_LABEL[platform].slice(0, 1)}
    </span>
  );
}
