// Dependency-free test runner for Pulso analytics (run: `node mcp/run-tests.mjs`).
import assert from "node:assert/strict";
import {
  analyze,
  computeAudit,
  computeBestTimes,
  toolResult,
  PLATFORMS,
  COMPETITORS,
  handle,
} from "./server.mjs";
import {
  parseFacetsToHashtags,
  mapFeedToPosts,
  computeDailyMetricsFromPosts,
  computeHashtagStats as computeHashtagStatsBsky,
} from "../src/lib/connectors/bluesky-logic.mjs";
import {
  resolveInstagramToken,
  isInstagramConfigured,
  parseInstagramInsights,
  fetchInstagramDailyMetrics,
} from "../src/lib/connectors/instagram-logic.mjs";
import { resolveAnthropicModel } from "../src/lib/ai/anthropic-logic.mjs";
import { parseChatRequest, DEFAULT_CHAT_PLATFORM } from "../src/lib/ai/chat-request.mjs";
import { fetchWithTimeout } from "../src/lib/http.mjs";
import { asPlatform } from "../src/lib/data/platform.mjs";

let pass = 0;
let fail = 0;
const checks = [];
function check(name, fn) {
  checks.push(
    (async () => {
      try {
        await fn();
        pass++;
        console.log(`  ✔ ${name}`);
      } catch (e) {
        fail++;
        console.error(`  ✖ ${name}\n    ${e && e.message ? e.message : e}`);
      }
    })(),
  );
}

console.log("Pulso analytics tests");

check("analyze: audit 0-100 con grado para toda plataforma", () => {
  for (const p of PLATFORMS) {
    const a = analyze(p);
    assert.ok(a.audit.overall >= 0 && a.audit.overall <= 100, `${p} overall fuera de rango`);
    assert.match(a.audit.grade, /^[A-E]$/);
    assert.ok(a.audit.recommendations.length >= 1);
  }
});

check("bestTimes: 168 celdas con score en [0,1]", () => {
  const a = analyze("instagram");
  assert.equal(a.bestTimes.length, 168);
  for (const c of a.bestTimes) {
    assert.ok(c.score >= 0 && c.score <= 1, "score fuera de [0,1]");
    assert.ok(c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24);
  }
});

check("hashtags: ordenados por engagement desc", () => {
  const hs = analyze("tiktok").hashtags;
  assert.ok(hs.length >= 1);
  for (let i = 1; i < hs.length; i++) {
    assert.ok(hs[i - 1].avgEngagement >= hs[i].avgEngagement, "no ordenado");
  }
});

check("competitors: registro por plataforma", () => {
  assert.equal(COMPETITORS.instagram.length, 2);
  assert.ok(COMPETITORS.tiktok[0].followers > 0);
});

check("toolResult: shape esperado", () => {
  const r = toolResult("instagram");
  assert.ok(Array.isArray(r.bestTimeTop) && Array.isArray(r.hashtags) && Array.isArray(r.competitors));
  assert.equal(typeof r.audit.overall, "number");
});

check("computeAudit: determinista", () => {
  const acc = { followers: 1000, avgEngagement: 0.05, postingFrequency: 10, growth30d: 5, baseHour: 19, peakDays: [2] };
  const posts = analyze("instagram").posts;
  assert.equal(computeAudit(posts, acc).overall, computeAudit(posts, acc).overall);
});

check("computeBestTimes: normaliza maximo a 1", () => {
  const cells = computeBestTimes(analyze("instagram").posts);
  assert.ok(Math.max(...cells.map((c) => c.score)) <= 1.0001);
});

// ─── Bluesky pure logic (AT Protocol) ─────────────────────────────────────
// Use a date inside the 90-day window so computeDailyMetricsFromPosts includes it.
const RECENT = new Date(Date.now() - 3 * 86400000);
const RECENT_ISO = RECENT.toISOString();
const RECENT_DATE = RECENT_ISO.slice(0, 10);

