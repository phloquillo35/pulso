import { createClient } from "@/lib/supabase/server";

/** True when Supabase env vars are present (production backend active). */
export function isSupabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Resolve the current Supabase user from the request session.
 * Returns null when Supabase is not configured or there is no session,
 * so callers can safely fall back to demo mode.
 */
export async function getServerUser(): Promise<{ id: string; email: string } | null> {
  if (!isSupabaseEnabled()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? "" };
  } catch {
    return null;
  }
}
