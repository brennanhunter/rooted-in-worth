"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UnsubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function unsubscribe(
  formData: FormData,
): Promise<UnsubscribeResult> {
  const rawToken = formData.get("token");

  if (typeof rawToken !== "string" || !UUID_RE.test(rawToken)) {
    return { ok: false, error: "Invalid unsubscribe link." };
  }

  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", rawToken)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("unsubscribe(): supabase error", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (!data) {
    return { ok: false, error: "This link is no longer valid." };
  }

  revalidatePath(`/unsubscribe/${rawToken}`);
  return { ok: true };
}
