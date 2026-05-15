import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PeopleSearch from "./PeopleSearch";

export const metadata = {
  title: "People · Rooted in Worth",
  robots: { index: false, follow: false },
};

type Person = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  location_preference: string | null;
  skills: string[] | null;
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Members-only directory: protects the membership from public
  // enumeration. Individual profiles stay link-accessible separately.
  if (!user) redirect("/signin?next=/people");

  const q = ((await searchParams).q ?? "").trim().slice(0, 80);

  let query = supabase
    .from("public_profiles")
    .select("id, display_name, avatar_url, location_preference, skills")
    .order("display_name", { ascending: true, nullsFirst: false })
    .limit(60);
  if (q) query = query.ilike("display_name", `%${q}%`);

  const { data: people } = await query.returns<Person[]>();
  const list = people ?? [];

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-4xl text-bark md:text-5xl">People</h1>
      <p className="mt-2 text-base text-bark/70">
        Find others in the community.
      </p>

      <div className="mt-6">
        <PeopleSearch q={q} />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {list.length === 0 && (
          <p className="py-12 text-center text-bark/50">
            {q ? "No one matches that search." : "No members yet."}
          </p>
        )}
        {list.map((p) => {
          const name = p.display_name?.trim() || "A community member";
          const skills = (p.skills ?? []).filter(Boolean).slice(0, 4);
          return (
            <Link
              key={p.id}
              href={`/u/${p.id}`}
              className="flex items-center gap-4 rounded-2xl border border-bark/10 bg-cream p-4 transition-colors hover:bg-bark/[0.03]"
            >
              <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sage/25">
                {p.avatar_url ? (
                  <Image
                    src={p.avatar_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-moss">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-bark">{name}</span>
                {p.location_preference && (
                  <span className="block truncate text-xs text-bark/55">
                    {p.location_preference}
                  </span>
                )}
                {skills.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-sage/20 px-2 py-0.5 text-xs text-bark/70"
                      >
                        {s}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
