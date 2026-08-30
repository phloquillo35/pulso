import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — we still redirect to clear the client state
    }
  }

  // Redirect to the real origin of the request (not a hardcoded :3000), so the
  // 303 points at the port where the server actually runs (e.g. :3939 in demo).
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
