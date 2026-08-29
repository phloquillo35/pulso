// Pulso MCP server — exposes social analytics as tools for AI agents.
// Dependency-free stdio JSON-RPC (MCP draft). Run: `node mcp/server.mjs`
// Mirrors the analytics in src/lib (mock provider) so it runs with zero build step.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PLATFORMS = ["instagram", "tiktok", "youtube", "x", "linkedin", "bluesky", "facebook", "threads", "twitch"];
const PLATFORM_LABEL = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X",
  linkedin: "LinkedIn", bluesky: "Bluesky", facebook: "Facebook", threads: "Threads", twitch: "Twitch",
};

const DEMO_ACCOUNTS = {
  instagram: { handle: "@marca", displayName: "Marca Demo", followers: 142300, avgEngagement: 0.059, postingFrequency: 12, growth30d: 9.4, baseHour: 19, peakDays: [2, 3, 5] },
  tiktok: { handle: "@marca", displayName: "Marca Demo", followers: 318900, avgEngagement: 0.082, postingFrequency: 18, growth30d: 14.1, baseHour: 20, peakDays: [1, 3, 6] },
  youtube: { handle: "@MarcaDemo", displayName: "Marca Demo", followers: 96400, avgEngagement: 0.041, postingFrequency: 6, growth30d: 5.2, baseHour: 17, peakDays: [2, 4, 6] },
  x: { handle: "@marca", displayName: "Marca Demo", followers: 58700, avgEngagement: 0.022, postingFrequency: 30, growth30d: 3.1, baseHour: 12, peakDays: [0, 2, 4] },
  linkedin: { handle: "marca", displayName: "Marca Demo", followers: 41200, avgEngagement: 0.038, postingFrequency: 8, growth30d: 6.7, baseHour: 9, peakDays: [1, 2, 3] },
  bluesky: { handle: "@marca.bsky.social", displayName: "Marca Demo", followers: 12300, avgEngagement: 0.047, postingFrequency: 14, growth30d: 11.3, baseHour: 18, peakDays: [2, 4, 5] },
  facebook: { handle: "marca", displayName: "Marca Demo", followers: 73800, avgEngagement: 0.028, postingFrequency: 9, growth30d: 2.4, baseHour: 15, peakDays: [3, 5, 6] },
  threads: { handle: "@marca", displayName: "Marca Demo", followers: 28900, avgEngagement: 0.051, postingFrequency: 16, growth30d: 8.9, baseHour: 19, peakDays: [2, 3, 4] },
  twitch: { handle: "marca", displayName: "Marca Demo", followers: 19400, avgEngagement: 0.063, postingFrequency: 10, growth30d: 4.6, baseHour: 21, peakDays: [4, 5, 6] },
};

const COMPETITORS = {
  instagram: [
    { handle: "@rival_a", displayName: "Rival A", followers: 210400, avgEngagementRate: 0.061, postingFrequency: 14, growth30d: 7.2 },
    { handle: "@rival_b", displayName: "Rival B", followers: 98700, avgEngagementRate: 0.072, postingFrequency: 10, growth30d: 12.5 },
  ],
  tiktok: [
    { handle: "@rival_tk", displayName: "Rival TK", followers: 540200, avgEngagementRate: 0.091, postingFrequency: 22, growth30d: 18.3 },
  ],
  youtube: [
    { handle: "@RivalYT", displayName: "Rival YT", followers: 132000, avgEngagementRate: 0.044, postingFrequency: 5, growth30d: 4.1 },
  ],
  x: [
    { handle: "@rival_x", displayName: "Rival X", followers: 88000, avgEngagementRate: 0.019, postingFrequency: 28, growth30d: 1.8 },
  ],
  linkedin: [
    { handle: "rival-li", displayName: "Rival LI", followers: 61000, avgEngagementRate: 0.041, postingFrequency: 7, growth30d: 5.9 },
  ],
  bluesky: [
    { handle: "@rival.bsky.social", displayName: "Rival BS", followers: 21000, avgEngagementRate: 0.052, postingFrequency: 12, growth30d: 9.7 },
  ],
  facebook: [
    { handle: "rival-fb", displayName: "Rival FB", followers: 120300, avgEngagementRate: 0.024, postingFrequency: 8, growth30d: 1.9 },
  ],
  threads: [
    { handle: "@rival-th", displayName: "Rival TH", followers: 41000, avgEngagementRate: 0.055, postingFrequency: 15, growth30d: 7.4 },
  ],
  twitch: [
    { handle: "rival-tw", displayName: "Rival TW", followers: 33000, avgEngagementRate: 0.068, postingFrequency: 9, growth30d: 3.8 },
  ],
};