const SAMPLE_FEED = [
  {
    post: {
      uri: "at://did:plc:abc/app.bsky.feed.post/aaabbb",
      likeCount: 10,
      replyCount: 2,
      repostCount: 3,
      quoteCount: 1,
      indexedAt: RECENT_ISO,
      author: { handle: "lucia.bsky.social" },
      record: {
        text: "Hola #diseno y #marcaPersonal",
        createdAt: RECENT_ISO,
        facets: [{ features: [{ $type: "app.bsky.richtext.facet#tag", tag: "diseno" }] }],
        embed: { $type: "app.bsky.embed.images", images: [{}] },
      },
    },
  },
];

check("bluesky: parseFacetsToHashtags une facets + texto y lowercases", () => {
  const tags = parseFacetsToHashtags(SAMPLE_FEED[0].post.record.facets, "#Diseno y #marcaPersonal");
  assert.deepEqual(tags.sort(), ["diseno", "marcapersonal"]);
});

check("bluesky: mapFeedToPosts mapea post real", () => {
  const posts = mapFeedToPosts(SAMPLE_FEED, {
    accountId: "acc_bsky",
    platform: "bluesky",
    followers: 5000,
    handle: "lucia.bsky.social",
  });
  assert.equal(posts.length, 1);
  const p = posts[0];
  assert.equal(p.caption, "Hola #diseno y #marcaPersonal");
  assert.equal(p.mediaType, "image");
  assert.deepEqual(p.hashtags.sort(), ["diseno", "marcapersonal"]);
  assert.equal(p.metrics.likes, 10);
  assert.equal(p.metrics.comments, 2);
  assert.equal(p.metrics.shares, 3);
  assert.equal(p.metrics.saves, 1);
  assert.ok(Math.abs(p.metrics.engagementRate - 16 / 5000) < 1e-9);
  assert.equal(p.url, "https://bsky.app/profile/lucia.bsky.social/post/aaabbb");
});

check("bluesky: computeDailyMetricsFromPosts agrega engagement y fija followers", () => {
  const posts = mapFeedToPosts(SAMPLE_FEED, {
    accountId: "acc_bsky",
    platform: "bluesky",
    followers: 5000,
    handle: "lucia.bsky.social",
  });
  const daily = computeDailyMetricsFromPosts(posts, { days: 90, followers: 5000 });
  assert.equal(daily.length, 90);
  const day = daily.find((d) => d.date === RECENT_DATE);
  assert.ok(day, "día del post presente");
  assert.equal(day.engagement, 16);
  assert.equal(day.followers, 5000);
  assert.equal(day.reach, 0);
  // días sin posts → engagement 0
  const empty = daily.find((d) => d.date !== RECENT_DATE);
  assert.equal(empty.engagement, 0);
});

check("bluesky: computeHashtagStats ordena por engagement desc", () => {
  const posts = [
    { hashtags: ["a", "b"], metrics: { engagementRate: 0.05, likes: 10, reach: 100 } },
    { hashtags: ["a"], metrics: { engagementRate: 0.02, likes: 4, reach: 50 } },
    { hashtags: ["b"], metrics: { engagementRate: 0.09, likes: 9, reach: 80 } },
  ];
  const stats = computeHashtagStatsBsky(posts);
  assert.equal(stats[0].tag, "b");
  assert.equal(stats.find((s) => s.tag === "a").uses, 2);
  assert.ok(stats[0].avgEngagement >= stats[1].avgEngagement);
});

// ─── Instagram connector logic (B1) ───────────────────────────────────────
check("instagram: isInstagramConfigured false sin token", () => {
  assert.equal(isInstagramConfigured({}), false);
  assert.equal(isInstagramConfigured({ IG_APP_ID: "x", IG_APP_SECRET: "y" }), false);
});

