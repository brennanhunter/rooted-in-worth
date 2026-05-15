"use server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ModResult = { ok: true } | { ok: false; error: string };

async function guard(): Promise<boolean> {
  return isAdminAuthenticated();
}

/** Soft-delete the post (hides it from every public read) and mark
 *  every open report on it as actioned. */
export async function adminRemovePost(postId: string): Promise<ModResult> {
  if (!(await guard())) return { ok: false, error: "Not authorized." };

  const { error: postErr } = await supabaseAdmin
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);
  if (postErr) {
    console.error("adminRemovePost(): post update failed", postErr.message);
    return { ok: false, error: "Couldn't remove the post." };
  }

  await supabaseAdmin
    .from("post_reports")
    .update({ status: "actioned", resolved_at: new Date().toISOString() })
    .eq("post_id", postId)
    .eq("status", "open");

  return { ok: true };
}

/** Dismiss a single report (keep the post). */
export async function adminDismissReport(
  reportId: string,
): Promise<ModResult> {
  if (!(await guard())) return { ok: false, error: "Not authorized." };

  const { error } = await supabaseAdmin
    .from("post_reports")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) {
    console.error("adminDismissReport(): failed", error.message);
    return { ok: false, error: "Couldn't dismiss the report." };
  }
  return { ok: true };
}

/** Restore a soft-deleted post (undo a removal). */
export async function adminRestorePost(postId: string): Promise<ModResult> {
  if (!(await guard())) return { ok: false, error: "Not authorized." };

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ deleted_at: null })
    .eq("id", postId);
  if (error) {
    console.error("adminRestorePost(): failed", error.message);
    return { ok: false, error: "Couldn't restore the post." };
  }
  return { ok: true };
}
