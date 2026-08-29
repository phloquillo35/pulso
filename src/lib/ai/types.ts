import type { AuditScore, SocialAccount } from "@/lib/types";

export interface AnalysisContext {
  account: SocialAccount;
  audit: AuditScore;
  recentPosts: { caption: string; engagementRate: number; mediaType: string }[];
  topHashtags: { tag: string; avgEngagement: number }[];
  bestTimeSummary: string; // human-readable top slots
  competitors?: { handle: string; followers: number; avgEngagementRate: number }[];
}

export interface AIService {
  readonly provider: "anthropic" | "openai" | "mock";
  isConfigured(): boolean;
  /** One-paragraph executive read of the account's health. */
  executiveSummary(ctx: AnalysisContext): Promise<string>;
  /** A prioritized plan of 3-5 actions for next week. */
  weeklyPlan(ctx: AnalysisContext): Promise<string>;
  /** Natural-language Q&A over the account's data. */
  chat(question: string, ctx: AnalysisContext): Promise<string>;
}

export function buildContextPrompt(ctx: AnalysisContext): string {
  return [
    `Cuenta: ${ctx.account.displayName} (${ctx.account.handle}) en ${ctx.account.platform}.`,
    `Seguidores: ${ctx.account.followers}.`,
    `Audit global: ${ctx.audit.overall}/100 (${ctx.audit.grade}). Desglose:`,`  crecimiento=${ctx.audit.breakdown.growth}, engagement=${ctx.audit.breakdown.engagement},`,
    `  consistencia=${ctx.audit.breakdown.consistency}, calidad=${ctx.audit.breakdown.contentQuality},`,
    `  saludAudiencia=${ctx.audit.breakdown.audienceHealth}.`,
    `Mejores horarios: ${ctx.bestTimeSummary}.`,
    `Top hashtags: ${ctx.topHashtags.slice(0, 5).map((h) => `#${h.tag} (${(h.avgEngagement * 100).toFixed(1)}%)`).join(", ")}.`,
    `Posts recientes (engagement):`,
    ...ctx.recentPosts.slice(0, 5).map((p) => `  - "${(p.caption || "").slice(0, 60)}" ${(p.engagementRate * 100).toFixed(1)}% (${p.mediaType})`),
    ctx.competitors?.length
      ? `Competidores: ${ctx.competitors.map((c) => `${c.handle} (${c.followers}, ${(c.avgEngagementRate * 100).toFixed(1)}% eng)`).join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
