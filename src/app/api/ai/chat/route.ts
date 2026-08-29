import { NextResponse } from "next/server";
import { getProvider } from "@/lib/data/provider";
import { getAIService, type AnalysisContext } from "@/lib/ai";
import { parseChatRequest } from "@/lib/ai/chat-request.mjs";
import { PLATFORMS, type Platform } from "@/lib/types";
import { bestTimeSummary } from "@/lib/utils";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseChatRequest(body, PLATFORMS);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { platform, question } = parsed;

  const analysis = await getProvider().analyze(platform as Platform);
  const ctx: AnalysisContext = {
    account: analysis.account,
    audit: analysis.audit,
    recentPosts: analysis.posts.slice(0, 5).map((x) => ({
      caption: x.caption,
      engagementRate: x.metrics.engagementRate,
      mediaType: x.mediaType,
    })),
    topHashtags: analysis.hashtags.slice(0, 5).map((h) => ({ tag: h.tag, avgEngagement: h.avgEngagement })),
    bestTimeSummary: bestTimeSummary(analysis.bestTimes),
  };
  const answer = await getAIService().chat(question, ctx);
  return NextResponse.json({ answer });
}
