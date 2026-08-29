import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (url && key) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — we still redirect to clear the client state
    }
  }

  return NextResponse.redirect(new URL("/", base), { status: 303 });
}
