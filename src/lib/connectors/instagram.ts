import type { Platform, SocialAccount } from "@/lib/types";
import { BaseConnector } from "@/lib/connectors/base";
import { resolveInstagramToken, isInstagramConfigured, fetchInstagramDailyMetrics } from "@/lib/connectors/instagram-logic.mjs";

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
  private token = resolveInstagramToken();

  constructor() {
    super("instagram");
  }

  isConfigured(): boolean {
    return isInstagramConfigured();
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
    // Live path: fetch real insights from the Graph API and normalize them
    // into DailyMetric[]. Any failure (no token, network error, malformed
    // payload) returns null → fall back to the mock so the UI stays populated.
    const live = await fetchInstagramDailyMetrics(fetch, this.token, days);
    return live ?? super.getDailyMetrics(accountId, days);
  }
}
