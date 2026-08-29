import type {
  AuditGrade,
  AuditScore,
  DailyMetric,
  Platform,
  Post,
  SocialAccount,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

// Platform-typical engagement benchmarks (used for scoring).
const ENGAGEMENT_BENCHMARK: Record<Platform, number> = {
  instagram: 0.045, tiktok: 0.07, youtube: 0.04, x: 0.02,
  facebook: 0.025, linkedin: 0.035, threads: 0.03, pinterest: 0.03, bluesky: 0.025,
};

function gradeFor(score: number): AuditGrade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function growthScore(daily: DailyMetric[]): number {
  if (daily.length < 30) return 50;
  const now = daily[daily.length - 1].followers;
  const monthAgo = daily[daily.length - 30].followers;
  const pct = monthAgo > 0 ? ((now - monthAgo) / monthAgo) * 100 : 0;
  // 0% -> 50, 20%+ -> 100, negative -> down to 10
  return clamp(50 + pct * 2.5, 10, 100);
}

function engagementScore(posts: Post[], platform: Platform): number {
  if (!posts.length) return 50;
  const avg =
    posts.reduce((s, p) => s + p.metrics.engagementRate, 0) / posts.length;
  const bench = ENGAGEMENT_BENCHMARK[platform];
  return clamp((avg / bench) * 60, 10, 100);
}

function consistencyScore(posts: Post[]): number {
  if (posts.length < 5) return 40;
  const spanDays =
    (+new Date(posts[0].publishedAt) - +new Date(posts[posts.length - 1].publishedAt)) /
      86400000 || 1;
  const postsPerWeek = (posts.length / spanDays) * 7;
  // ~3+ posts/week -> strong
  return clamp((postsPerWeek / 3) * 70, 10, 100);
}

function contentQualityScore(posts: Post[]): number {
  if (!posts.length) return 50;
  const savesRatio =
    posts.reduce((s, p) => s + p.metrics.saves, 0) /
    (posts.reduce((s, p) => s + p.metrics.likes, 0) || 1);
  const sharesRatio =
    posts.reduce((s, p) => s + p.metrics.shares, 0) /
    (posts.reduce((s, p) => s + p.metrics.likes, 0) || 1);
  const variety = new Set(posts.map((p) => p.mediaType)).size;
  return clamp(savesRatio * 300 + sharesRatio * 200 + variety * 12, 10, 100);
}

function audienceHealthScore(daily: DailyMetric[]): number {
  if (daily.length < 14) return 60;
  const recent = daily.slice(-14);
  const net = recent.reduce((s, d) => s + d.newFollowers - d.unfollows, 0);
  const gained = recent.reduce((s, d) => s + d.newFollowers, 0) || 1;
  const retention = net / gained;
  return clamp(50 + retention * 60, 10, 100);
}

export function computeAudit(
  account: SocialAccount,
  daily: DailyMetric[],
  posts: Post[],
): AuditScore {
  const growth = Math.round(growthScore(daily));
  const engagement = Math.round(engagementScore(posts, account.platform));
  const consistency = Math.round(consistencyScore(posts));
  const contentQuality = Math.round(contentQualityScore(posts));
  const audienceHealth = Math.round(audienceHealthScore(daily));

  const overall = Math.round(
    growth * 0.2 +
      engagement * 0.3 +
      consistency * 0.15 +
      contentQuality * 0.2 +
      audienceHealth * 0.15,
  );

  const recommendations: string[] = [];
  const dims: [string, number, string][] = [
    ["crecimiento", growth, "Tu crecimiento es lento: probá un carrusel educativo 2x por semana."],
    ["engagement", engagement, "El engagement está por debajo del promedio del nicho: mejorá el gancho en el primer renglón."],
    ["consistencia", consistency, "Publicás poco: la consistencia le gana a la suerte con el algoritmo."],
    ["calidad de contenido", contentQuality, "Subí la tasa de guardados usando carruseles con utilidad accionable."],
    ["salud de audiencia", audienceHealth, "Estás perdiendo seguidores: revisá el balance entre contenido promocional y valor."],
  ];
  dims.sort((a, b) => a[1] - b[1]);
  for (const [, score, rec] of dims.slice(0, 3)) {
    if (score < 70) recommendations.push(rec);
  }
  if (recommendations.length === 0)
    recommendations.push("Estás en buen estado. Seguí la frecuencia actual y escalá con colaboraciones.");

  return {
    accountId: account.id,
    overall,
    breakdown: { growth, engagement, consistency, contentQuality, audienceHealth },
    grade: gradeFor(overall),
    recommendations,
  };
}
