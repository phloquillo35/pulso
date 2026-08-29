import { notFound } from "next/navigation";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { ChatPanel } from "@/components/chat-panel";
import { getProvider } from "@/lib/data/provider";
import { getAIService, type AnalysisContext } from "@/lib/ai";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { bestTimeSummary } from "@/lib/utils";

export default async function AIPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: p } = await params;
  if (!PLATFORMS.includes(p as Platform)) notFound();
  const platform = p as Platform;

  const analysis = await getProvider().analyze(platform);
  const ctx: AnalysisContext = {
    account: analysis.account,
    audit: analysis.audit,
    recentPosts: analysis.posts.slice(0, 5).map((x) => ({
      caption: x.caption,
      engagementRate: x.metrics.engagementRate,
      mediaType: x.mediaType,
    })),
    topHashtags: analysis.hashtags.slice(0, 5).map((h) => ({ tag: h.tag, avgEngagement: h.avgEngagement })),
    bestTimeSummary: bestTimeSummary(analysis.bestTimes),
  };
  const ai = getAIService();
  const [summary, plan] = await Promise.all([ai.executiveSummary(ctx), ai.weeklyPlan(ctx)]);

  return (
    <div>
      <PlatformSwitcher basePath="/ai" />

      <div className="mt-6 flex items-center gap-3">
        <PlatformIcon platform={platform} size={40} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights con IA</h1>
          <p className="text-[var(--muted)]">
            {PLATFORM_LABEL[platform]} · proveedor: <span className="capitalize">{ai.provider}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Resumen ejecutivo</CardTitle>
          <p className="mt-3 text-[15px] leading-relaxed text-balance">{summary}</p>
        </Card>
        <Card>
          <CardTitle>Plan semanal sugerido</CardTitle>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-balance">{plan}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Insights detectados (datos)</CardTitle>
          <div className="mt-3 space-y-2">
            {analysis.insights.map((ins) => (
              <div key={ins.id} className="flex gap-3 text-sm">
                <Badge
                  tone={
                    ins.kind === "win" ? "success" : ins.kind === "risk" ? "danger" : ins.kind === "anomaly" ? "warning" : "accent"
                  }
                >
                  {ins.kind}
                </Badge>
                <div>
                  <p className="font-medium">{ins.title}</p>
                  <p className="text-[var(--muted)]">{ins.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Chat con Pulso</CardTitle>
          <div className="mt-3">
            <ChatPanel platform={platform} />
          </div>
        </Card>
      </div>
    </div>
  );
}
