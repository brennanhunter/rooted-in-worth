import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Composer from "./Composer";
import PostMenu from "./PostMenu";
import FeedFilters from "./FeedFilters";
import LikeButton from "./LikeButton";
import Replies, { type ReplyView } from "./Replies";
import Likers, { type LikerView } from "./Likers";

export const metadata = {
  title: "Community · Rooted in Worth",
  description: "What the Rooted in Worth community is sharing.",
};

type Post = {
  id: string;
  body: string;
  tags: string[];
  created_at: string;
  author_id: string;
};

type AuthorBits = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; person?: string; before?: string }>;
}) {
  const sp = await searchParams;
  const tag = (sp.tag ?? "").trim().toLowerCase().slice(0, 30);
  const person = (sp.person ?? "").trim().slice(0, 80);

  const PAGE_SIZE = 20;
  // Keyset cursor: "<createdAtISO>__<uuid>" of the last post on the
  // previous page. Validated before use; junk is ignored.
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let cursorTs: string | null = null;
  let cursorId: string | null = null;
  if (sp.before) {
    const [ts, id] = sp.before.split("__");
    if (ts && id && !Number.isNaN(Date.parse(ts)) && UUID_RE.test(id)) {
      cursorTs = ts;
      cursorId = id;
    }
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const viewerId = user?.id ?? null;
  let canPost = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    canPost = Boolean(me?.onboarded_at);
  }

  // Person filter: resolve matching author ids from the email-safe
  // public view first, then constrain posts to them.
  let personAuthorIds: string[] | null = null;
  if (person) {
    const { data: matches } = await supabase
      .from("public_profiles")
      .select("id")
      .ilike("display_name", `%${person}%`)
      .limit(50)
      .returns<{ id: string }[]>();
    personAuthorIds = (matches ?? []).map((m) => m.id);
  }

  let postQuery = supabase
    .from("posts")
    .select("id, body, tags, created_at, author_id")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // stable tiebreaker for keyset
    .limit(PAGE_SIZE + 1); // +1 sentinel to detect a next page

  if (tag) postQuery = postQuery.contains("tags", [tag]);
  if (personAuthorIds) postQuery = postQuery.in("author_id", personAuthorIds);
  if (cursorTs && cursorId) {
    // Keyset: created_at < cursor, OR same instant with a lower id.
    postQuery = postQuery.or(
      `created_at.lt.${cursorTs},and(created_at.eq.${cursorTs},id.lt.${cursorId})`,
    );
  }

  // No author matched the name → no posts can match; skip the query.
  const { data: rows } =
    personAuthorIds && personAuthorIds.length === 0
      ? { data: [] as Post[] }
      : await postQuery.returns<Post[]>();

  const allRows = rows ?? [];
  const hasMore = allRows.length > PAGE_SIZE;
  const posts = allRows.slice(0, PAGE_SIZE);
  const last = posts[posts.length - 1];
  const nextBefore = last ? `${last.created_at}__${last.id}` : null;

  const filterQs = new URLSearchParams();
  if (tag) filterQs.set("tag", tag);
  if (person) filterQs.set("person", person);
  const baseQs = filterQs.toString();

  const postIds = (posts ?? []).map((p) => p.id);

  // Replies for the visible posts (RLS already excludes soft-deleted),
  // oldest-first within each post.
  type ReplyRow = {
    id: string;
    post_id: string;
    author_id: string;
    body: string;
    created_at: string;
  };
  const replyRows: ReplyRow[] = [];
  const likeRows: { post_id: string; user_id: string }[] = [];
  if (postIds.length > 0) {
    const [rep, lk] = await Promise.all([
      supabase
        .from("post_replies")
        .select("id, post_id, author_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
        .returns<ReplyRow[]>(),
      supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds)
        .returns<{ post_id: string; user_id: string }[]>(),
    ]);
    replyRows.push(...(rep.data ?? []));
    likeRows.push(...(lk.data ?? []));
  }

  // One profile lookup covering post authors, reply authors, AND likers.
  const authorIds = [
    ...new Set([
      ...(posts ?? []).map((p) => p.author_id),
      ...replyRows.map((r) => r.author_id),
      ...likeRows.map((l) => l.user_id),
    ]),
  ];
  const authorMap = new Map<string, AuthorBits>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("public_profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds)
      .returns<AuthorBits[]>();
    for (const a of authors ?? []) authorMap.set(a.id, a);
  }

  const repliesByPost = new Map<string, ReplyView[]>();
  for (const r of replyRows) {
    const a = authorMap.get(r.author_id);
    const list = repliesByPost.get(r.post_id) ?? [];
    list.push({
      id: r.id,
      body: r.body,
      time: relativeTime(r.created_at),
      authorId: r.author_id,
      authorName: a?.display_name?.trim() || "A community member",
      authorAvatar: a?.avatar_url ?? null,
      isOwn: viewerId === r.author_id,
    });
    repliesByPost.set(r.post_id, list);
  }

  const likeCount = new Map<string, number>();
  const likedByViewer = new Set<string>();
  const likersByPost = new Map<string, LikerView[]>();
  for (const l of likeRows) {
    likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
    if (viewerId && l.user_id === viewerId) likedByViewer.add(l.post_id);
    const a = authorMap.get(l.user_id);
    const list = likersByPost.get(l.post_id) ?? [];
    list.push({
      id: l.user_id,
      name: a?.display_name?.trim() || "A community member",
      avatar: a?.avatar_url ?? null,
    });
    likersByPost.set(l.post_id, list);
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-4xl text-bark md:text-5xl">The grove</h1>
      <p className="mt-2 text-base text-bark/70">
        What the community is sharing. Everyone&rsquo;s here, not just
        people you follow.
      </p>

      <div className="mt-6">
        <FeedFilters tag={tag} person={person} />
      </div>

      <div className="mt-8">
        {user && canPost && <Composer />}
        {user && !canPost && (
          <div className="rounded-2xl border border-bark/10 bg-sage/10 p-5 text-sm text-bark/75">
            Finish{" "}
            <Link
              href="/profile/setup"
              className="text-moss underline-offset-4 hover:underline"
            >
              setting up your profile
            </Link>{" "}
            to start posting.
          </div>
        )}
        {!user && (
          <div className="rounded-2xl border border-bark/10 bg-sage/10 p-5 text-sm text-bark/75">
            <Link
              href="/signup"
              className="text-moss underline-offset-4 hover:underline"
            >
              Create an account
            </Link>{" "}
            to join the conversation. Anyone can read along.
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-5">
        {(posts ?? []).length === 0 && (
          <p className="py-12 text-center text-bark/50">
            {tag || person
              ? "No posts match this filter."
              : "Nothing here yet. Be the first to plant something."}
          </p>
        )}
        {(posts ?? []).map((post) => {
          const author = authorMap.get(post.author_id);
          const name = author?.display_name?.trim() || "A community member";
          return (
            <article
              key={post.id}
              className="rounded-2xl border border-bark/10 bg-cream p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/u/${post.author_id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="relative block h-9 w-9 overflow-hidden rounded-full bg-sage/25">
                      {author?.avatar_url ? (
                        <Image
                          src={author.avatar_url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm text-moss">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="text-bark hover:underline">{name}</span>
                  </Link>
                  <span className="text-xs text-bark/45">
                    · {relativeTime(post.created_at)}
                  </span>
                </div>
                {viewerId && (
                  <PostMenu
                    postId={post.id}
                    isOwn={post.author_id === viewerId}
                    initialBody={post.body}
                    initialTags={post.tags.join(", ")}
                  />
                )}
              </div>

              <p className="mt-3 whitespace-pre-line leading-relaxed text-bark/85">
                {post.body}
              </p>

              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/feed?tag=${encodeURIComponent(t)}`}
                      className="rounded-full bg-sage/20 px-2.5 py-0.5 text-xs text-bark/70 transition-colors hover:bg-sage/40 hover:text-bark"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-bark/5 pt-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <LikeButton
                    postId={post.id}
                    initialCount={likeCount.get(post.id) ?? 0}
                    initialLiked={likedByViewer.has(post.id)}
                    canInteract={canPost}
                  />
                  <Likers likers={likersByPost.get(post.id) ?? []} />
                </div>
                <Replies
                  postId={post.id}
                  replies={repliesByPost.get(post.id) ?? []}
                  canInteract={canPost}
                />
              </div>
            </article>
          );
        })}
      </div>

      {(hasMore || cursorTs) && (
        <div className="mt-10 flex items-center justify-between">
          {cursorTs ? (
            <Link
              href={baseQs ? `/feed?${baseQs}` : "/feed"}
              className="text-sm text-bark/60 underline-offset-4 hover:text-bark hover:underline"
            >
              ← Newest
            </Link>
          ) : (
            <span />
          )}
          {hasMore && nextBefore && (
            <Link
              href={`/feed?${
                baseQs ? `${baseQs}&` : ""
              }before=${encodeURIComponent(nextBefore)}`}
              className="rounded-full border border-bark/20 px-5 py-2 text-sm text-bark transition-colors hover:bg-bark/5"
            >
              Older posts →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
