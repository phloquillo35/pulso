import type { DailyMetric, Insight, Post, SocialAccount } from "@/lib/types";

// Data-driven insights (no AI required). The AI layer can enrich these.
export function detectInsights(
  account: SocialAccount,
  daily: DailyMetric[],
  posts: Post[],
  bestTimes: { day: number; hour: number; score: number }[],
): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();

  // 1) Anomaly: a day with engagement >2x or <0.5x the rolling baseline.
  if (daily.length >= 14) {
    const window = daily.slice(-14).slice(0, 13);
    const base = window.reduce((s, d) => s + d.engagement, 0) / (window.length || 1);
    const last = daily[daily.length - 1];
    if (base > 0) {
      const ratio = last.engagement / base;
      if (ratio >= 2) {
        insights.push({
          id: "anom_spike",
          kind: "anomaly",
          title: "Pico de engagement inusual",
          detail: `El ${last.date} tu engagement fue ${Math.round(ratio * 100)}% sobre tu promedio de 2 semanas. ¿Qué publicaste ese día? Replicá el formato.`,
          severity: "info",
          createdAt: new Date(now).toISOString(),
        });
      } else if (ratio <= 0.5) {
        insights.push({
          id: "anom_drop",
          kind: "anomaly",
          title: "Caída de engagement",
          detail: `El ${last.date} tu engagement cayó a la mitad de tu promedio. Revisá si hubo cambio de horario o de formato.`,
          severity: "warning",
          createdAt: new Date(now).toISOString(),
        });
      }
    }
  }

  // 2) Win: best post by engagement rate.
  if (posts.length) {
    const best = [...posts].sort(
      (a, b) => b.metrics.engagementRate - a.metrics.engagementRate,
    )[0];
    insights.push({
      id: "win_best",
      kind: "win",
      title: "Tu mejor contenido reciente",
      detail: `“${best.caption}” logró ${(best.metrics.engagementRate * 100).toFixed(1)}% de engagement (${best.mediaType}). Es tu formato ganador.`,
      severity: "info",
      createdAt: new Date(now).toISOString(),
    });
  }

  // 3) Risk: follower growth slowing in last 14d vs previous 14d.
  if (daily.length >= 28) {
    const prev = daily.slice(-28, -14);
    const rec = daily.slice(-14);
    const prevNet = prev.reduce((s, d) => s + d.newFollowers - d.unfollows, 0);
    const recNet = rec.reduce((s, d) => s + d.newFollowers - d.unfollows, 0);
    if (prevNet > 0 && recNet < prevNet * 0.6) {
      insights.push({
        id: "risk_growth",
        kind: "risk",
        title: "Crecimiento desacelerando",
        detail: `Ganaste ${recNet} seguidores esta quincena vs ${prevNet} la anterior. El ritmo bajó un ${Math.round((1 - recNet / prevNet) * 100)}%.`,
        severity: "warning",
        createdAt: new Date(now).toISOString(),
      });
    }
  }

  // 4) Opportunity: a high-scoring time slot with few posts.
  if (bestTimes.length && posts.length) {
    const top = [...bestTimes].sort((a, b) => b.score - a.score).slice(0, 5);
    const postedHours = new Set(
      posts.map((p) => `${new Date(p.publishedAt).getDay()}_${new Date(p.publishedAt).getHours()}`),
    );
    const untapped = top.find(
      (c) => !postedHours.has(`${c.day}_${c.hour}`),
    );
    if (untapped) {
      const dayName = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][untapped.day];
      insights.push({
        id: "opp_slot",
        kind: "opportunity",
        title: "Horario dorado sin usar",
        detail: `Los ${dayName} a las ${untapped.hour}:00 hs tu audiencia está más activa, pero casi no publicás ahí. Probá un post este slot.`,
        severity: "info",
        createdAt: new Date(now).toISOString(),
      });
    }
  }

  return insights;
}
