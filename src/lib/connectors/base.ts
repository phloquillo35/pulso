import type {
  BestTimeCell,
  DailyMetric,
  HashtagStat,
  Platform,
  Post,
  SocialAccount,
} from "@/lib/types";
import type { SocialConnector } from "@/lib/connectors/types";
import { MockConnector } from "@/lib/connectors/mock";

// Base for real connectors: delegates to MockConnector when not configured
// or when a live call fails, so the product always renders.
export abstract class BaseConnector implements SocialConnector {
  abstract readonly platform: Platform;
  protected mock: MockConnector;

  constructor(platform: Platform) {
    this.mock = new MockConnector(platform);
  }

  abstract isConfigured(): boolean;

  async getAccount(handle?: string): Promise<SocialAccount> {
    return this.mock.getAccount(handle);
  }
  async getPosts(accountId: string, limit?: number): Promise<Post[]> {
    return this.mock.getPosts(accountId, limit);
  }
  async getDailyMetrics(accountId: string, days?: number): Promise<DailyMetric[]> {
    return this.mock.getDailyMetrics(accountId, days);
  }
  async getBestTimes(accountId: string): Promise<BestTimeCell[]> {
    return this.mock.getBestTimes(accountId);
  }
  async getHashtags(accountId: string): Promise<HashtagStat[]> {
    return this.mock.getHashtags(accountId);
  }
}
