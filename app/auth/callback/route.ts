import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Google OAuth and from email
// confirmation / password-reset links. Exchanges the one-time code
// for a session (cookies written via the server client's setAll).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Only allow same-origin relative redirects (open-redirect guard).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First arrival with a session (email confirmed, or Google):
      // nudge not-yet-onboarded users into profile setup. Only when
      // landing on the default route — an explicit `next` (e.g. the
      // password-reset flow) is always honored.
      if (safeNext === "/") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarded_at")
            .eq("id", user.id)
            .maybeSingle();
          if (!profile?.onboarded_at) {
            return NextResponse.redirect(`${origin}/profile/setup`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("auth/callback: exchange failed", error.message);
  }

  return NextResponse.redirect(`${origin}/signin?error=callback`);
}
