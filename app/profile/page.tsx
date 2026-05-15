import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "./ProfileEditForm";

export const metadata = {
  title: "Your profile · Rooted in Worth",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, bio, skills, family_size, location_preference, avatar_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="mx-auto w-full max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-4xl text-bark md:text-5xl">Your profile</h1>
        <Link
          href={`/u/${user.id}`}
          className="shrink-0 text-sm text-moss underline-offset-4 hover:underline"
        >
          View public profile
        </Link>
      </div>
      <ProfileEditForm
        defaults={{
          displayName: profile?.display_name ?? "",
          bio: profile?.bio ?? "",
          skills: (profile?.skills ?? []).join(", "),
          familySize:
            profile?.family_size != null ? String(profile.family_size) : "",
          locationPreference: profile?.location_preference ?? "",
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </section>
  );
}
