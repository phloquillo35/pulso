import { NextResponse } from "next/server";
import { getProvider } from "@/lib/data/provider";
import { getAIService, type AnalysisContext } from "@/lib/ai";
import { PLATFORMS, type Platform } from "@/lib/types";
import { bestTimeSummary } from "@/lib/utils";

export async function POST(req: Request) {
  let body: { platform?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { platform, question } = body;
  if (!platform || !question || !PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json({ error: "Faltan platform o question" }, { status: 400 });
  }

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
