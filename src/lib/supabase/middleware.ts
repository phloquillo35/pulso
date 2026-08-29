import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated session when Supabase is configured.
const PROTECTED = ["/dashboard", "/audit", "/best-time", "/hashtags", "/competitors", "/ai"];

export async function updateSession(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = NextResponse.next({ request: req });
  if (!url || !key) return res; // demo mode: no auth, no protection

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
      ) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]),
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  const isLogin = path === "/login";

  if (isProtected && !user) {
    const redirect = new URL("/login", req.url);
    redirect.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirect);
  }
  if (isLogin && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return res;
}
