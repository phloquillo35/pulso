"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/types";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { cn } from "@/lib/utils";

export function PlatformSwitcher({
  basePath,
}: {
  basePath: string;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const href = `${basePath}/${p}`;
        const active = pathname === href;
        return (
          <Link
            key={p}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[12px] border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]",
            )}
          >
            <PlatformIcon platform={p} size={18} decorative />
            {PLATFORM_LABEL[p]}
          </Link>
        );
      })}
    </div>
  );
}
