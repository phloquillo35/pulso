"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/audit/instagram", label: "Auditoría" },
  { href: "/best-time/instagram", label: "Mejor hora" },
  { href: "/hashtags/instagram", label: "Hashtags" },
  { href: "/competitors/instagram", label: "Competidores" },
  { href: "/ai/instagram", label: "IA" },
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
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[var(--accent)] text-sm text-white">
              P
            </span>
            Pulso
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[var(--surface-2)] text-[var(--fg)]"
                      : "text-[var(--muted)] hover:text-[var(--fg)]",
                  )}
                >
                  {n.label}
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
