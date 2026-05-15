"use server";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { subscribeRatelimit, clientIp } from "@/lib/ratelimit";
import WelcomeEmail from "@/emails/WelcomeEmail";

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function subscribe(formData: FormData): Promise<SubscribeResult> {
  if (subscribeRatelimit) {
    const ip = clientIp(await headers());
    const { success } = await subscribeRatelimit.limit(ip);
    if (!success) {
      return {
        ok: false,
        error: "Too many attempts. Please try again in a little while.",
      };
    }
  } else {
    console.warn(
      "subscribe(): rate limiting INACTIVE — UPSTASH_REDIS_REST_URL/TOKEN not set. " +
        "Provision Upstash Redis to enforce this.",
    );
  }

  const rawEmail = formData.get("email");
  const rawSource = formData.get("source");

  if (typeof rawEmail !== "string") {
    return { ok: false, error: "Invalid request." };
  }

  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }

  const source =
    typeof rawSource === "string" && rawSource.length > 0 ? rawSource : null;

  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .upsert(
      {
        email,
        source,
        status: "active",
        unsubscribed_at: null,
      },
      { onConflict: "email" },
    )
    .select("email, unsubscribe_token")
    .single();

  if (error || !data) {
    console.error("subscribe(): supabase error", error);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }

  // Send the welcome email. We don't want to fail the action if email
  // delivery fails — the subscription is already saved.
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const unsubscribeUrl = `${siteUrl}/unsubscribe/${data.unsubscribe_token}`;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!from) {
      console.warn("subscribe(): RESEND_FROM_EMAIL not set, skipping welcome email");
    } else {
      await resend.emails.send({
        from,
        to: data.email,
        subject: "Welcome to the grove",
        react: (
          <WelcomeEmail siteUrl={siteUrl} unsubscribeUrl={unsubscribeUrl} />
        ),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
    }
  } catch (err) {
    console.error("subscribe(): resend error", err);
    // Still treat as success for the user — they did subscribe.
  }

  return { ok: true };
}
