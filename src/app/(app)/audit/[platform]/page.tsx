import { notFound } from "next/navigation";
import Link from "next/link";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { AreaChart } from "@/components/ui/charts";
import { getProvider } from "@/lib/data/provider";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/types";

const DIM_LABELS: Record<string, string> = {
  growth: "Crecimiento",
  engagement: "Engagement",
  consistency: "Consistencia",
  contentQuality: "Calidad de contenido",
  audienceHealth: "Salud de audiencia",
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: p } = await params;
  if (!PLATFORMS.includes(p as Platform)) notFound();
  const platform = p as Platform;

  const analysis = await getProvider().analyze(platform);
  const { account, audit, daily } = analysis;
  const followersSeries = daily.map((d) => d.followers);

  return (
    <div>
      <PlatformSwitcher basePath="/audit" />

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PlatformIcon platform={platform} size={48} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{account.displayName}</h1>
          <p className="text-[var(--muted)]">{account.handle} · {PLATFORM_LABEL[platform]}</p>
        </div>
        <Badge tone="accent" className="ml-auto">Audit {audit.grade}</Badge>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Score */}
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-[var(--muted)]">Score de salud</p>
          <p className="mt-2 text-6xl font-semibold tracking-tight">{audit.overall}</p>
          <p className="text-[var(--muted)]">/ 100 · grado {audit.grade}</p>
          <div className="mt-4 w-full">
            <AreaChart data={followersSeries.slice(-30)} height={90} />
          </div>
        </Card>

        {/* Breakdown */}
        <Card className="lg:col-span-2">
          <CardTitle>Desglose por dimensión</CardTitle>
          <div className="mt-4 space-y-4">
            {Object.entries(audit.breakdown).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm">
                  <span>{DIM_LABELS[key] ?? key}</span>
                  <span className="tabular-nums text-[var(--muted)]">{val}/100</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-4">
        <CardTitle>Recomendaciones accionables</CardTitle>
        <ul className="mt-3 space-y-2">
          {audit.recommendations.map((r, i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <span className="mt-0.5 text-[var(--accent)]">→</span>
              <span className="text-balance">{r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/best-time/${platform}`} className="text-sm text-[var(--accent)]">Mejor hora →</Link>
          <Link href={`/hashtags/${platform}`} className="text-sm text-[var(--accent)]">Hashtags →</Link>
          <Link href={`/competitors/${platform}`} className="text-sm text-[var(--accent)]">Competidores →</Link>
        </div>
      </Card>
    </div>
  );
}
