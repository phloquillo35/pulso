import type {
  BestTimeCell,
  DailyMetric,
  HashtagStat,
  Platform,
  Post,
  SocialAccount,
} from "@/lib/types";

// ─── Connector contract ─────────────────────────────────────────────────
// Every social network implements this. MockConnector provides realistic
// data with zero config; real connectors (Instagram, Bluesky) implement
// the same surface against the network's API and fall back to mock when
// credentials are absent.

export interface SocialConnector {
  readonly platform: Platform;
  /** True when real credentials/env are present and the connector is live. */
  isConfigured(): boolean;
  getAccount(handle?: string): Promise<SocialAccount>;
  getPosts(accountId: string, limit?: number): Promise<Post[]>;
  getDailyMetrics(accountId: string, days?: number): Promise<DailyMetric[]>;
  getBestTimes(accountId: string): Promise<BestTimeCell[]>;
  getHashtags(accountId: string): Promise<HashtagStat[]>;
}
