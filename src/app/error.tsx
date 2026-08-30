"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de render:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--danger)]/10 text-[var(--danger)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="mt-2 text-[var(--muted)]">
          Ocurrió un error inesperado. Podés reintentar o volver al inicio.
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className={buttonClasses("primary", "md")}>
          Reintentar
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
