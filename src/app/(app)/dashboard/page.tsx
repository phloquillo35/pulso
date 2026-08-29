import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { AreaChart } from "@/components/ui/charts";
import { Heatmap } from "@/components/ui/heatmap";
import Link from "next/link";
import { getProvider } from "@/lib/data/provider";
import { getAIService, type AnalysisContext } from "@/lib/ai";
import { bestTimeSummary } from "@/lib/utils";

export default async function DashboardPage() {
  const provider = getProvider();
  const portfolio = await provider.getPortfolio();
  const analyses = await Promise.all(
    portfolio.map(async (a) => ({ a, analysis: await provider.analyze(a.platform) })),
  );

  const totalFollowers = analyses.reduce((s, x) => s + x.analysis.account.followers, 0);
  const avgAudit = Math.round(
    analyses.reduce((s, x) => s + x.analysis.audit.overall, 0) / (analyses.length || 1),
  );
  const totalReach = analyses.reduce(
    (s, x) => s + (x.analysis.daily.at(-1)?.reach ?? 0),
    0,
  );

  // Instagram as the "primary" account for AI summary + previews.
  const ig = analyses.find((x) => x.a.platform === "instagram")!;
  const ctx: AnalysisContext = {
    account: ig.analysis.account,
    audit: ig.analysis.audit,
    recentPosts: ig.analysis.posts.slice(0, 5).map((p) => ({
      caption: p.caption,
      engagementRate: p.metrics.engagementRate,
      mediaType: p.mediaType,
    })),
    topHashtags: ig.analysis.hashtags.slice(0, 5).map((h) => ({
      tag: h.tag,
      avgEngagement: h.avgEngagement,
    })),
    bestTimeSummary: bestTimeSummary(ig.analysis.bestTimes),
  };
  const summary = await getAIService().executiveSummary(ctx);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[var(--muted)]">
            Tu ecosistema social completo, en una vista.
          </p>
        </div>
        <Badge tone="accent">{analyses.length} cuentas conectadas</Badge>
      </div>

      {/* Unified KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <Stat label="Seguidores totales" value={totalFollowers} />
        </Card>
        <Card>
          <Stat label="Alcance (últ. día)" value={totalReach} />
        </Card>
        <Card>
          <Stat label="Audit promedio" value={`${avgAudit}/100`} />
        </Card>
        <Card>
          <Stat label="Plataformas" value={analyses.length} />
        </Card>
      </div>

      {/* Portfolio grid */}
      <h2 className="mb-3 mt-10 text-lg font-semibold">Cartera de cuentas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {analyses.map(({ a, analysis }) => {
          const daily = analysis.daily;
          const followersSeries = daily.map((d) => d.followers);
          const first = daily[0]?.followers ?? 0;
          const last = daily[daily.length - 1]?.followers ?? 0;
          const delta = first ? ((last - first) / first) * 100 : 0;
          return (
            <Link key={a.platform} href={`/audit/${a.platform}`} className="block">
              <Card className="transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={a.platform} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.displayName}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{a.handle}</p>
                  </div>
                  <Badge
                    tone={analysis.audit.grade === "A" || analysis.audit.grade === "B" ? "success" : "warning"}
                    className="ml-auto"
                  >
                    {analysis.audit.grade}
                  </Badge>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <Stat label="Seguidores" value={a.followers} delta={delta} />
                  <AreaChart data={followersSeries.slice(-30)} height={48} className="w-32" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Previews */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Mejor hora para publicar · Instagram</CardTitle>
            <Link href="/best-time/instagram" className="text-sm text-[var(--accent)]">
              Ver más →
            </Link>
          </div>
          <Heatmap cells={ig.analysis.bestTimes} className="mt-4" />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Top hashtags · Instagram</CardTitle>
            <Link href="/hashtags/instagram" className="text-sm text-[var(--accent)]">
              Ver más →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {ig.analysis.hashtags.slice(0, 6).map((h) => (
              <div key={h.tag} className="flex items-center justify-between text-sm">
                <span className="font-medium">#{h.tag}</span>
                <span className="text-[var(--muted)]">
                  {(h.avgEngagement * 100).toFixed(1)}% eng · {h.uses} usos
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI summary */}
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <CardTitle>Resumen ejecutivo · IA</CardTitle>
          <Link href="/ai/instagram" className="text-sm text-[var(--accent)]">
            Preguntale a Pulso →
          </Link>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-balance">{summary}</p>
      </Card>
    </>
  );
}
