import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSetupForm from "./ProfileSetupForm";

export const metadata = {
  title: "Set up your profile · Rooted in Worth",
  robots: { index: false, follow: false },
};

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/profile/setup");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  // Already onboarded → no forced re-setup. Editing comes later via a
  // profile edit screen (Phase 2 follow-up).
  if (profile?.onboarded_at) redirect("/");

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="text-4xl text-bark md:text-5xl">Welcome — let&rsquo;s plant your profile</h1>
      <p className="mt-3 text-base leading-relaxed text-bark/70">
        Share as much or as little as you like. None of this is required,
        and you can change it anytime.
      </p>
      <div className="mt-10">
        <ProfileSetupForm
          defaultName={profile?.display_name ?? ""}
          defaultAvatarUrl={profile?.avatar_url ?? null}
          needsAgeConfirm={!user.user_metadata?.age_confirmed_at}
        />
      </div>
    </section>
  );
}