check("instagram: isInstagramConfigured true con IG_USER_TOKEN", () => {
  assert.equal(isInstagramConfigured({ IG_USER_TOKEN: "tok_123" }), true);
  // whitespace-only token is treated as unset
  assert.equal(isInstagramConfigured({ IG_USER_TOKEN: "   " }), false);
});

check("instagram: resolveInstagramToken trimea", () => {
  assert.equal(resolveInstagramToken({ IG_USER_TOKEN: "  tok  " }), "tok");
  assert.equal(resolveInstagramToken({}), "");
});

// ─── Instagram daily metrics live parse (S2-1) ────────────────────────────
const INSIGHTS_PAYLOAD = {
  data: [
    {
      name: "reach",
      period: "day",
      values: [
        { value: 100, end_time: "2024-01-01T08:00:00+0000" },
        { value: 150, end_time: "2024-01-02T08:00:00+0000" },
      ],
    },
    {
      name: "impressions",
      period: "day",
      values: [
        { value: 200, end_time: "2024-01-01T08:00:00+0000" },
        { value: 300, end_time: "2024-01-02T08:00:00+0000" },
      ],
    },
    {
      name: "engagement",
      period: "day",
      values: [
        { value: 10, end_time: "2024-01-01T08:00:00+0000" },
        { value: 20, end_time: "2024-01-02T08:00:00+0000" },
      ],
    },
  ],
};

check("instagram: parseInstagramInsights mergea reach/impressions/engagement por fecha", () => {
  const daily = parseInstagramInsights(INSIGHTS_PAYLOAD);
  assert.equal(daily.length, 2);
  assert.equal(daily[0].date, "2024-01-01");
  assert.equal(daily[0].reach, 100);
  assert.equal(daily[0].impressions, 200);
  assert.equal(daily[0].engagement, 10);
  // followers/newFollowers/unfollows no vienen en insights básicos → 0
  assert.equal(daily[0].followers, 0);
  assert.equal(daily[0].newFollowers, 0);
  assert.equal(daily[0].unfollows, 0);
  assert.equal(daily[1].date, "2024-01-02");
  assert.equal(daily[1].reach, 150);
  assert.equal(daily[1].impressions, 300);
  assert.equal(daily[1].engagement, 20);
});

check("instagram: parseInstagramInsights ordena por fecha asc", () => {
  const daily = parseInstagramInsights(INSIGHTS_PAYLOAD);
  assert.ok(daily[0].date < daily[1].date);
});

check("instagram: parseInstagramInsights lanza con payload malformado (→ fallback mock)", () => {
  assert.throws(() => parseInstagramInsights(null));
  assert.throws(() => parseInstagramInsights({}));
  assert.throws(() => parseInstagramInsights({ data: [] }));
  assert.throws(() => parseInstagramInsights({ data: [{ name: "reach", values: [] }] }));
});

check("instagram: fetchInstagramDailyMetrics devuelve DailyMetric[] con fetch OK", async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => INSIGHTS_PAYLOAD });
  const res = await fetchInstagramDailyMetrics(fakeFetch, "tok_123", 90);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 2);
  assert.equal(res[0].reach, 100);
  assert.equal(res[1].engagement, 20);
});

check("instagram: fetchInstagramDailyMetrics → null (fallback) si fetch lanza", async () => {
  const fakeFetch = async () => {
    throw new Error("network");
  };
  const res = await fetchInstagramDailyMetrics(fakeFetch, "tok_123", 90);
  assert.equal(res, null);
});

check("instagram: fetchInstagramDailyMetrics → null (fallback) si respuesta no ok", async () => {
  const fakeFetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const res = await fetchInstagramDailyMetrics(fakeFetch, "tok_123", 90);
  assert.equal(res, null);
});

check("instagram: fetchInstagramDailyMetrics → null (fallback) sin token", async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => INSIGHTS_PAYLOAD });
  const res = await fetchInstagramDailyMetrics(fakeFetch, "", 90);
  assert.equal(res, null);
});

