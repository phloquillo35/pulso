import { notFound } from "next/navigation";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Heatmap } from "@/components/ui/heatmap";
import { getProvider } from "@/lib/data/provider";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { bestTimeSummary, formatTime } from "@/lib/utils";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function BestTimePage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: p } = await params;
  if (!PLATFORMS.includes(p as Platform)) notFound();
  const platform = p as Platform;

  const analysis = await getProvider().analyze(platform);
  const top = [...analysis.bestTimes].sort((a, b) => b.score - a.score).slice(0, 6);

  return (
    <div>
      <PlatformSwitcher basePath="/best-time" />

      <div className="mt-6 flex items-center gap-3">
        <PlatformIcon platform={platform} size={40} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mejor hora para publicar</h1>
          <p className="text-[var(--muted)]">{PLATFORM_LABEL[platform]} · basado en tus datos reales</p>
        </div>
      </div>

      {analysis.bestTimes.length > 0 ? (
        <>
          <Card className="mt-8">
            <Heatmap cells={analysis.bestTimes} />
          </Card>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((c, i) => (
          <Card key={i} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{DAY_NAMES[c.day]}</p>
              <p className="text-[var(--muted)]">{formatTime(c.hour)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums">{(c.score * 100).toFixed(0)}%</p>
              <p className="text-xs text-[var(--muted)]">intensidad</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Resumen: {bestTimeSummary(analysis.bestTimes)}
      </p>
        </>
      ) : (
        <EmptyState
          title="Sin datos de actividad"
          hint="Conectá la cuenta para descubrir tu mejor horario."
          className="mt-8"
        />
      )}
    </div>
  );
}
