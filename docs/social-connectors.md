# Pulso · Social Connectors

How Pulso pulls data from each network, what's real today, and what's required to
go live. The architecture is uniform: every network implements `SocialConnector`
(`src/lib/connectors/types.ts`). Each connector falls back to `MockConnector`
when not configured, so the product always renders.

```
SocialConnector (Mock / Instagram / Bluesky)
   → DataProvider (Mock / Supabase)  → server components  → UI
```

---

## Bluesky (LIVE today — open API)

- **Auth:** App password. Set `BLUESKY_IDENTIFIER` + `BLUESKY_APP_PASSWORD`.
- **No app review required.** The AT Protocol public API is open.
- **Implemented:**
  - `getAccount` → `app.bsky.actor.getProfile` (handle, displayName, bio, followers, following).
  - `getPosts` → `app.bsky.feed.getAuthorFeed` (real captions, dates, like/reply/repost/quote counts, images, hashtags from rich-text facets).
  - `getDailyMetrics` → derived from real posts (engagement per day is real; follower count is the current known value — the open API has no historical follower series).
  - `getHashtags` → derived from real post facets/text.
  - `getBestTimes` → derived from real posts via `computeBestTimesFromPosts`.
- **Purity:** all transformation/aggregation lives in `src/lib/connectors/bluesky-logic.mjs`
  (framework-free, unit-tested in `mcp/run-tests.mjs`). The connector only does I/O.
- **Known limits:** no reach/impressions (open API doesn't expose them) → `reach`/`impressions` are `0` and `engagementRate` is computed against follower count. No historical followers.

---

## Instagram (env-gated — requires Meta App Review)

- **Auth:** Meta Graph API with an Instagram **Business or Creator** account.
- **Required:** `IG_USER_TOKEN` (long-lived access token). For real OAuth you also need
  `IG_APP_ID`, `IG_APP_SECRET`, `IG_REDIRECT_URI` and a callback route.
- **Endpoints used when configured:**
  - `GET /me?fields=id,username,biography,followers_count,media_count`
  - `GET /me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,...`
  - `GET /me/insights?metric=reach,impressions,engagement&period=day`
- **Status:** `getAccount` is live. `getDailyMetrics` currently falls back to mock until
  the OAuth + token-refresh pipeline is wired (the insight normalization is stubbed with a
  clear `// NOTE` in `src/lib/connectors/instagram.ts`). Posts/hashtags/best-times use mock.
- **To go fully live:** implement the OAuth callback (`/api/auth/instagram/callback`),
  persist the token, refresh it, and normalize the paginated insight arrays into
  `DailyMetric[]` (mirror the pure-function pattern used by Bluesky).

---

## TikTok (NOT live — Research API or Display API)

TikTok has **no open API** like Bluesky. Two official paths:

### Option A — TikTok Research API (recommended for analytics)
- **Use:** aggregate/authorized research on public content. Best fit for Pulso's
  benchmarking and trend analysis.
- **Required:** approved **Research API** access (application + review by TikTok),
  `CLIENT_KEY` + `CLIENT_SECRET`, OAuth 2.0 authorization code flow.
- **Endpoints:** `/research/video/query/` (filtered by hashtag/region/date),
  `/research/video/comment/list/`, `/research/ad/...`.
- **Data shape:** video id, create_time, view_count, like_count, comment_count,
  share_count, hashtags, author. Map to `Post` + `DailyMetric` (views = reach proxy).
- **Constraint:** 30-day data latency and strict rate limits; not for personal-account
  dashboards. Build a `TikTokResearchConnector` implementing `SocialConnector`.

### Option B — TikTok Display API (personal/business accounts)
- **Use:** a user's own videos/comments. Requires **Display API** access (app review).
- **Endpoints:** `/video/list/`, `/video/query/`, `/user/info/`.
- **Constraint:** only the authenticated user's own content; still needs app review.

### What's missing today
- No `TikTokConnector` class yet. Add `src/lib/connectors/tiktok.ts` implementing
  `SocialConnector`, register it in `src/lib/connectors/index.ts`, and add env vars to
  `.env.example`. Keep all transformation in a `tiktok-logic.mjs` pure module (testable).

---

## X / LinkedIn / YouTube / Pinterest / Threads / Facebook

- Not implemented as live connectors yet. They fall back to `MockConnector`.
- X (v2) and LinkedIn require paid/approved API tiers. YouTube uses the Data API
  (free tier, OAuth). Pinterest has a Catalog/Analytics API. Threads has a limited
  Graph API. Each follows the same `SocialConnector` contract.

---

## Connector contract

```ts
interface SocialConnector {
  readonly platform: Platform;
  isConfigured(): boolean;                       // true when real creds present
  getAccount(handle?): Promise<SocialAccount>;
  getPosts(accountId, limit?): Promise<Post[]>;
  getDailyMetrics(accountId, days?): Promise<DailyMetric[]>;
  getBestTimes(accountId): Promise<BestTimeCell[]>;
  getHashtags(accountId): Promise<HashtagStat[]>;
}
```

**Rule of thumb (Staff Engineer):** keep I/O in the connector, keep transformation in a
pure, dependency-free `*-logic.mjs` module, and always fall back to mock so the UI never
breaks. Real data is opt-in via environment variables — never required to run.