// ─── Anthropic model resolution (B2) ─────────────────────────────────────
check("anthropic: modelo default cuando no hay env", () => {
  assert.equal(resolveAnthropicModel({}), "claude-sonnet-4-6");
});

check("anthropic: modelo desde PULSO_ANTHROPIC_MODEL", () => {
  assert.equal(resolveAnthropicModel({ PULSO_ANTHROPIC_MODEL: "claude-3-5-sonnet" }), "claude-3-5-sonnet");
});

check("anthropic: fallback a default si el modelo es inválido", () => {
  assert.equal(resolveAnthropicModel({ PULSO_ANTHROPIC_MODEL: "   " }), "claude-sonnet-4-6");
  assert.equal(resolveAnthropicModel({ PULSO_ANTHROPIC_MODEL: "not a model!!" }), "claude-sonnet-4-6");
});

// ─── MCP protocol (B4) ───────────────────────────────────────────────────
function callHandle(msg) {
  const out = [];
  handle(msg, (m) => out.push(m));
  return out;
}

check("mcp: initialize responde protocolVersion + capabilities", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 1, method: "initialize" });
  assert.equal(out.length, 1);
  assert.equal(out[0].jsonrpc, "2.0");
  assert.equal(out[0].id, 1);
  assert.equal(out[0].result.protocolVersion, "2024-11-05");
  assert.ok(out[0].result.capabilities.tools);
  assert.equal(out[0].result.serverInfo.name, "pulso");
});

check("mcp: ping responde {} ", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 2, method: "ping" });
  assert.deepEqual(out[0].result, {});
});

check("mcp: tools/list expone los 5 tools", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 3, method: "tools/list" });
  const tools = out[0].result.tools;
  assert.equal(tools.length, 5);
  const names = tools.map((t) => t.name);
  for (const n of ["pulso_audit", "pulso_best_time", "pulso_hashtags", "pulso_competitors", "pulso_analyze"]) {
    assert.ok(names.includes(n), `falta tool ${n}`);
  }
  // el enum de platform debe coincidir con la app (sin twitch, con pinterest)
  assert.ok(!PLATFORMS.includes("twitch"), "twitch no debe estar");
  assert.ok(PLATFORMS.includes("pinterest"), "pinterest debe estar");
});

check("mcp: tools/call pulso_audit devuelve audit", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "pulso_audit", arguments: { platform: "instagram" } } });
  const content = JSON.parse(out[0].result.content[0].text);
  assert.ok(content.audit.overall >= 0 && content.audit.overall <= 100);
});

check("mcp: tools/call con platform inválido → error -32602", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "pulso_audit", arguments: { platform: "twitch" } } });
  assert.equal(out[0].error.code, -32602);
});

check("mcp: tools/call con tool desconocido → error -32601", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "no_existe", arguments: { platform: "instagram" } } });
  assert.equal(out[0].error.code, -32601);
});

check("mcp: método desconocido → error -32601", () => {
  const out = callHandle({ jsonrpc: "2.0", id: 7, method: "frobnicate" });
  assert.equal(out[0].error.code, -32601);
});

// --- Chat request parser (POST /api/ai/chat) ---
check("chat: acepta {platform, question} legacy", () => {
  const r = parseChatRequest({ platform: "instagram", question: "hola" }, PLATFORMS);
  assert.equal(r.ok, true);
  assert.equal(r.platform, "instagram");
  assert.equal(r.question, "hola");
});

check("chat: acepta {message} como alias de question", () => {
  const r = parseChatRequest({ message: "  ¿cuándo posteo?  " }, PLATFORMS);
  assert.equal(r.ok, true);
  assert.equal(r.platform, DEFAULT_CHAT_PLATFORM);
  assert.equal(r.question, "¿cuándo posteo?");
});

