import Link from "next/link";
import { Reveal } from "@/components/motion";
import { AreaChart, Sparkline } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";

const FEATURES = [
  { t: "Dashboard unificado", d: "Todas tus redes en una sola vista. KPIs, crecimiento y top posts sin saltar de app en app.", icon: "▦" },
  { t: "Auditoría de perfil", d: "Un score de salud 0–100 con desglose por dimensión y recomendaciones accionables.", icon: "✶" },
  { t: "Mejor hora para publicar", d: "Heatmap personalizado desde tus datos reales, no promedios genéricos.", icon: "◷" },
  { t: "Análisis de hashtags", d: "Qué etiquetas realmente mueven engagement y la cantidad óptima por post.", icon: "#" },
  { t: "Benchmarking de competidores", d: "Compará crecimiento, frecuencia y engagement contra tu nicho.", icon: "⇄" },
  { t: "Insights con IA", d: "Resumen ejecutivo, plan semanal y un chat que responde sobre tus datos.", icon: "✦" },
  { t: "Detección de anomalías", d: "Picos y caídas reales señalados y explicados automáticamente.", icon: "!" },
  { t: "Listo para agentes (MCP)", d: "Exponé tus analytics como herramientas para IA y automatizá tu estrategia.", icon: "⚡" },
];

const STEPS = [
  { n: "1", t: "Conectá tus cuentas", d: "Instagram, TikTok, YouTube, X, LinkedIn y más. OAuth seguro y multi-tenant." },
  { n: "2", t: "Pulso analiza", d: "Cada métrica se normaliza, se calcula tu audit y se detectan patrones." },
  { n: "3", t: "Crece con criterio", d: "Seguí las recomendaciones de IA y el plan semanal para escalar de verdad." },
];

export default function LandingPage() {
  const sampleFollowers = [120, 122, 121, 125, 128, 127, 131, 134, 133, 138, 141, 142];
  const sampleEngagement = [3.8, 4.1, 3.9, 4.4, 4.2, 4.8, 5.1, 4.9, 5.3, 5.0, 5.6, 5.9];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Badge tone="accent" className="mb-5">Inteligencia para redes sociales</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Tu presencia social, <span className="text-[var(--accent)]">en pulso.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-[var(--muted)]">
              Monitorizá, analizá y mejorá tus perfiles para hacer crecer tu negocio
              y tu cuenta de creador. Todo en un solo lugar, con IA que te dice qué hacer.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/dashboard" className={buttonClasses("primary", "lg")}>
                Abrir la app
              </Link>
              <Link href="#features" className={buttonClasses("secondary", "lg")}>
                Ver funciones
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Product mock */}
        <Reveal delay={0.2} className="mx-auto mt-14 max-w-5xl">
          <div className="glass-strong rounded-[28px] p-6 shadow-2xl shadow-black/5">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Seguidores · Instagram</p>
                    <p className="text-3xl font-semibold tracking-tight">142.3K</p>
                  </div>
                  <Badge tone="success">+9.4% mes</Badge>
                </div>
                <div className="mt-4">
                  <AreaChart data={sampleFollowers} height={150} />
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--muted)]">Engagement</p>
                  <p className="text-2xl font-semibold tracking-tight">5.9%</p>
                  <Sparkline data={sampleEngagement} width={200} height={40} className="mt-2" />
                </div>
                <div className="rounded-[16px] border border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted)]">Audit de salud</p>
                  <p className="text-2xl font-semibold tracking-tight">82<span className="text-base text-[var(--muted)]">/100 · A</span></p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-16">
        <Reveal>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Todo lo que necesitás para crecer
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Una plataforma completa: desde el monitoreo hasta la recomendación.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={i * 0.04}>
              <div className="glass h-full rounded-[var(--radius-card)] p-5">
                <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[var(--accent)]/10 text-[var(--accent)]">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-[var(--muted)]">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <Reveal>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Cómo funciona
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className="glass rounded-[var(--radius-card)] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[var(--accent)] text-lg font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-[var(--muted)]">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-[32px] px-8 py-16 text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Empezá a crecer con criterio
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
              Probá Pulso ahora con datos de demostración. Conectá tus cuentas cuando quieras.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/dashboard" className={buttonClasses("primary", "lg")}>
                Abrir la app
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto max-w-7xl px-5 py-10 text-sm text-[var(--faint)]">
        Pulso · Inteligencia para redes sociales · Hecho con criterio de Staff Engineer.
      </footer>
    </div>
  );
}