const HASHTAG_POOL = ["crecimiento", "marketing", "diseno", "tech", "lifestyle", "tutorial", "behindthescenes", "lanzamiento", "comunidad", "tips"];

function seededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const seedFrom = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function generatePosts(platform) {
  const acc = DEMO_ACCOUNTS[platform];
  const rng = seededRng(seedFrom(platform));
  const posts = [];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(rng() * 90);
    const hour = clamp(Math.round(acc.baseHour + (rng() - 0.5) * 6), 0, 23);
    const published = new Date(now - daysAgo * 864e5);
    published.setHours(hour, 0, 0, 0);
    const mediaType = rng() < 0.5 ? "image" : rng() < 0.6 ? "video" : "carousel";
    const reach = Math.round(acc.followers * (0.15 + rng() * 0.5));
    const engagementRate = clamp(acc.avgEngagement * (0.6 + rng() * 0.9), 0.005, 0.2);
    const likes = Math.round(reach * engagementRate);
    const comments = Math.round(likes * (0.03 + rng() * 0.06));
    const shares = Math.round(likes * (0.02 + rng() * 0.05));
    const nTags = 1 + Math.floor(rng() * 5);
    const tags = [];
    for (let k = 0; k < nTags; k++) tags.push(HASHTAG_POOL[Math.floor(rng() * HASHTAG_POOL.length)]);
    posts.push({
      id: `${platform}-${i}`, platform, mediaType,
      publishedAt: published.toISOString(),
      caption: `Post de ${PLATFORM_LABEL[platform]} #${tags[0] ?? "demo"}`,
      hashtags: tags,
      metrics: { reach, likes, comments, shares, engagementRate, saves: Math.round(likes * 0.2) },
    });
  }
  return posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function computeAudit(posts, acc) {
  const eng = posts.map((p) => p.metrics.engagementRate);
  const avgEng = eng.reduce((s, x) => s + x, 0) / (eng.length || 1);
  const growth = clamp(Math.round(acc.growth30d * 4), 30, 99);
  const engagement = clamp(Math.round((avgEng / 0.08) * 100), 20, 99);
  const consistency = clamp(Math.round((acc.postingFrequency / 20) * 100), 20, 99);
  const contentQuality = clamp(Math.round((posts.filter((p) => p.mediaType === "video").length / posts.length) * 120), 30, 99);
  const audienceHealth = clamp(Math.round((acc.followers > 50000 ? 80 : 65) + (acc.growth30d > 5 ? 10 : 0)), 30, 99);
  const overall = Math.round((growth + engagement + consistency + contentQuality + audienceHealth) / 5);
  const grade = overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "E";
  const recommendations = [
    `Publicá en tus días pico (${acc.peakDays.map((d) => ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d]).join(", ")}) cerca de las ${acc.baseHour}:00.`,
    `Subí el engagement usando más videos (hoy ${(posts.filter((p) => p.mediaType === "video").length / posts.length * 100).toFixed(0)}% del mix).`,
    `Usa entre 3 y 5 hashtags por post; los mejores de tu nicho están en el análisis de hashtags.`,
  ];
  return { overall, grade, breakdown: { growth, engagement, consistency, contentQuality, audienceHealth }, recommendations };
}

function computeBestTimes(posts) {
  const cells = [];
  for (let day = 0; day < 7; day++) for (let hour = 0; hour < 24; hour++) cells.push({ day, hour, score: 0, posts: 0 });
  const idx = (d, h) => d * 24 + h;
  for (const p of posts) {
    const dt = new Date(p.publishedAt);
    const c = cells[idx(dt.getDay(), dt.getHours())];
    c.posts++; c.score += p.metrics.engagementRate;
  }
  for (const c of cells) if (c.posts) c.score = c.score / c.posts;
  const max = Math.max(...cells.map((c) => c.score), 0.0001);
  for (const c of cells) c.score = c.score / max;
  return cells;
}

