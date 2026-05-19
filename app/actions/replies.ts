"use server";

import { createClient } from "@/lib/supabase/server";
import { replyRatelimit, reportRatelimit } from "@/lib/ratelimit";

export type ReplyResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 2000;

async function authedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createReply(
  postId: string,
  rawBody: string,
): Promise<ReplyResult> {
  const { supabase, user } = await authedUser();
  if (!user) return { ok: false, error: "Sign in to reply." };

  // Same age-affirmed participation gate as posting.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.onboarded_at) {
    return { ok: false, error: "Finish setting up your profile first." };
  }

  if (replyRatelimit) {
    const { success } = await replyRatelimit.limit(user.id);
    if (!success) {
      return { ok: false, error: "You're replying quickly — give it a minute." };
    }
  } else {
    console.warn("createReply(): rate limiting INACTIVE — Upstash env not set.");
  }

  const body = rawBody.trim();
  if (body.length < 1) return { ok: false, error: "Write a reply first." };
  if (body.length > MAX_BODY) {
    return { ok: false, error: "Keep replies under 2000 characters." };
  }

  const { error } = await supabase
    .from("post_replies")
    .insert({ post_id: postId, author_id: user.id, body });
  if (error) {
    console.error("createReply(): insert failed", error.message);
    return { ok: false, error: "Couldn't post that reply. Try again." };
  }
  return { ok: true };
}

export async function editReply(
  replyId: string,
  rawBody: string,
): Promise<ReplyResult> {
  const { supabase, user } = await authedUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const body = rawBody.trim();
  if (body.length < 1) return { ok: false, error: "Reply can't be empty." };
  if (body.length > MAX_BODY) {
    return { ok: false, error: "Keep replies under 2000 characters." };
  }

  const { error } = await supabase
    .from("post_replies")
    .update({ body })
    .eq("id", replyId)
    .eq("author_id", user.id)
    .is("deleted_at", null);
  if (error) {
    console.error("editReply(): update failed", error.message);
    return { ok: false, error: "Couldn't save that edit. Try again." };
  }
  return { ok: true };
}

export async function deleteOwnReply(
  replyId: string,
): Promise<ReplyResult> {
  const { supabase, user } = await authedUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { error } = await supabase
    .from("post_replies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("author_id", user.id)
    .is("deleted_at", null);
  if (error) {
    console.error("deleteOwnReply(): update failed", error.message);
    return { ok: false, error: "Couldn't delete that. Try again." };
  }
  return { ok: true };
}

export async function reportReply(
  replyId: string,
  reason: string,
): Promise<ReplyResult> {
  const { supabase, user } = await authedUser();
  if (!user) return { ok: false, error: "Sign in to report." };

  if (reportRatelimit) {
    const { success } = await reportRatelimit.limit(user.id);
    if (!success) {
      return { ok: false, error: "Too many reports. Try again later." };
    }
  } else {
    console.warn("reportReply(): rate limiting INACTIVE — Upstash env not set.");
  }

  const trimmed = reason.trim().slice(0, 500);
  const { error } = await supabase.from("reply_reports").insert({
    reply_id: replyId,
    reporter_id: user.id,
    reason: trimmed || null,
  });
  // 23505 = already reported by this user — treat as success (don't
  // reveal report state, block retry-spam).
  if (error && error.code !== "23505") {
    console.error("reportReply(): insert failed", error.message);
    return { ok: false, error: "Couldn't submit that report. Try again." };
  }
  return { ok: true };
}
