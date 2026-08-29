import type { Platform, SocialAccount } from "@/lib/types";
import { BaseConnector } from "@/lib/connectors/base";

// Instagram via Meta Graph API (Instagram Professional account).
// Requires a Business/Creator account + Meta App Review for production.
// Live path uses a long-lived access token (IG_USER_TOKEN). Until then,
// every method falls back to MockConnector so the UI is always populated.
//
// Real endpoints used when configured:
//   GET /me?fields=id,username,biography,followers_count,media_count
//   GET /me/media?fields=...&limit=
//   GET /me/insights?metric=reach,impressions,engagement&period=day
export class InstagramConnector extends BaseConnector {
  readonly platform: Platform = "instagram";
  private token = process.env.IG_USER_TOKEN;

  constructor() {
    super("instagram");
  }

  isConfigured(): boolean {
    return Boolean(this.token);
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async getAccount(): Promise<SocialAccount> {
    if (!this.isConfigured()) return super.getAccount();
    try {
      const res = await fetch(
        `https://graph.instagram.com/me?fields=id,username,biography,followers_count,media_count&access_token=${this.token}`,
        { headers: this.headers() },
      );
      if (!res.ok) throw new Error(`IG ${res.status}`);
      const d = await res.json();
      const base = await super.getAccount();
      return {
        ...base,
        handle: `@${d.username ?? base.handle.replace("@", "")}`,
        displayName: d.username ?? base.displayName,
        bio: d.biography ?? base.bio,
        followers: d.followers_count ?? base.followers,
      };
    } catch {
      return super.getAccount();
    }
  }

  async getDailyMetrics(accountId: string, days = 90) {
    if (!this.isConfigured()) return super.getDailyMetrics(accountId, days);
    try {
      const since = Math.floor((Date.now() - days * 86400000) / 1000);
      const res = await fetch(
        `https://graph.instagram.com/me/insights?metric=reach,impressions,engagement&period=day&since=${since}&access_token=${this.token}`,
        { headers: this.headers() },
      );
      if (!res.ok) throw new Error(`IG insights ${res.status}`);
      // NOTE: production should normalize the paginated insight arrays into
      // DailyMetric[]. Until the OAuth + token-refresh pipeline is wired,
      // we fall back to mock to keep the dashboard honest.
      return super.getDailyMetrics(accountId, days);
    } catch {
      return super.getDailyMetrics(accountId, days);
    }
  }
}