function computeHashtags(posts) {
  const map = new Map();
  for (const p of posts) for (const t of p.hashtags) {
    const e = map.get(t) ?? { tag: t, uses: 0, eng: 0, reach: 0 };
    e.uses++; e.eng += p.metrics.engagementRate; e.reach += p.metrics.reach;
    map.set(t, e);
  }
  return [...map.values()].map((e) => ({ tag: e.tag, uses: e.uses, avgEngagement: e.eng / e.uses, reach: e.reach }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function analyze(platform) {
  const acc = DEMO_ACCOUNTS[platform];
  const posts = generatePosts(platform);
  const audit = computeAudit(posts, acc);
  const bestTimes = computeBestTimes(posts);
  const hashtags = computeHashtags(posts);
  return { account: { platform, ...acc }, audit, bestTimes, hashtags, posts };
}

// ---- MCP protocol ----
const TOOLS = [
  { name: "pulso_audit", description: "Score de salud 0-100 y recomendaciones de una cuenta.", inputSchema: { type: "object", properties: { platform: { type: "string", enum: PLATFORMS } }, required: ["platform"] } },
  { name: "pulso_best_time", description: "Mejor hora para publicar (heatmap 7x24) de una cuenta.", inputSchema: { type: "object", properties: { platform: { type: "string", enum: PLATFORMS } }, required: ["platform"] } },
  { name: "pulso_hashtags", description: "Hashtags que más engagement generan en una cuenta.", inputSchema: { type: "object", properties: { platform: { type: "string", enum: PLATFORMS } }, required: ["platform"] } },
  { name: "pulso_competitors", description: "Benchmarking contra competidores del nicho.", inputSchema: { type: "object", properties: { platform: { type: "string", enum: PLATFORMS } }, required: ["platform"] } },
  { name: "pulso_analyze", description: "Análisis completo (audit + best time + hashtags) de una cuenta.", inputSchema: { type: "object", properties: { platform: { type: "string", enum: PLATFORMS } }, required: ["platform"] } },
];

function toolResult(platform) {
  const a = analyze(platform);
  return {
    audit: a.audit,
    bestTimeTop: [...a.bestTimes].sort((x, y) => y.score - x.score).slice(0, 5).map((c) => ({ day: c.day, hour: c.hour, score: +c.score.toFixed(2) })),
    hashtags: a.hashtags.slice(0, 8),
    competitors: COMPETITORS[platform] ?? [],
  };
}

let buf = "";
function send(obj) { process.stdout.write(JSON.stringify(obj) + "\n"); }

function startServer() {
  process.stdin.on("data", (d) => {
    buf += d.toString();
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      handle(msg);
    }
  });
  process.stdin.resume();
}

// Only start the stdio server when executed directly (not when imported by tests).
const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1] &&
  !process.argv.includes("--test") &&
  !process.env.NODE_TEST_CONTEXT;
if (isDirectRun) {
  startServer();
}

export { analyze, computeAudit, computeBestTimes, computeHashtags, toolResult, PLATFORMS, COMPETITORS };

function handle(msg) {
  const id = msg.id;
  if (msg.method === "initialize") {
    send({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "pulso", version: "0.1.0" } } });
  } else if (msg.method === "ping") {
    send({ jsonrpc: "2.0", id, result: {} });
  } else if (msg.method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  } else if (msg.method === "tools/call") {
    const { name, arguments: args } = msg.params || {};
    const platform = args?.platform;
    if (!PLATFORMS.includes(platform)) {
      send({ jsonrpc: "2.0", id, error: { code: -32602, message: "platform inválido" } });
      return;
    }
    let content;
    if (name === "pulso_audit") content = { audit: analyze(platform).audit };
    else if (name === "pulso_best_time") content = { bestTimeTop: toolResult(platform).bestTimeTop };
    else if (name === "pulso_hashtags") content = { hashtags: toolResult(platform).hashtags };
    else if (name === "pulso_competitors") content = { competitors: toolResult(platform).competitors };
    else if (name === "pulso_analyze") content = toolResult(platform);
    else { send({ jsonrpc: "2.0", id, error: { code: -32601, message: "tool desconocido" } }); return; }
    send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(content, null, 2) }] } });
  } else if (msg.method === "notifications/initialized") {
    // no response
  } else {
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `método desconocido: ${msg.method}` } });
  }
}

// Keep stdin open
process.stdin.resume();
