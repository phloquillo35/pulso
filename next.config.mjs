/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Baseline security headers. CSP is intentionally permissive for the demo
    // (Next injects inline bootstrap scripts and uses Fast Refresh in dev), but
    // it still locks down framing, content-type sniffing, referrers and
    // third-party origins.
    //
    // script-src: in production we drop 'unsafe-eval' (only 'self' + inline
    // bootstrap). In development we keep 'unsafe-eval' because Next's Fast
    // Refresh runtime needs it. Tighten further (drop 'unsafe-inline' via a
    // nonce/hash strategy) once production hardening continues.
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

    // When Supabase is configured (production), allow the browser client
    // (@supabase/ssr) to call the project API and load Storage avatars.
    // In demo (no env) this stays null and the CSP is unchanged.
    let supabaseOrigin = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        supabaseOrigin = new URL(supabaseUrl).origin;
      } catch {
        supabaseOrigin = null;
      }
    }
    const connectSrc = supabaseOrigin
      ? `connect-src 'self' ${supabaseOrigin}`
      : "connect-src 'self'";
    const imgSrc = supabaseOrigin
      ? `img-src 'self' data: blob: ${supabaseOrigin}`
      : "img-src 'self' data: blob:";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              imgSrc,
              "font-src 'self' data:",
              connectSrc,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
