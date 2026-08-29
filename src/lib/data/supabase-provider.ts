import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AccountAnalysis,
  AuditScore,
  BestTimeCell,
  Competitor,
  DailyMetric,
  HashtagStat,
  Insight,
  MediaType,
  Platform,
  Post,
  SocialAccount,
} from "@/lib/types";
import type { DataProvider } from "@/lib/data/provider";
import { MockDataProvider } from "@/lib/data/provider";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/auth";
import { computeAudit } from "@/lib/analytics/audit";
import { detectInsights } from "@/lib/analytics/insights";
import { computeBestTimesFromPosts } from "@/lib/connectors/mock";
import { PLATFORMS } from "@/lib/types";

// ─── Row → domain mappers (snake_case DB → camelCase domain) ──────────────
function asPlatform(value: string): Platform {
  return (PLATFORMS as string[]).includes(value) ? (value as Platform) : "bluesky";
}

function rowToAccount(r: any): SocialAccount {
  return {
    id: r.id,
    platform: asPlatform(r.platform),
    handle: r.handle,
    displayName: r.display_name ?? r.handle,
    avatarUrl: r.avatar_url ?? undefined,
    followers: r.followers ?? 0,
    following: r.following ?? undefined,
    bio: r.bio ?? undefined,
    category: r.category ?? undefined,
    connected: r.connected ?? true,
    lastSyncedAt: r.last_synced_at ?? undefined,
  };
}

function rowToPost(r: any): Post {
  const media = ["image", "video", "carousel", "text", "reel"].includes(r.media_type)
    ? (r.media_type as MediaType)
    : "text";
  const m = r.metrics ?? {};
  return {
    id: r.id,
    accountId: r.account_id,
    platform: asPlatform(r.platform),
    caption: r.caption ?? "",
    mediaType: media,
    publishedAt: r.published_at,
    hashtags: Array.isArray(r.hashtags) ? r.hashtags : [],
    url: r.url ?? undefined,
    metrics: {
      likes: m.likes ?? 0,
      comments: m.comments ?? 0,
      shares: m.shares ?? 0,
      saves: m.saves ?? 0,
      views: m.views ?? 0,
      reach: m.reach ?? 0,
      impressions: m.impressions ?? 0,
      clicks: m.clicks ?? 0,
      engagementRate: m.engagementRate ?? 0,
    },
  };
}

function rowToDaily(r: any): DailyMetric {
  return {
    date: r.date,
    followers: r.followers ?? 0,
    engagement: r.engagement ?? 0,
    reach: r.reach ?? 0,
    impressions: r.impressions ?? 0,
    newFollowers: r.new_followers ?? 0,
    unfollows: r.unfollows ?? 0,
  };
}

function rowToHashtag(r: any): HashtagStat {
  return {
    tag: r.tag,
    uses: r.uses ?? 0,
    totalLikes: r.total_likes ?? 0,
    avgEngagement: r.avg_engagement ?? 0,
    reach: r.reach ?? 0,
  };
}

function rowToAudit(r: any, accountId: string): AuditScore {
  return {
    accountId,
    overall: r.overall ?? 0,
    breakdown: r.breakdown ?? {},
    grade: r.grade ?? "C",
    recommendations: Array.isArray(r.recommendations) ? r.recommendations : [],
  };
}

