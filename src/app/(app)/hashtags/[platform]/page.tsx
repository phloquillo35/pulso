import { notFound } from "next/navigation";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { getProvider } from "@/lib/data/provider";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/types";
import { formatCompact } from "@/lib/utils";

export default async function HashtagsPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: p } = await params;
  if (!PLATFORMS.includes(p as Platform)) notFound();
  const platform = p as Platform;

  const analysis = await getProvider().analyze(platform);
  const maxEng = Math.max(...analysis.hashtags.map((h) => h.avgEngagement), 0.0001);

  return (
    <div>
      <PlatformSwitcher basePath="/hashtags" />

      <div className="mt-6 flex items-center gap-3">
        <PlatformIcon platform={platform} size={40} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Análisis de hashtags</h1>
          <p className="text-[var(--muted)]">{PLATFORM_LABEL[platform]} · qué etiquetas mueven engagement</p>
        </div>
      </div>

      <Card className="mt-8">
        <CardTitle>Rendimiento por hashtag</CardTitle>
        <div className="mt-4 space-y-3">
          {analysis.hashtags.map((h) => (
            <div key={h.tag}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">#{h.tag}</span>
                <span className="text-[var(--muted)] tabular-nums">
                  {(h.avgEngagement * 100).toFixed(1)}% eng · {h.uses} usos · {formatCompact(h.reach)} alcance
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(h.avgEngagement / maxEng) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {analysis.hashtags.length === 0 && (
            <EmptyState
              title="Sin hashtags detectados"
              hint="Conectá la cuenta para ver qué etiquetas mueven engagement."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
