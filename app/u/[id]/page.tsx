import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileReportButton from "./ProfileReportButton";

// Public, but intentionally not search-indexed: profiles of a
// vulnerable community shouldn't be crawlable/scrapable even though
// they're viewable with a direct link.
export const metadata = {
  title: "Profile · Rooted in Worth",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PublicProfile = {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  family_size: number | null;
  location_preference: string | null;
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // Reads the email-safe public_profiles view (granted to anon), never
  // the base profiles table.
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select(
      "display_name, avatar_url, bio, skills, family_size, location_preference",
    )
    .eq("id", id)
    .maybeSingle<PublicProfile>();

  if (!data) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canReport = Boolean(user) && user!.id !== id;

  const name = data.display_name?.trim() || "A community member";
  const skills = (data.skills ?? []).filter(Boolean);

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      {canReport && (
        <div className="mb-2 flex justify-end">
          <ProfileReportButton profileId={id} />
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full bg-sage/25">
          {data.avatar_url ? (
            <Image
              src={data.avatar_url}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl text-moss">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="mt-6 text-4xl text-bark md:text-5xl">{name}</h1>
        {data.location_preference && (
          <p className="mt-2 text-sm text-bark/60">
            {data.location_preference}
          </p>
        )}
      </div>

      {data.bio && (
        <p className="mt-10 whitespace-pre-line text-center text-lg leading-relaxed text-bark/80">
          {data.bio}
        </p>
      )}

      {skills.length > 0 && (
        <div className="mt-10">
          <h2 className="text-center text-xs uppercase tracking-[0.3em] text-moss">
            Skills &amp; gifts
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-sage/20 px-3 py-1 text-sm text-bark"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.family_size != null && (
        <p className="mt-8 text-center text-sm text-bark/60">
          Household of {data.family_size}
        </p>
      )}
    </section>
  );
}
