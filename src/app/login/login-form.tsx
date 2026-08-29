"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/button";

const SUPABASE_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!SUPABASE_ENABLED) {
    return (
      <div className="glass-strong rounded-[28px] p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Auth no disponible</h1>
        <p className="mt-2 text-[var(--muted)]">
          Estás en modo demo. Configurá las variables de Supabase para habilitar el
          login real multi-tenant.
        </p>
        <Link href="/dashboard" className={buttonClasses("primary", "md", "mt-6")}>
          Ir al dashboard demo
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setInfo("Cuenta creada. Revisá tu email para confirmar e iniciá sesión.");
        setLoading(false);
      }
    }
  }

  return (
    <div className="glass-strong rounded-[28px] p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Entrá a Pulso</h1>
      <p className="mt-1 text-[var(--muted)]">Gestiona tus redes con inteligencia.</p>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-[14px] bg-[var(--surface)] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={
            mode === "signin"
              ? "rounded-[10px] bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
              : "rounded-[10px] px-3 py-2 text-sm text-[var(--muted)]"
          }
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={
            mode === "signup"
              ? "rounded-[10px] bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
              : "rounded-[10px] px-3 py-2 text-sm text-[var(--muted)]"
          }
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-[var(--muted)]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@ejemplo.com"
            className="mt-1 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted)]">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          />
        </div>

        {error && (
          <p className="rounded-[12px] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-[12px] bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
            {info}
          </p>
        )}

        <button type="submit" disabled={loading} className={buttonClasses("primary", "md", "w-full")}>
          {loading ? "Procesando…" : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--faint)]">
        Multi-tenant · Supabase Auth · tus datos quedan en tu cuenta.
      </p>
    </div>
  );
}
