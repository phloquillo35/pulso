import type { DailyMetric, HashtagStat, Platform, Post, SocialAccount } from "@/lib/types";
import { BaseConnector } from "@/lib/connectors/base";
import {
  computeDailyMetricsFromPosts,
  computeHashtagStats,
  mapFeedToPosts,
} from "./bluesky-logic.mjs";

// Bluesky via the open AT Protocol / public API (no app review required).
// Uses an app password (BLUESKY_IDENTIFIER + BLUESKY_APP_PASSWORD).
// Live path authenticates and pulls the real profile + recent posts.
const HOST = "https://bsky.social/xrpc";

export class BlueskyConnector extends BaseConnector {
  readonly platform: Platform = "bluesky";
  private identifier = process.env.BLUESKY_IDENTIFIER;
  private appPassword = process.env.BLUESKY_APP_PASSWORD;

  constructor() {
    super("bluesky");
  }

  isConfigured(): boolean {
    return Boolean(this.identifier && this.appPassword);
  }

  private async authenticate(): Promise<string | null> {
    try {
      const res = await fetch(`${HOST}/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: this.identifier,
          password: this.appPassword,
        }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d.accessJwt as string;
    } catch {
      return null;
    }
  }

  async getAccount(): Promise<SocialAccount> {
    if (!this.isConfigured()) return super.getAccount();
    const jwt = await this.authenticate();
    if (!jwt) return super.getAccount();
    try {
      const res = await fetch(
        `${HOST}/app.bsky.actor.getProfile?actor=${encodeURIComponent(this.identifier!)}`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      if (!res.ok) throw new Error(`bsky ${res.status}`);
      const d = await res.json();
      const base = await super.getAccount();
      return {
        ...base,
        handle: `@${d.handle}`,
        displayName: d.displayName ?? base.displayName,
        bio: d.description ?? base.bio,
        followers: d.followersCount ?? base.followers,
        following: d.followsCount ?? base.following,
      };
    } catch {
      return super.getAccount();
    }
  }

  // ─── Live feed (getAuthorFeed) ──────────────────────────────────────────
  private async fetchFeed(accountId: string, limit: number): Promise<Post[]> {
    const jwt = await this.authenticate();
    if (!jwt) return super.getPosts(accountId, limit);
    try {
      const res = await fetch(
        `${HOST}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(
          this.identifier!,
        )}&limit=${Math.min(limit, 100)}`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      if (!res.ok) throw new Error(`bsky feed ${res.status}`);
      const d = await res.json();
      const account = await super.getAccount();
      return mapFeedToPosts(d.feed ?? [], {
        accountId,
        platform: this.platform,
        followers: account.followers,
        handle: this.identifier!,
      }).slice(0, limit) as Post[];
    } catch {
      return super.getPosts(accountId, limit);
    }
  }

  async getPosts(accountId: string, limit = 40): Promise<Post[]> {
    if (!this.isConfigured()) return super.getPosts(accountId, limit);
    return this.fetchFeed(accountId, limit);
  }

  async getDailyMetrics(accountId: string, days = 90): Promise<DailyMetric[]> {
    if (!this.isConfigured()) return super.getDailyMetrics(accountId, days);
    try {
      const posts = await this.fetchFeed(accountId, 100);
      const account = await super.getAccount();
      return computeDailyMetricsFromPosts(posts, { days, followers: account.followers });
    } catch {
      return super.getDailyMetrics(accountId, days);
    }
  }

  async getHashtags(accountId: string): Promise<HashtagStat[]> {
    if (!this.isConfigured()) return super.getHashtags(accountId);
    try {
      const posts = await this.fetchFeed(accountId, 100);
      return computeHashtagStats(posts);
    } catch {
      return super.getHashtags(accountId);
    }
  }
}
