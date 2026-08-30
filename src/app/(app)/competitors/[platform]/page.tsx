import { notFound } from "next/navigation";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { getProvider } from "@/lib/data/provider";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { formatCompact, formatDelta } from "@/lib/utils";

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: p } = await params;
  if (!PLATFORMS.includes(p as Platform)) notFound();
  const platform = p as Platform;

  const provider = getProvider();
  const analysis = await provider.analyze(platform);
  const competitors = await provider.getCompetitors(platform);
  const daily = analysis.daily;
  const lastDaily = daily.at(-1);
  const firstDaily30 = daily.at(-30);
  const me = {
    handle: analysis.account.handle,
    displayName: analysis.account.displayName,
    followers: analysis.account.followers,
    avgEngagementRate: analysis.posts.length
      ? analysis.posts.reduce((s, x) => s + x.metrics.engagementRate, 0) / analysis.posts.length
      : 0,
    postingFrequency: new Set(analysis.posts.map((x) => x.publishedAt.slice(0, 10))).size,
    growth30d:
      lastDaily && firstDaily30
        ? ((lastDaily.followers - firstDaily30.followers) / (firstDaily30.followers || 1)) * 100
        : 0,
    isMe: true,
  };

  const rows = [me, ...competitors.map((c) => ({ ...c, isMe: false }))];

  return (
    <div>
      <PlatformSwitcher basePath="/competitors" />

      <div className="mt-6 flex items-center gap-3">
        <PlatformIcon platform={platform} size={40} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Benchmarking de competidores</h1>
          <p className="text-[var(--muted)]">{PLATFORM_LABEL[platform]} · comparado contra tu nicho</p>
        </div>
      </div>

      <Card className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="pb-3 font-medium">Cuenta</th>
              <th className="pb-3 font-medium text-right">Seguidores</th>
              <th className="pb-3 font-medium text-right">Engagement</th>
              <th className="pb-3 font-medium text-right">Posts/30d</th>
              <th className="pb-3 font-medium text-right">Crecimiento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.isMe ? "font-semibold" : ""}>
                <td className="border-t border-[var(--border)] py-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={platform} size={22} />
                    <span>{r.isMe ? `${r.displayName} (vos)` : r.displayName}</span>
                    {r.isMe && <Badge tone="accent">Tú</Badge>}
                  </div>
                </td>
                <td className="border-t border-[var(--border)] py-3 text-right tabular-nums">
                  {formatCompact(r.followers)}
                </td>
                <td className="border-t border-[var(--border)] py-3 text-right tabular-nums">
                  {(r.avgEngagementRate * 100).toFixed(1)}%
                </td>
                <td className="border-t border-[var(--border)] py-3 text-right tabular-nums">
                  {r.postingFrequency}
                </td>
                <td
                  className={`border-t border-[var(--border)] py-3 text-right tabular-nums ${
                    r.growth30d >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                  }`}
                >
                  {formatDelta(r.growth30d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {competitors.length === 0 && (
        <EmptyState
          title="Sin competidores para comparar"
          hint="Aún no hay cuentas de la competencia en este nicho."
          className="mt-4"
        />
      )}
    </div>
  );
}
