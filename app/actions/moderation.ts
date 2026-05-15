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

/** Clear a reported avatar (set null) and resolve the profile's open
 *  reports. The profile/account itself is left intact. */
export async function adminRemoveAvatar(
  profileId: string,
): Promise<ModResult> {
  if (!(await guard())) return { ok: false, error: "Not authorized." };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", profileId);
  if (error) {
    console.error("adminRemoveAvatar(): failed", error.message);
    return { ok: false, error: "Couldn't remove the avatar." };
  }

  await supabaseAdmin
    .from("profile_reports")
    .update({ status: "actioned", resolved_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("status", "open");

  return { ok: true };
}

/** Dismiss a single profile report (keep the avatar). */
export async function adminDismissProfileReport(
  reportId: string,
): Promise<ModResult> {
  if (!(await guard())) return { ok: false, error: "Not authorized." };

  const { error } = await supabaseAdmin
    .from("profile_reports")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) {
    console.error("adminDismissProfileReport(): failed", error.message);
    return { ok: false, error: "Couldn't dismiss the report." };
  }
  return { ok: true };
}
