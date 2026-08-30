import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BASE_TO_PLATFORM: Record<string, string> = {
  "/audit": "/audit/instagram",
  "/best-time": "/best-time/instagram",
  "/hashtags": "/hashtags/instagram",
  "/competitors": "/competitors/instagram",
  "/ai": "/ai/instagram",
};

export async function middleware(req: NextRequest) {
  const target = BASE_TO_PLATFORM[req.nextUrl.pathname];
  if (target) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }
  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
