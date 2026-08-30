import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/auth";

// PKCE / email-confirmation callback. Only reached in production with Supabase
// configured. In demo (no env) it short-circuits to /login without crashing.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Prevent open-redirect: only allow a local path (starts with "/" but not "//"
  // and without a scheme like "https://"). Anything else falls back to /dashboard.
  const isLocalRedirect =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("://");
  const safeNext = isLocalRedirect ? next : "/dashboard";

  if (!isSupabaseEnabled() || !code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_unavailable`,
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }
}
