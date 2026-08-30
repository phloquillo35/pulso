import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-6xl font-semibold tracking-tight text-[var(--accent)]">404</p>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-[var(--muted)]">
          La página que buscás no existe o fue movida.
        </p>
      </div>
      <Link href="/dashboard" className={buttonClasses("primary", "md")}>
        Volver al dashboard
      </Link>
    </main>
  );
}