check("chat: platform omitido default instagram", () => {
  const r = parseChatRequest({ question: "tip" }, PLATFORMS);
  assert.equal(r.ok, true);
  assert.equal(r.platform, "instagram");
});

check("chat: question vacío → error", () => {
  const r = parseChatRequest({ question: "   " }, PLATFORMS);
  assert.equal(r.ok, false);
  assert.match(r.error, /question|message/);
});

check("chat: sin question ni message → error", () => {
  const r = parseChatRequest({ platform: "instagram" }, PLATFORMS);
  assert.equal(r.ok, false);
});

check("chat: platform inválido → error", () => {
  const r = parseChatRequest({ platform: "twitch", question: "hola" }, PLATFORMS);
  assert.equal(r.ok, false);
  assert.match(r.error, /Platform/);
});

check("chat: body no-objeto (null/string) → error", () => {
  assert.equal(parseChatRequest(null, PLATFORMS).ok, false);
  assert.equal(parseChatRequest("hola", PLATFORMS).ok, false);
});

// ─── HTTP timeout helper (S3-2) ───────────────────────────────────────────
// A controllable fake `fetch` so no real network I/O happens (a real fetch
// would hang on DNS / abort timing and leave the top-level await unsettled).
function makeFakeFetch(behavior) {
  return async (_input, init) => behavior(init?.signal);
}

function abortError() {
  const e = new Error("The operation was aborted");
  e.name = "AbortError";
  return e;
}

check("http: fetchWithTimeout propaga el rechazo del fetch", async () => {
  const orig = global.fetch;
  global.fetch = makeFakeFetch(() => Promise.reject(abortError()));
  try {
    await assert.rejects(
      () => fetchWithTimeout("http://pulso.test/x", {}, 10),
      (e) => e.name === "TimeoutError" || e.name === "AbortError",
    );
  } finally {
    global.fetch = orig;
  }
});

check("http: fetchWithTimeout respeta signal existente", async () => {
  const orig = global.fetch;
  let seenSignal = null;
  global.fetch = makeFakeFetch((sig) => {
    seenSignal = sig ?? null;
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  try {
    const ac = new AbortController();
    await fetchWithTimeout("http://pulso.test/y", { signal: ac.signal }, 5000);
    assert.equal(seenSignal, ac.signal);
  } finally {
    global.fetch = orig;
  }
});

check("instagram: fetchWithTimeout hace fallback a null en abort (S3-2)", async () => {
  const orig = global.fetch;
  global.fetch = makeFakeFetch(() => Promise.reject(abortError()));
  try {
    const res = await fetchInstagramDailyMetrics(fetchWithTimeout, "tok_123", 90);
    assert.equal(res, null);
  } finally {
    global.fetch = orig;
  }
});

// ─── asPlatform explicit (S3-7) ───────────────────────────────────────────
check("platform: asPlatform lanza con valor inválido (no enmascara)", () => {
  assert.throws(() => asPlatform("plataforma_inexistente"));
  assert.throws(() => asPlatform("twitch"));
  assert.equal(asPlatform("instagram"), "instagram");
  assert.equal(asPlatform("bluesky"), "bluesky");
});

// ─── MCP hardening (S3-8) ─────────────────────────────────────────────────
check("mcp: notificaciones no reciben respuesta", () => {
  assert.equal(callHandle({ jsonrpc: "2.0", method: "notifications/initialized" }).length, 0);
  assert.equal(callHandle({ jsonrpc: "2.0", method: "notifications/foo" }).length, 0);
  // un request con id (ping) SÍ debe responder
  assert.equal(callHandle({ jsonrpc: "2.0", id: 99, method: "ping" }).length, 1);
});

check("mcp: grado siempre A-D (sin E)", () => {
  for (const p of PLATFORMS) {
    assert.match(analyze(p).audit.grade, /^[A-D]$/);
  }
});

await Promise.all(checks);
console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail ? 1 : 0);
