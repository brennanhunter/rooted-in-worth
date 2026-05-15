import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: this file replaces middleware.ts. Its only job here is to
// refresh the Supabase session cookie on every request so SSR sees a
// fresh token. It is NOT the authorization boundary — RLS + per-route
// getUser() checks are. (Supabase docs: proxy/middleware is an
// optimistic refresh, not a security gate.)
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Anti-cache headers from @supabase/ssr — without these a CDN
          // could cache a Set-Cookie response and serve one user's
          // session to another. Must be applied to the response.
          Object.entries(headers).forEach(([k, v]) =>
            response.headers.set(k, v),
          );
        },
      },
    },
  );

  // Must run before the response is committed so a refreshed token can
  // be written via setAll above. getUser() contacts the Auth server and
  // returns a verified identity (unlike getSession()).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets. Auth pages still pass
  // through so their session stays fresh.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
