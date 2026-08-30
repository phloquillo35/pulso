// Pulso · Instagram connector logic (framework-free, unit-tested in mcp/run-tests.mjs).
// Keeps the "is this connector configured?" decision out of the TS class so it can
// be exercised by the dependency-free Node test runner.
//
// Live Instagram uses a long-lived Meta Graph API token (IG_USER_TOKEN). The OAuth
// vars (IG_APP_ID/IG_APP_SECRET/IG_REDIRECT_URI) are reserved for the future
// callback-based token exchange; they alone do NOT enable the live path without a token.

/** Returns the trimmed long-lived token, or "" when unset. */
export function resolveInstagramToken(env = process.env) {
  return env.IG_USER_TOKEN?.trim() || "";
}

/** True when a usable token is present → the connector may call the Graph API. */
export function isInstagramConfigured(env = process.env) {
  return Boolean(resolveInstagramToken(env));
}

/**
 * Parse Instagram Graph API `/me/insights` (metrics reach, impressions,
 * engagement, period=day) into DailyMetric[].
 *
 * The API returns one entry per metric, each with a `values` array of
 * `{ value, end_time }`. We merge the three series by the calendar date of
 * `end_time`. Basic insights do NOT include follower counts, so followers /
 * newFollowers / unfollows are left at 0 (the dashboard falls back to the
 * account follower count from getAccount when needed).
 *
 * Throws on any malformed input so the caller can fall back to the mock.
 *
 * @param {unknown} payload Parsed JSON body of the insights response.
 * @returns {{date:string,followers:number,engagement:number,reach:number,impressions:number,newFollowers:number,unfollows:number}[]}
 */
export function parseInstagramInsights(payload) {
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("IG insights: respuesta sin data[]");
  }
  /** @type {Map<string,{date:string,reach:number,impressions:number,engagement:number}>} */
  const byDate = new Map();
  for (const metric of payload.data) {
    const name = metric && metric.name;
    if (!name || !Array.isArray(metric.values)) continue;
    for (const point of metric.values) {
      if (!point || typeof point.value !== "number" || !point.end_time) continue;
      const date = String(point.end_time).slice(0, 10);
      if (!date) continue;
      let row = byDate.get(date);
      if (!row) {
        row = { date, reach: 0, impressions: 0, engagement: 0 };
        byDate.set(date, row);
      }
      if (name === "reach") row.reach = point.value;
      else if (name === "impressions") row.impressions = point.value;
      else if (name === "engagement") row.engagement = point.value;
    }
  }
  if (byDate.size === 0) {
    throw new Error("IG insights: sin puntos válidos");
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      followers: 0,
      engagement: r.engagement,
      reach: r.reach,
      impressions: r.impressions,
      newFollowers: 0,
      unfollows: 0,
    }));
}

/**
 * Live fetch + parse of daily metrics. Pure & injectable so it can be unit
 * tested without the TS class or network. Returns DailyMetric[] on success or
 * `null` when the live path is unavailable (no token / network error / parse
 * failure) — the caller should fall back to the mock connector.
 *
 * @param {(input: string, init?: any) => Promise<any>} fetchImpl Injected fetch (global in Next, mock in tests).
 * @param {string} token Long-lived IG_USER_TOKEN.
 * @param {number} [days]
 * @returns {Promise<ReturnType<typeof parseInstagramInsights> | null>}
 */
export async function fetchInstagramDailyMetrics(fetchImpl, token, days = 90) {
  if (!token) return null;
  try {
    const since = Math.floor((Date.now() - days * 86400000) / 1000);
    // Token is sent ONLY via the Authorization: Bearer header (see headers
    // below) — never in the query string, to avoid leaking it in server logs.
    const url =
      "https://graph.instagram.com/me/insights" +
      `?metric=reach,impressions,engagement&period=day&since=${since}`;
    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`IG insights ${res.status}`);
    const json = await res.json();
    const parsed = parseInstagramInsights(json);
    return parsed;
  } catch {
    return null;
  }
}
