import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountMenu from "./AccountMenu";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? user.email ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-bark/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Rooted in Worth"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
          <span className="text-xl text-bark">Rooted in Worth</span>
        </Link>

        {user ? (
          <AccountMenu displayName={displayName} avatarUrl={avatarUrl} />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="inline-flex items-center rounded-full border border-bark/20 bg-cream px-4 py-2 text-sm text-bark transition-colors hover:border-bark/40 hover:bg-bark/5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-bark px-4 py-2 text-sm text-cream transition-colors hover:bg-bark/90"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
