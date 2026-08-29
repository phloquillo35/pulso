export * from "./types";
import type { AIService } from "@/lib/ai/types";
import { AnthropicService } from "@/lib/ai/anthropic";
import { OpenAIService } from "@/lib/ai/openai";
import { MockAIService } from "@/lib/ai/mock";

// Picks the active provider by env, with graceful fallback to mock.
// Priority: explicit PULSO_AI_PROVIDER -> available key -> mock.
export function getAIService(): AIService {
  const preferred = process.env.PULSO_AI_PROVIDER;
  if (preferred === "openai" && process.env.OPENAI_API_KEY) return new OpenAIService();
  if (preferred === "anthropic" && process.env.ANTHROPIC_API_KEY) return new AnthropicService();
  if (process.env.ANTHROPIC_API_KEY) return new AnthropicService();
  if (process.env.OPENAI_API_KEY) return new OpenAIService();
  return new MockAIService();
}
