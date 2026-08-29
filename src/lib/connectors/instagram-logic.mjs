// Pulso · Instagram connector logic (framework-free, unit-tested in mcp/run-tests.mjs).
// Keeps the "is this connector configured?" decision out of the TS class so it can
// be exercised by the dependency-free Node test runner.
//
// Live Instagram uses a long-lived Meta Graph API token (IG_USER_TOKEN). The OAuth
// vars (IG_APP_ID/IG_APP_SECRET/IG_REDIRECT_URI) are reserved for the future
// callback-based token exchange; they alone do NOT enable the live path without a token.

/** Returns the trimmed long-lived token, or "" when unset. */
export function resolveInstagramToken(env = process.env) {
  return env.IG_USER_TOKEN?.trim() || "";
}

/** True when a usable token is present → the connector may call the Graph API. */
export function isInstagramConfigured(env = process.env) {
  return Boolean(resolveInstagramToken(env));
}
