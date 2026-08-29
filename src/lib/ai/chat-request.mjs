// Pulso · Chat request parsing (framework-free, unit-tested in mcp/run-tests.mjs).
// Keeps the "accept {platform,question} OR {message}" decision out of the Next
// route handler so it can be exercised by the dependency-free Node test runner.

export const DEFAULT_CHAT_PLATFORM = "instagram";

/**
 * Parses a chat request body into a validated { platform, question } pair.
 * Accepts both shapes:
 *   - { platform?, question }   (legacy / explicit)
 *   - { message }               (alias: message → question)
 * A missing platform defaults to "instagram". A missing/empty question → error.
 * An explicit but unknown platform → error (preserves prior strictness).
 *
 * @param {unknown} body - parsed JSON body
 * @param {string[]} platforms - allowed platform ids (e.g. PLATFORMS)
 * @returns {{ok:true, platform:string, question:string} | {ok:false, error:string}}
 */
export function parseChatRequest(body, platforms) {
  const obj = body && typeof body === "object" ? body : {};
  const question = obj.question ?? obj.message;
  const platform = obj.platform ?? DEFAULT_CHAT_PLATFORM;

  if (typeof question !== "string" || question.trim() === "") {
    return { ok: false, error: "Faltan question o message" };
  }
  if (typeof platform !== "string" || !platforms.includes(platform)) {
    return { ok: false, error: "Platform inválida" };
  }
  return { ok: true, platform, question: question.trim() };
}
