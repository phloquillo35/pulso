import type { AIService, AnalysisContext } from "@/lib/ai/types";

// Deterministic, offline AI. Used when no provider key is present so the
// product is fully functional out of the box.
export class MockAIService implements AIService {
  readonly provider = "mock" as const;
  isConfigured() {
    return false;
  }

  async executiveSummary(ctx: AnalysisContext): Promise<string> {
    const a = ctx.audit;
    const weakest = Object.entries(a.breakdown).sort((x, y) => x[1] - y[1])[0];
    return (
      `${ctx.account.displayName} tiene un score de salud de ${a.overall}/100 (grado ${a.grade}). ` +
      `Tu dimensión más floja es "${weakest[0]}" (${weakest[1]}/100). ` +
      `El engagement promedio de tus últimos posts y tus mejores horarios (${ctx.bestTimeSummary}) ` +
      `son tu mayor oportunidad de mejora inmediata.`
    );
  }

  async weeklyPlan(ctx: AnalysisContext): Promise<string> {
    const recs = ctx.audit.recommendations;
    const lines = recs.length
      ? recs.map((r, i) => `${i + 1}. ${r}`).join("\n")
      : "1. Mantené tu frecuencia actual y escalá con colaboraciones.";
    return `Plan sugerido para la próxima semana:\n${lines}`;
  }

  async chat(question: string, ctx: AnalysisContext): Promise<string> {
    const q = question.toLowerCase();
    if (q.includes("horario") || q.includes("cuándo"))
      return `Según tus datos, tus mejores horarios son: ${ctx.bestTimeSummary}.`;
    if (q.includes("hashtag"))
      return `Tus hashtags con mejor engagement: ${ctx.topHashtags.slice(0, 3).map((h) => `#${h.tag}`).join(", ")}.`;
    if (q.includes("competidor"))
      return ctx.competitors?.length
        ? `Comparás con: ${ctx.competitors.map((c) => c.handle).join(", ")}.`
        : "Aún no tenés competidores cargados para comparar.";
    return (
      `Soy el asistente de Pulso (modo demo). Con una clave de IA real puedo darte ` +
      `análisis profundos. Por ahora: tu score es ${ctx.audit.overall}/100. ` +
      `Preguntame sobre horarios, hashtags o competidores.`
    );
  }
}
