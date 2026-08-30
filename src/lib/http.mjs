// Pulso · HTTP helper (framework-free, unit-tested in mcp/run-tests.mjs).
// Shared by the AI services and the social connectors so a hung upstream can
// never block a request indefinitely. Kept dependency-free (.mjs) so it runs
// under both the Node test runner and the Next/TS build.

/**
 * fetch with a hard timeout. Aborts the request if it does not settle within
 * `ms` milliseconds. If the caller already supplies `init.signal` we honor it
 * (we never override an explicit abort); otherwise we apply AbortSignal.timeout.
 *
 * On timeout the underlying fetch rejects with an AbortError, which the callers
 * catch and turn into their mock/fallback path — so the demo stays populated.
 *
 * @param {string} input
 * @param {RequestInit} [init]
 * @param {number} [ms] timeout in milliseconds (default 8000)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(input, init = {}, ms = 8000) {
  const signal = init.signal ?? AbortSignal.timeout(ms);
  return fetch(input, { ...init, signal });
}
