import type { Competitor, Platform } from "@/lib/types";

// Benchmarking competitors per platform (mock registry; replaced by live
// discovery when real connectors / a listening service are wired).
export const COMPETITORS: Record<Platform, Competitor[]> = {
  instagram: [
    { id: "c_ig_1", platform: "instagram", handle: "@rival.brand", displayName: "Rival Brand", followers: 120_000, avgEngagementRate: 0.052, postingFrequency: 5, growth30d: 8.4 },
    { id: "c_ig_2", platform: "instagram", handle: "@otro.creador", displayName: "Otro Creador", followers: 88_500, avgEngagementRate: 0.061, postingFrequency: 4, growth30d: 12.1 },
    { id: "c_ig_3", platform: "instagram", handle: "@top.nicho", displayName: "Top del Nicho", followers: 210_300, avgEngagementRate: 0.039, postingFrequency: 7, growth30d: 5.2 },
  ],
  tiktok: [
    { id: "c_tt_1", platform: "tiktok", handle: "@top.tiktoker", displayName: "Top TikToker", followers: 540_000, avgEngagementRate: 0.09, postingFrequency: 10, growth30d: 18.0 },
    { id: "c_tt_2", platform: "tiktok", handle: "@rival.tt", displayName: "Rival TT", followers: 76_000, avgEngagementRate: 0.075, postingFrequency: 6, growth30d: 9.5 },
  ],
  youtube: [
    { id: "c_yt_1", platform: "youtube", handle: "Canal Rival", displayName: "Canal Rival", followers: 320_000, avgEngagementRate: 0.045, postingFrequency: 2, growth30d: 4.0 },
  ],
  x: [
    { id: "c_x_1", platform: "x", handle: "@rival_x", displayName: "Rival X", followers: 95_000, avgEngagementRate: 0.018, postingFrequency: 14, growth30d: 2.1 },
  ],
  facebook: [
    { id: "c_fb_1", platform: "facebook", handle: "Página Rival", displayName: "Página Rival", followers: 140_000, avgEngagementRate: 0.022, postingFrequency: 5, growth30d: 3.0 },
  ],
  linkedin: [
    { id: "c_li_1", platform: "linkedin", handle: "Rival LinkedIn", displayName: "Rival LinkedIn", followers: 60_000, avgEngagementRate: 0.03, postingFrequency: 3, growth30d: 6.0 },
  ],
  threads: [
    { id: "c_th_1", platform: "threads", handle: "@rival.th", displayName: "Rival Threads", followers: 22_000, avgEngagementRate: 0.028, postingFrequency: 8, growth30d: 10.0 },
  ],
  pinterest: [
    { id: "c_pin_1", platform: "pinterest", handle: "rivalpin", displayName: "Rival Pinterest", followers: 80_000, avgEngagementRate: 0.025, postingFrequency: 12, growth30d: 7.0 },
  ],
  bluesky: [
    { id: "c_bsky_1", platform: "bluesky", handle: "@rival.bsky.social", displayName: "Rival Bluesky", followers: 14_000, avgEngagementRate: 0.02, postingFrequency: 9, growth30d: 15.0 },
  ],
};
