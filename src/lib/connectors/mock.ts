import type {
  BestTimeCell,
  DailyMetric,
  HashtagStat,
  MediaType,
  Platform,
  Post,
  PostMetrics,
  SocialAccount,
} from "@/lib/types";
import { clamp, seededRng } from "@/lib/utils";
import type { SocialConnector } from "@/lib/connectors/types";
import { computeHashtagStats } from "./bluesky-logic.mjs";

// ─── Demo portfolio (one account per platform) ──────────────────────────
export const DEMO_ACCOUNTS: Record<Platform, SocialAccount> = {
  instagram: {
    id: "acc_ig",
    platform: "instagram",
    handle: "@lucia.crea",
    displayName: "Lucía Crea",
    followers: 142_300,
    following: 612,
    bio: "Diseño & lifestyle · ayudo a marcas a brillar ✨",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  tiktok: {
    id: "acc_tt",
    platform: "tiktok",
    handle: "@lucia.crea",
    displayName: "Lucía Crea",
    followers: 98_400,
    following: 340,
    bio: "Tips de diseño en 30s",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  youtube: {
    id: "acc_yt",
    platform: "youtube",
    handle: "Lucía Crea",
    displayName: "Lucía Crea",
    followers: 54_900,
    following: 0,
    bio: "Tutoriales de diseño y negocios",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  x: {
    id: "acc_x",
    platform: "x",
    handle: "@lucia_crea",
    displayName: "Lucía Crea",
    followers: 22_100,
    following: 880,
    bio: "Diseño, negocios y un poco de caos creativo.",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  facebook: {
    id: "acc_fb",
    platform: "facebook",
    handle: "Lucía Crea",
    displayName: "Lucía Crea",
    followers: 31_700,
    following: 120,
    bio: "Comunidad de diseño y emprendimiento",
    category: "Negocio",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  linkedin: {
    id: "acc_li",
    platform: "linkedin",
    handle: "Lucía Crea",
    displayName: "Lucía Crea",
    followers: 12_400,
    following: 950,
    bio: "Founder · diseño de producto",
    category: "Negocio",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  threads: {
    id: "acc_th",
    platform: "threads",
    handle: "@lucia.crea",
    displayName: "Lucía Crea",
    followers: 8_200,
    following: 210,
    bio: "Pensamientos cortos sobre diseño",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  pinterest: {
    id: "acc_pin",
    platform: "pinterest",
    handle: "luciacrea",
    displayName: "Lucía Crea",
    followers: 19_500,
    following: 70,
    bio: "Moodboards y referencias",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
  bluesky: {
    id: "acc_bsky",
    platform: "bluesky",
    handle: "@lucia.bsky.social",
    displayName: "Lucía Crea",
    followers: 5_100,
    following: 430,
    bio: "Diseño y negocios",
    category: "Creador",
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  },
};

const MEDIA_WEIGHTS: Record<Platform, [MediaType, number][]> = {
  instagram: [["carousel", 0.4], ["reel", 0.35], ["image", 0.25]],
  tiktok: [["video", 1]],
  youtube: [["video", 1]],
  x: [["text", 0.5], ["image", 0.5]],
  facebook: [["image", 0.4], ["video", 0.3], ["carousel", 0.3]],
  linkedin: [["text", 0.45], ["image", 0.35], ["carousel", 0.2]],
  threads: [["text", 1]],
  pinterest: [["image", 1]],
  bluesky: [["text", 0.6], ["image", 0.4]],
};

const CAPTIONS = [
  "Cómo subí mi engagement un 40% en 30 días 🚀",
  "El error de diseño que arruina tu feed (y cómo evitarlo)",
  "3 herramientas que uso todos los días para crear contenido",
  "Detrás de cámaras: así planeo mi semana de posts",
  "Por qué tu bio importa más de lo que creés",
  "Mi rutina de branding para emprendedores",
  "Antes y después: rediseño de una marca pequeña",
  "El algoritmo premia la consistencia, no la suerte",
  "5 ideas de carrusel que la gente guarda",
  "Qué aprendí de mis 100k seguidores",
];

const HASHTAG_POOL = [
  "diseno", "emprendimiento", "marcaPersonal", "socialmedia", "contenido",
  "creadores", "branding", "marketingdigital", "tips", "growth", "reels",
  "lifestyle", "negocios", "community", "storytelling",
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedMedia(rng: () => number, platform: Platform): MediaType {
  const weights = MEDIA_WEIGHTS[platform];
  const r = rng();
  let acc = 0;
  for (const [media, w] of weights) {
    acc += w;
    if (r <= acc) return media;
  }
  return weights[0][0];
}

function engagementRateFor(rng: () => number, platform: Platform): number {
  // Platform-typical engagement rates
  const base: Record<Platform, number> = {
    instagram: 0.045, tiktok: 0.07, youtube: 0.04, x: 0.02,
    facebook: 0.025, linkedin: 0.035, threads: 0.03, pinterest: 0.03, bluesky: 0.025,
  };
  return clamp(base[platform] * (0.6 + rng() * 0.9), 0.005, 0.2);
}

export class MockConnector implements SocialConnector {
  readonly platform: Platform;
  private account: SocialAccount;

  constructor(platform: Platform) {
    this.platform = platform;
    this.account = DEMO_ACCOUNTS[platform];
  }

  isConfigured(): boolean {
    return false;
  }

  async getAccount(_handle?: string): Promise<SocialAccount> {
    return this.account;
  }

  async getDailyMetrics(_accountId: string, days = 90): Promise<DailyMetric[]> {
    const rng = seededRng(hashSeed(this.account.id + ":daily"));
    const out: DailyMetric[] = [];
    const end = new Date();
    const startFollowers = Math.round(this.account.followers * 0.82);
    const totalGrowth = this.account.followers - startFollowers;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const t = (days - 1 - i) / (days - 1);
      const trend = startFollowers + totalGrowth * t;
      const weekly = Math.sin((d.getDay() / 7) * Math.PI * 2) * 0.01;
      const noise = (rng() - 0.5) * 0.02;
      const followers = Math.round(trend * (1 + weekly + noise));
      const reach = Math.round(followers * (0.12 + rng() * 0.25));
      const impressions = Math.round(reach * (1.1 + rng() * 0.5));
      const engagement = Math.round(reach * engagementRateFor(rng, this.platform));
      const newFollowers = Math.round((totalGrowth / days) * (0.5 + rng()));
      const unfollows = Math.round(newFollowers * (0.2 + rng() * 0.4));
      out.push({
        date: d.toISOString().slice(0, 10),
        followers,
        engagement,
        reach,
        impressions,
        newFollowers,
        unfollows,
      });
    }
    return out;
  }

  async getPosts(_accountId: string, limit = 40): Promise<Post[]> {
    const rng = seededRng(hashSeed(this.account.id + ":posts"));
    const out: Post[] = [];
    const now = Date.now();
    const er = engagementRateFor(rng, this.platform);
    for (let i = 0; i < limit; i++) {
      const daysAgo = Math.floor(rng() * 60);
      const hour = Math.floor(rng() * 24);
      const published = new Date(now - daysAgo * 86400000);
      published.setHours(hour, Math.floor(rng() * 60), 0, 0);
      const mediaType = weightedMedia(rng, this.platform);
      const reach = Math.round(this.account.followers * (0.08 + rng() * 0.4));
      const impressions = Math.round(reach * (1.1 + rng() * 0.5));
      const views = mediaType === "video" || mediaType === "reel"
        ? Math.round(reach * (1.3 + rng() * 1.5))
        : 0;
      const likes = Math.round(reach * er * (0.7 + rng() * 0.8));
      const comments = Math.round(likes * (0.02 + rng() * 0.06));
      const shares = Math.round(likes * (0.01 + rng() * 0.05));
      const saves = Math.round(likes * (0.03 + rng() * 0.12));
      const clicks = Math.round(likes * (0.05 + rng() * 0.2));
      const metrics: PostMetrics = {
        likes, comments, shares, saves, views, reach, impressions, clicks,
        engagementRate: reach > 0 ? (likes + comments + shares + saves) / reach : 0,
      };
      const tagCount = 2 + Math.floor(rng() * 5);
      const hashtags: string[] = [];
      for (let h = 0; h < tagCount; h++) {
        const t = pick(rng, HASHTAG_POOL);
        if (!hashtags.includes(t)) hashtags.push(t);
      }
      out.push({
        id: `${this.account.id}_post_${i}`,
        accountId: this.account.id,
        platform: this.platform,
        caption: pick(rng, CAPTIONS),
        mediaType,
        publishedAt: published.toISOString(),
        hashtags,
        metrics,
      });
    }
    return out.sort(
      (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
  }

  async getBestTimes(_accountId: string): Promise<BestTimeCell[]> {
    const posts = await this.getPosts(_accountId, 60);
    return computeBestTimesFromPosts(posts);
  }

  async getHashtags(accountId: string): Promise<HashtagStat[]> {
    const posts = await this.getPosts(accountId, 60);
    return computeHashtagStats(posts);
  }
}

// Shared: derive a 7x24 best-time heatmap from post engagement.
export function computeBestTimesFromPosts(posts: Post[]): BestTimeCell[] {
  const rng = seededRng(12345);
  // base curve: two daily peaks (12:00, 19:00), weekends slightly lower
  const base = (day: number, hour: number) => {
    const peak1 = Math.exp(-((hour - 12) ** 2) / 8);
    const peak2 = Math.exp(-((hour - 19) ** 2) / 6);
    const weekend = day === 0 || day === 6 ? 0.85 : 1;
    return (peak1 * 0.7 + peak2 * 1) * weekend;
  };
  const cells = new Map<string, { sum: number; n: number }>();
  const med = median(posts.map((p) => p.metrics.engagementRate)) || 0.03;
  for (const p of posts) {
    const d = new Date(p.publishedAt);
    const key = `${d.getDay()}_${d.getHours()}`;
    const perf = p.metrics.engagementRate / med;
    const cur = cells.get(key) ?? { sum: 0, n: 0 };
    cur.sum += perf;
    cur.n += 1;
    cells.set(key, cur);
  }
  const out: BestTimeCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const b = base(day, hour);
      const cell = cells.get(`${day}_${hour}`);
      const perfFactor = cell ? cell.sum / cell.n : 1;
      const raw = b * (0.6 + 0.4 * perfFactor) * (0.9 + rng() * 0.2);
      out.push({ day, hour, score: raw });
    }
  }
  // normalize to 0..1
  const max = Math.max(...out.map((c) => c.score));
  const min = Math.min(...out.map((c) => c.score));
  return out.map((c) => ({
    day: c.day,
    hour: c.hour,
    score: max === min ? 0.5 : (c.score - min) / (max - min),
  }));
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
