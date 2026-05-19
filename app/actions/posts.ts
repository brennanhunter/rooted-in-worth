"use server";

import { createClient } from "@/lib/supabase/server";
import {
  postRatelimit,
  reportRatelimit,
  likeRatelimit,
} from "@/lib/ratelimit";

export type PostResult = { ok: true } | { ok: false; error: string };
export type LikeResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: string };

const MAX_BODY = 5000;
const MAX_TAGS = 8;
const MAX_TAG_LEN = 30;

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .map((t) => t.slice(0, MAX_TAG_LEN)),
    ),
  ).slice(0, MAX_TAGS);
}

export async function createPost(formData: FormData): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to post." };

  // Posting requires a completed (age-affirmed) onboarding. This is the
  // same gate that blocks under-13 accounts from participating.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded_at) {
    return { ok: false, error: "Finish setting up your profile first." };
  }

  if (postRatelimit) {
    const { success } = await postRatelimit.limit(user.id);
    if (!success) {
      return {
        ok: false,
        error: "You're posting quickly — give it a minute.",
      };
    }
  } else {
    console.warn(
      "createPost(): rate limiting INACTIVE — Upstash env not set.",
    );
  }

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1) {
    return { ok: false, error: "Write something first." };
  }
  if (body.length > MAX_BODY) {
    return { ok: false, error: "That's a bit long — keep it under 5000 characters." };
  }
  const tags = parseTags(String(formData.get("tags") ?? ""));

  const { error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, body, tags });

  if (error) {
    console.error("createPost(): insert failed", error.message);
    return { ok: false, error: "Couldn't post that. Try again." };
  }
  return { ok: true };
}

export async function reportPost(
  postId: string,
  reason: string,
): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to report." };

  if (reportRatelimit) {
    const { success } = await reportRatelimit.limit(user.id);
    if (!success) {
      return { ok: false, error: "Too many reports. Try again later." };
    }
  } else {
    console.warn("reportPost(): rate limiting INACTIVE — Upstash env not set.");
  }

  const trimmed = reason.trim().slice(0, 500);
  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: trimmed || null,
  });

  // 23505 = unique_violation: already reported by this user. Treat as
  // success so we don't reveal report state or let them retry-spam.
  if (error && error.code !== "23505") {
    console.error("reportPost(): insert failed", error.message);
    return { ok: false, error: "Couldn't submit that report. Try again." };
  }
  return { ok: true };
}

/** Author soft-deletes their own post. RLS allows author update; the
 *  public read policy hides rows where deleted_at is set. */
export async function deleteOwnPost(postId: string): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", user.id)
    .is("deleted_at", null);

  if (error) {
    console.error("deleteOwnPost(): update failed", error.message);
    return { ok: false, error: "Couldn't delete that. Try again." };
  }
  return { ok: true };
}

export async function toggleLike(postId: string): Promise<LikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to like posts." };

  // Same participation gate as posting: only onboarded (age-affirmed)
  // accounts can interact.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded_at) {
    return { ok: false, error: "Finish setting up your profile first." };
  }

  if (likeRatelimit) {
    const { success } = await likeRatelimit.limit(user.id);
    if (!success) {
      return { ok: false, error: "Slow down a moment." };
    }
  } else {
    console.warn("toggleLike(): rate limiting INACTIVE — Upstash env not set.");
  }

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      console.error("toggleLike(): unlike failed", error.message);
      return { ok: false, error: "Couldn't update that. Try again." };
    }
    return { ok: true, liked: false };
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: user.id });
  // 23505 = already liked (race) — treat as liked, not an error.
  if (error && error.code !== "23505") {
    console.error("toggleLike(): like failed", error.message);
    return { ok: false, error: "Couldn't update that. Try again." };
  }
  return { ok: true, liked: true };
}
