// Pulso · Anthropic model resolution (framework-free, unit-tested in mcp/run-tests.mjs).
// Keeps the "which model + is it valid?" decision out of the TS class so it can be
// exercised by the dependency-free Node test runner.

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

// Anthropic model IDs are lowercase alphanumeric with dots/dashes/underscores.
const MODEL_RE = /^[a-z0-9][a-z0-9._-]*$/i;

/**
 * Resolves the Anthropic model from env, falling back to a known default when
 * the value is missing or malformed. A bad model id would make the API return
 * 400 → the service falls back to mock; validating here avoids sending garbage.
 */
export function resolveAnthropicModel(env = process.env) {
  const raw = env.PULSO_ANTHROPIC_MODEL?.trim();
  if (raw && MODEL_RE.test(raw)) return raw;
  return DEFAULT_ANTHROPIC_MODEL;
}
