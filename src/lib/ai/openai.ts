import type { AIService, AnalysisContext } from "@/lib/ai/types";
import { buildContextPrompt } from "@/lib/ai/types";
import { MockAIService } from "@/lib/ai/mock";

const MODEL = process.env.PULSO_OPENAI_MODEL || "gpt-4o";

export class OpenAIService implements AIService {
  readonly provider = "openai" as const;
  private mock = new MockAIService();
  private key = process.env.OPENAI_API_KEY;

  isConfigured() {
    return Boolean(this.key);
  }

  private async complete(system: string, user: string): Promise<string> {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${this.key!}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 700,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`openai ${res.status}`);
      const d = await res.json();
      return d.choices?.[0]?.message?.content ?? "";
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
      "Sos el asistente de Pulso. Respondé en español, en base a los datos de la cuenta.",
      `Pregunta: ${question}\n\nDatos de la cuenta:\n${buildContextPrompt(ctx)}`,
    );
    return r || this.mock.chat(question, ctx);
  }
}
