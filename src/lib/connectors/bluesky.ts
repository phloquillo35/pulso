import type { DailyMetric, HashtagStat, Platform, Post, SocialAccount } from "@/lib/types";
import { BaseConnector } from "@/lib/connectors/base";
import {
  computeDailyMetricsFromPosts,
  computeHashtagStats,
  mapFeedToPosts,
} from "./bluesky-logic.mjs";
import { fetchWithTimeout } from "@/lib/http.mjs";

// Bluesky via the open AT Protocol / public API (no app review required).
// Uses an app password (BLUESKY_IDENTIFIER + BLUESKY_APP_PASSWORD).
// Live path authenticates and pulls the real profile + recent posts.
const HOST = "https://bsky.social/xrpc";

export class BlueskyConnector extends BaseConnector {
  readonly platform: Platform = "bluesky";
  private identifier = process.env.BLUESKY_IDENTIFIER;
  private appPassword = process.env.BLUESKY_APP_PASSWORD;

  // ─── In-instance caches (one auth + one feed per analyze) ────────────────
  // `analyze()` runs getAccount + getDailyMetrics + getPosts + getHashtags in
  // parallel. Without caching that means 4 createSession + 3 getAuthorFeed calls
  // against Bluesky's strict rate limits. We cache the JWT and the feed on the
  // instance (a fresh connector is built per analyze) and dedupe in-flight
  // promises so parallel callers share a single network round-trip each.
  private jwt: string | null = null;
  private authInFlight: Promise<string | null> | null = null;
  private feedCache: Post[] | null = null;
  private feedInFlight: Promise<Post[]> | null = null;

  constructor() {
    super("bluesky");
  }

  isConfigured(): boolean {
    return Boolean(this.identifier && this.appPassword);
  }

  private authenticate(): Promise<string | null> {
    if (this.jwt) return Promise.resolve(this.jwt);
    if (this.authInFlight) return this.authInFlight;
    this.authInFlight = this.doAuthenticate();
    return this.authInFlight;
  }

  private async doAuthenticate(): Promise<string | null> {
    try {
      const res = await fetchWithTimeout(`${HOST}/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: this.identifier,
          password: this.appPassword,
        }),
      });
      if (res.status === 429) {
        console.warn(
          `[bluesky] rate-limited (429) on createSession for ${this.identifier}; falling back to mock.`,
        );
        return null;
      }
      if (!res.ok) return null;
      const d = await res.json();
      this.jwt = (d.accessJwt as string) || null;
      return this.jwt;
    } catch {
      return null;
    }
  }

  async getAccount(): Promise<SocialAccount> {
    if (!this.isConfigured()) return super.getAccount();
    const jwt = await this.authenticate();
    if (!jwt) return super.getAccount();
    try {
      const res = await fetchWithTimeout(
        `${HOST}/app.bsky.actor.getProfile?actor=${encodeURIComponent(this.identifier!)}`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      if (res.status === 429) {
        console.warn(
          `[bluesky] rate-limited (429) on getProfile for ${this.identifier}; falling back to mock.`,
        );
        return super.getAccount();
      }
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
  private fetchFeed(accountId: string, limit: number): Promise<Post[]> {
    if (this.feedCache) return Promise.resolve(this.feedCache.slice(0, limit));
    if (this.feedInFlight) return this.feedInFlight.then((p) => p.slice(0, limit));
    this.feedInFlight = this.doFetchFeed(accountId);
    return this.feedInFlight.then((p) => p.slice(0, limit));
  }

  private async doFetchFeed(accountId: string): Promise<Post[]> {
    const jwt = await this.authenticate();
    if (!jwt) return super.getPosts(accountId, 100);
    try {
      const res = await fetchWithTimeout(
        `${HOST}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(
          this.identifier!,
        )}&limit=100`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      if (res.status === 429) {
        console.warn(
          `[bluesky] rate-limited (429) on getAuthorFeed for ${this.identifier}; falling back to mock.`,
        );
        return super.getPosts(accountId, 100);
      }
      if (!res.ok) throw new Error(`bsky feed ${res.status}`);
      const d = await res.json();
      const account = await super.getAccount();
      const posts = mapFeedToPosts(d.feed ?? [], {
        accountId,
        platform: this.platform,
        followers: account.followers,
        handle: this.identifier!,
      }) as Post[];
      this.feedCache = posts;
      return posts;
    } catch {
      return super.getPosts(accountId, 100);
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
