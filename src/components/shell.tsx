"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { PLATFORMS, type Platform } from "@/lib/types";

// Sections that operate on a single platform. The platform is derived from the
// current URL so the nav always points at the platform the user is viewing.
const SECTIONS = [
  { key: "audit", label: "Auditoría", path: (p: string) => `/audit/${p}` },
  { key: "best-time", label: "Mejor hora", path: (p: string) => `/best-time/${p}` },
  { key: "hashtags", label: "Hashtags", path: (p: string) => `/hashtags/${p}` },
  { key: "competitors", label: "Competidores", path: (p: string) => `/competitors/${p}` },
  { key: "ai", label: "IA", path: (p: string) => `/ai/${p}` },
];

export function Shell({
  children,
  user = null,
  supabaseEnabled = false,
}: {
  children: React.ReactNode;
  user?: { email: string } | null;
  supabaseEnabled?: boolean;
}) {
  const pathname = usePathname();

  // Derive the active platform from routes like /audit/instagram → "instagram".
  // Falls back to "instagram" on non-platform routes (e.g. /dashboard).
  const platformMatch = pathname.match(/^\/(?:audit|best-time|hashtags|competitors|ai)\/([a-z0-9]+)/);
  const currentPlatform: Platform =
    platformMatch && PLATFORMS.includes(platformMatch[1] as Platform)
      ? (platformMatch[1] as Platform)
      : "instagram";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-[10px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[var(--accent)] text-sm text-white">
              P
            </span>
            Pulso
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              key="/dashboard"
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
                pathname === "/dashboard"
                  ? "bg-[var(--surface-2)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]",
              )}
            >
              Dashboard
            </Link>
            {SECTIONS.map((s) => {
              const href = s.path(currentPlatform);
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={s.key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
                    active
                      ? "bg-[var(--surface-2)] text-[var(--fg)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)]",
                  )}
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {supabaseEnabled ? (
              user ? (
                <>
                  <span className="hidden max-w-[12rem] truncate text-sm text-[var(--muted)] sm:inline">
                    {user.email}
                  </span>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className={buttonClasses("secondary", "sm")}>
                      Salir
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className={buttonClasses("primary", "sm")}>
                  Iniciar sesión
                </Link>
              )
            ) : (
              <>
                <span className="rounded-[var(--radius-pill)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                  Modo demo
                </span>
                <Link href="/dashboard" className={buttonClasses("primary", "sm")}>
                  Abrir app
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
