import type {
  AccountAnalysis,
  Competitor,
  Platform,
  SocialAccount,
} from "@/lib/types";
import { getConnector } from "@/lib/connectors";
import { DEMO_ACCOUNTS } from "@/lib/connectors/mock";
import { computeAudit } from "@/lib/analytics/audit";
import { detectInsights } from "@/lib/analytics/insights";
import { COMPETITORS } from "@/lib/data/mock-portfolio";
import { SupabaseDataProvider } from "@/lib/data/supabase-provider";

export interface DataProvider {
  getPortfolio(): Promise<SocialAccount[]>;
  analyze(platform: Platform): Promise<AccountAnalysis>;
  getCompetitors(platform: Platform): Promise<Competitor[]>;
}

// Default, zero-config provider. Uses connectors (mock or live) + analytics.
export class MockDataProvider implements DataProvider {
  async getPortfolio(): Promise<SocialAccount[]> {
    return Object.values(DEMO_ACCOUNTS);
  }

  async analyze(platform: Platform): Promise<AccountAnalysis> {
    const connector = getConnector(platform);
    const account = await connector.getAccount();
    const [daily, posts, bestTimes, hashtags] = await Promise.all([
      connector.getDailyMetrics(account.id, 90),
      connector.getPosts(account.id, 40),
      connector.getBestTimes(account.id),
      connector.getHashtags(account.id),
    ]);
    const audit = computeAudit(account, daily, posts);
    const insights = detectInsights(account, daily, posts, bestTimes);
    return {
      account,
      daily,
      posts,
      bestTimes,
      hashtags,
      audit,
      insights,
      source: connector.isConfigured() ? "live" : "mock",
    };
  }

  async getCompetitors(platform: Platform): Promise<Competitor[]> {
    return COMPETITORS[platform] ?? [];
  }
}

// Returns the active provider. When Supabase env vars are present we use the
// multi-tenant SupabaseDataProvider, which transparently falls back to the
// MockDataProvider (demo) when there is no session or no synced data.
// Without env vars we run fully on MockDataProvider (zero-config demo).
export function getProvider(): DataProvider {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new SupabaseDataProvider();
  }
  return new MockDataProvider();
}
