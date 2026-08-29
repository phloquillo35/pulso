// ─── Pulso · Bluesky pure logic (AT Protocol) ───────────────────────────
// Framework-free, dependency-free, env-free. Safe to unit-test in plain Node
// (no TS, no path aliases). The connector (bluesky.ts) does the network I/O
// and delegates all transformation/aggregation to these functions so the
// mapping is deterministic and testable without hitting the network.

/**
 * Extract hashtags from a Bluesky post record.
 * Primary source: rich-text facets with $type "...#tag" (authoritative).
 * Fallback: scan the caption text for #word tokens (covers clients that
 * don't emit facets). Returns lowercased, de-duplicated tags.
 */
export function parseFacetsToHashtags(facets, text) {
  const tags = new Set();
  if (Array.isArray(facets)) {
    for (const f of facets) {
      const feats = (f && f.features) || [];
      for (const feat of feats) {
        if (!feat) continue;
        const t = feat.$type || "";
        const isTag = t === "app.bsky.richtext.facet#tag" || t.endsWith("#tag");
        if (isTag && feat.tag) tags.add(String(feat.tag).replace(/^#/, "").toLowerCase());
      }
    }
  }
  if (text && typeof text === "string") {
    const re = /#(\w+)/g;
    let m;
    while ((m = re.exec(text)) !== null) tags.add(m[1].toLowerCase());
  }
  return [...tags];
}

/** Map a Bluesky embed to our MediaType vocabulary. */
export function deriveMediaType(embed) {
  if (!embed) return "text";
  const t = embed.$type || "";
  if (t.includes("images")) return "image";
  if (t.includes("video")) return "video";
  return "text";
}

/**
 * Map a single AT Protocol feed item to a Pulso Post.
 * ctx = { accountId, platform, followers, handle? }
 * Bluesky's open API does not expose reach/impressions, so those are 0 and
 * engagementRate is computed against the known follower count (a honest proxy).
 */
export function mapFeedItemToPost(item, ctx) {
  const post = (item && item.post) || item || {};
  const record = post.record || {};
  const followers = ctx && ctx.followers ? ctx.followers : 0;
  const likes = post.likeCount || 0;
  const comments = post.replyCount || 0;
  const shares = post.repostCount || 0;
  const saves = post.quoteCount || 0;
  const engagement = likes + comments + shares + saves;
  const engagementRate = followers > 0 ? engagement / followers : 0;

  const uri = post.uri || "";
  const rkey = uri.split("/").pop() || "";
  const handle = (post.author && post.author.handle) || (ctx && ctx.handle) || "";
  const url =
    rkey && handle ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined;

  return {
    id: uri || `${ctx.accountId}_${Math.random().toString(36).slice(2)}`,
    accountId: ctx.accountId,
    platform: ctx.platform,
    caption: record.text || "",
    mediaType: deriveMediaType(post.embed || record.embed),
    publishedAt: record.createdAt || post.indexedAt || new Date().toISOString(),
    hashtags: parseFacetsToHashtags(record.facets, record.text),
    url,
    metrics: {
      likes,
      comments,
      shares,
      saves,
      views: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
      engagementRate,
    },
  };
}

/** Map an entire getAuthorFeed response `feed` array to Post[]. */
export function mapFeedToPosts(feed, ctx) {
  if (!Array.isArray(feed)) return [];
  return feed.map((item) => mapFeedItemToPost(item, ctx));
}

/**
 * Aggregate posts into DailyMetric[] for the last `days` days.
 * Bluesky's open API has no historical follower series, so `followers` is the
 * current known count (flat) and newFollowers/unfollows/reach/impressions are
 * 0. Engagement per day IS real (summed from posts published that day).
 */
export function computeDailyMetricsFromPosts(posts, { days = 90, followers = 0 } = {}) {
  const byDate = new Map();
  for (const p of posts || []) {
    const date = (p.publishedAt || "").slice(0, 10);
    if (!date) continue;
    const m = p.metrics || {};
    const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
    byDate.set(date, (byDate.get(date) || 0) + eng);
  }
  const out = [];
  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    out.push({
      date,
      followers,
      engagement: byDate.get(date) || 0,
      reach: 0,
      impressions: 0,
      newFollowers: 0,
      unfollows: 0,
    });
  }
  return out;
}

/**
 * Compute HashtagStat[] from posts, sorted by avgEngagement desc.
 * Shared with the mock connector to avoid duplicated aggregation logic.
 */
export function computeHashtagStats(posts) {
  const map = new Map();
  for (const p of posts || []) {
    const eng = (p.metrics && p.metrics.engagementRate) || 0;
    const likes = (p.metrics && p.metrics.likes) || 0;
    const reach = (p.metrics && p.metrics.reach) || 0;
    for (const tag of p.hashtags || []) {
      const cur = map.get(tag) || { uses: 0, likes: 0, reach: 0, eng: 0 };
      cur.uses += 1;
      cur.likes += likes;
      cur.reach += reach;
      cur.eng += eng;
      map.set(tag, cur);
    }
  }
  return Array.from(map.entries())
    .map(([tag, v]) => ({
      tag,
      uses: v.uses,
      totalLikes: v.likes,
      avgEngagement: v.uses ? v.eng / v.uses : 0,
      reach: v.reach,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}
