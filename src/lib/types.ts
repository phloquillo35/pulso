// ─── Pulso domain model ────────────────────────────────────────────────
// Shared types used across connectors, AI layer, data provider and UI.

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky";

export const PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "facebook",
  "linkedin",
  "threads",
  "pinterest",
  "bluesky",
];

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
  threads: "Threads",
  bluesky: "Bluesky",
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#000000",
  x: "#0F1419",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  pinterest: "#E60023",
  threads: "#000000",
  bluesky: "#1185FE",
};

export interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  following?: number;
  bio?: string;
  category?: string;
  connected: boolean;
  lastSyncedAt?: string;
}

export type MediaType = "image" | "video" | "carousel" | "text" | "reel";

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number; // computed: (likes+comments+shares+saves)/reach
}

export interface Post {
  id: string;
  accountId: string;
  platform: Platform;
  caption: string;
  mediaType: MediaType;
  publishedAt: string; // ISO
  hashtags: string[];
  url?: string;
  metrics: PostMetrics;
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  newFollowers: number;
  unfollows: number;
}

export interface HashtagStat {
  tag: string;
  uses: number;
  totalLikes: number;
  avgEngagement: number;
  reach: number;
}

export interface Competitor {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  followers: number;
  avgEngagementRate: number;
  postingFrequency: number; // posts/week
  growth30d: number; // %
  topPost?: string;
}

export interface BestTimeCell {
  day: number; // 0=Sun .. 6=Sat
  hour: number; // 0..23
  score: number; // 0..1 engagement intensity
}

export type AuditGrade = "A" | "B" | "C" | "D";

export interface AuditScore {
  accountId: string;
  overall: number; // 0..100
  breakdown: {
    growth: number;
    engagement: number;
    consistency: number;
    contentQuality: number;
    audienceHealth: number;
  };
  grade: AuditGrade;
  recommendations: string[];
}

export type InsightKind = "win" | "risk" | "opportunity" | "anomaly";
export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  detail: string;
  severity: InsightSeverity;
  createdAt: string;
}

export interface AccountAnalysis {
  account: SocialAccount;
  daily: DailyMetric[];
  posts: Post[];
  bestTimes: BestTimeCell[];
  hashtags: HashtagStat[];
  audit: AuditScore;
  insights: Insight[];
  source: "live" | "mock";
}
