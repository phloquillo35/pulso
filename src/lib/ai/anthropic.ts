import type { AIService, AnalysisContext } from "@/lib/ai/types";
import { buildContextPrompt } from "@/lib/ai/types";
import { MockAIService } from "@/lib/ai/mock";
import { resolveAnthropicModel } from "@/lib/ai/anthropic-logic.mjs";
import { fetchWithTimeout } from "@/lib/http.mjs";

const MODEL = resolveAnthropicModel();

export class AnthropicService implements AIService {
  readonly provider = "anthropic" as const;
  private mock = new MockAIService();
  private key = process.env.ANTHROPIC_API_KEY;

  isConfigured() {
    return Boolean(this.key);
  }

  private async complete(system: string, user: string): Promise<string> {
    const key = this.key;
    if (!key) return "";
    try {
      const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-07-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 700,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}`);
      const d = await res.json();
      return d.content?.[0]?.text ?? "";
    } catch {
      return "";
    }
  }

  async executiveSummary(ctx: AnalysisContext) {
    const r = await this.complete(
      "Sos un analista de redes sociales para creadores y negocios. Respondé en español, conciso y accionable.",
      `Dame un resumen ejecutivo de 2-3 oraciones de esta cuenta:\n${buildContextPrompt(ctx)}`,
    );
    return r || this.mock.executiveSummary(ctx);
  }

  async weeklyPlan(ctx: AnalysisContext) {
    const r = await this.complete(
      "Sos un estratega de contenido. Respondé en español con viñetas accionables.",
      `Armá un plan semanal de 3-5 acciones priorizadas para esta cuenta:\n${buildContextPrompt(ctx)}`,
    );
    return r || this.mock.weeklyPlan(ctx);
  }

  async chat(question: string, ctx: AnalysisContext) {
    const r = await this.complete(
      "Sos el asistente de Pulso. Respondé en español, en base a los datos de la cuenta. Si no podés responder con los datos, decidlo.",
      `Pregunta: ${question}\n\nDatos de la cuenta:\n${buildContextPrompt(ctx)}`,
    );
    return r || this.mock.chat(question, ctx);
  }
}