function rowToInsight(r: any): Insight {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    detail: r.detail,
    severity: r.severity ?? "info",
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function rowToCompetitor(r: any): Competitor {
  return {
    id: r.id,
    platform: asPlatform(r.platform),
    handle: r.handle,
    displayName: r.display_name ?? r.handle,
    followers: r.followers ?? 0,
    avgEngagementRate: r.avg_engagement_rate ?? 0,
    postingFrequency: r.posting_frequency ?? 0,
    growth30d: r.growth_30d ?? 0,
  };
}

/**
 * Production, multi-tenant data provider backed by Supabase.
 *
 * Activation: only used when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set
 * (see getProvider()). When Supabase is configured but there is no session,
 * or the signed-in user has no rows for a given platform, every method
 * transparently falls back to MockDataProvider so the product always renders.
 *
 * RLS (supabase/migrations/0001_init.sql) scopes every query to auth.uid(),
 * so a user can only ever read/write their own accounts, posts and metrics.
 */
export class SupabaseDataProvider implements DataProvider {
  private fallback = new MockDataProvider();
  private client: SupabaseClient | null = null;
  private userId: string | null | undefined = undefined; // undefined = not yet resolved
  private resolved = false;

  private async resolve() {
    if (this.resolved) return;
    this.resolved = true;
    if (!isSupabaseEnabled()) return;
    try {
      const supabase = await createSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        this.client = supabase;
        this.userId = data.user.id;
      }
    } catch {
      this.client = null;
      this.userId = null;
    }
  }

  async getPortfolio(): Promise<SocialAccount[]> {
    await this.resolve();
    if (!this.client || !this.userId) return this.fallback.getPortfolio();
    const { data, error } = await this.client
      .from("accounts")
      .select("*")
      .eq("user_id", this.userId);
    if (error || !data || data.length === 0) return this.fallback.getPortfolio();
    return data.map(rowToAccount);
  }

  async analyze(platform: Platform): Promise<AccountAnalysis> {
    await this.resolve();
    if (this.client && this.userId) {
      const { data: acc } = await this.client
        .from("accounts")
        .select("*")
        .eq("user_id", this.userId)
        .eq("platform", platform)
        .maybeSingle();
      if (acc) {
        const analysis = await this.buildFromDb(rowToAccount(acc));
        if (analysis) return analysis;
      }
    }
    return this.fallback.analyze(platform);
  }

  private async buildFromDb(account: SocialAccount): Promise<AccountAnalysis | null> {
    const client = this.client!;
    const [
      { data: posts },
      { data: daily },
      { data: tags },
      { data: audits },
      { data: insights },
    ] = await Promise.all([
      client
        .from("posts")
        .select("*")
        .eq("account_id", account.id)
        .order("published_at", { ascending: false })
        .limit(100),
      client
        .from("daily_metrics")
        .select("*")
        .eq("account_id", account.id)
        .order("date", { ascending: true }),
      client.from("hashtag_stats").select("*").eq("account_id", account.id),
      client
        .from("audit_scores")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(1),
      client
        .from("insights")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false }),
    ]);

    const postRows = (posts ?? []) as any[];
    const dailyRows = (daily ?? []) as any[];
    // Nothing synced for this account yet → fall back to demo analysis.
    if (postRows.length === 0 && dailyRows.length === 0) return null;

    const mappedPosts = postRows.map(rowToPost);
    const mappedDaily = dailyRows.map(rowToDaily);
    const mappedTags = (tags ?? []).map(rowToHashtag);
    const bestTimes: BestTimeCell[] = computeBestTimesFromPosts(mappedPosts);
    const audit =
      audits && audits[0]
        ? rowToAudit(audits[0], account.id)
        : computeAudit(account, mappedDaily, mappedPosts);
    const mappedInsights =
      insights && insights.length
        ? (insights as any[]).map(rowToInsight)
        : detectInsights(account, mappedDaily, mappedPosts, bestTimes);

    return {
      account,
      daily: mappedDaily,
      posts: mappedPosts,
      bestTimes,
      hashtags: mappedTags,
      audit,
      insights: mappedInsights,
      source: "live",
    };
  }

  async getCompetitors(platform: Platform): Promise<Competitor[]> {
    await this.resolve();
    if (!this.client || !this.userId) return this.fallback.getCompetitors(platform);
    const { data, error } = await this.client
      .from("competitors")
      .select("*")
      .eq("user_id", this.userId)
      .eq("platform", platform);
    if (error || !data || data.length === 0) return this.fallback.getCompetitors(platform);
    return data.map(rowToCompetitor);
  }
}
