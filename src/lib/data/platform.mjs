// Pulso · platform coercion (framework-free, unit-tested in mcp/run-tests.mjs).
// Pure helper so the Supabase row mappers never silently coerce a corrupt
// platform value into a valid one (the old behavior masked bad data as
// "bluesky"). Kept dependency-free (.mjs) so it runs under the Node test runner
// and the Next/TS build alike.
//
// NOTE: PLATFORMS here MUST stay in sync with PLATFORMS in src/lib/types.ts.

const PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
];

/**
 * Coerce a raw DB/platform string into a typed Platform id.
 * Throws on any value not in the known platform set — callers must FILTER
 * invalid rows BEFORE mapping (omit the row), never mask them as "bluesky".
 *
 * @param {string} value
 * @param {string[]} [platforms]
 * @returns {"instagram"|"facebook"|"tiktok"|"x"|"linkedin"|"youtube"|"pinterest"|"threads"|"bluesky"}
 */
export function asPlatform(value, platforms = PLATFORMS) {
  if (typeof value === "string" && platforms.includes(value)) return value;
  throw new Error(
    `asPlatform: plataforma inválida en la base de datos: ${JSON.stringify(value)}`,
  );
}

export { PLATFORMS as PLATFORM_IDS };
