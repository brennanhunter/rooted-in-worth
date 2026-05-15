import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ModerationActions from "./ModerationActions";

export const metadata = {
  title: "Moderation · Rooted in Worth",
  robots: { index: false, follow: false },
};

type Report = {
  id: string;
  post_id: string;
  reporter_id: string | null;
  reason: string | null;
  created_at: string;
};

export default async function ModerationPage() {
  // Service role: sees reports + soft-deleted posts (bypasses RLS).
  const { data: reports } = await supabaseAdmin
    .from("post_reports")
    .select("id, post_id, reporter_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .returns<Report[]>();

  const list = reports ?? [];
  const postIds = [...new Set(list.map((r) => r.post_id))];
  const personIds = [
    ...new Set(
      list.flatMap((r) => (r.reporter_id ? [r.reporter_id] : [])),
    ),
  ];

  const postMap = new Map<
    string,
    { id: string; body: string; deleted_at: string | null; author_id: string }
  >();
  if (postIds.length) {
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("id, body, deleted_at, author_id")
      .in("id", postIds);
    for (const p of posts ?? []) postMap.set(p.id, p);
  }

  const authorIds = [...new Set([...postMap.values()].map((p) => p.author_id))];
  const nameMap = new Map<string, string>();
  const allPeople = [...new Set([...personIds, ...authorIds])];
  if (allPeople.length) {
    const { data: people } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", allPeople);
    for (const p of people ?? [])
      nameMap.set(p.id, p.display_name ?? "Unknown");
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl text-bark md:text-4xl">Moderation</h1>
        <Link
          href="/admin"
          className="text-sm text-moss underline-offset-4 hover:underline"
        >
          ← Newsletter
        </Link>
      </div>

      <p className="mb-8 text-sm text-bark/60">
        {list.length} open report{list.length === 1 ? "" : "s"}.
      </p>

      <div className="flex flex-col gap-5">
        {list.length === 0 && (
          <p className="py-12 text-center text-bark/50">
            Nothing to review. The grove is calm.
          </p>
        )}
        {list.map((r) => {
          const post = postMap.get(r.post_id);
          const removed = Boolean(post?.deleted_at);
          return (
            <article
              key={r.id}
              className="rounded-2xl border border-bark/10 bg-cream p-5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bark/55">
                <span>
                  Author:{" "}
                  <span className="text-bark/80">
                    {post ? nameMap.get(post.author_id) ?? "Unknown" : "—"}
                  </span>
                </span>
                <span>·</span>
                <span>
                  Reported by:{" "}
                  <span className="text-bark/80">
                    {r.reporter_id
                      ? nameMap.get(r.reporter_id) ?? "Unknown"
                      : "deleted user"}
                  </span>
                </span>
                <span>·</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
                {removed && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                    removed
                  </span>
                )}
              </div>

              {r.reason && (
                <p className="mt-3 rounded-lg bg-oak/10 px-3 py-2 text-sm text-bark/80">
                  &ldquo;{r.reason}&rdquo;
                </p>
              )}

              <p className="mt-3 whitespace-pre-line rounded-lg border border-bark/10 bg-sage/5 p-3 text-sm leading-relaxed text-bark/85">
                {post ? post.body : "[post no longer exists]"}
              </p>

              {post && (
                <div className="mt-4">
                  <ModerationActions
                    postId={post.id}
                    reportId={r.id}
                    isRemoved={removed}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
