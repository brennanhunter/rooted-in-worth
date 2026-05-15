"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { render } from "@react-email/render";
import {
  ADMIN_COOKIE,
  isAdminAuthenticated,
  sessionToken,
  verifyPassword,
} from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import NewsletterEmail from "@/emails/NewsletterEmail";

const EIGHT_HOURS = 60 * 60 * 8;
const BATCH_SIZE = 100;

export async function adminLogin(formData: FormData): Promise<void> {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EIGHT_HOURS,
  });

  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function previewNewsletter(
  subject: string,
  body: string,
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authorized." };
  }
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = await render(
    <NewsletterEmail
      subject={subject || "Subject preview"}
      body={body || "_Your letter will appear here._"}
      siteUrl={siteUrl}
      unsubscribeUrl={`${siteUrl}/unsubscribe/preview`}
    />,
  );
  return { ok: true, html };
}

export type SendResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: string };

export async function sendNewsletter(
  formData: FormData,
): Promise<SendResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authorized." };
  }

  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!subject || !body) {
    return { ok: false, error: "Subject and body are both required." };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { ok: false, error: "RESEND_FROM_EMAIL is not configured." };
  }
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: subscribers, error: subErr } = await supabaseAdmin
    .from("subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "active");

  if (subErr) {
    console.error("sendNewsletter(): fetch error", subErr);
    return { ok: false, error: "Could not load subscribers." };
  }
  if (!subscribers || subscribers.length === 0) {
    return { ok: false, error: "No active subscribers to send to." };
  }

  const { data: campaign } = await supabaseAdmin
    .from("campaigns")
    .insert({
      subject,
      body_text: body,
      body_html: "",
      status: "sending",
      recipient_count: subscribers.length,
    })
    .select("id")
    .single();

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);

    const emails = await Promise.all(
      chunk.map(async (s) => {
        const unsubscribeUrl = `${siteUrl}/unsubscribe/${s.unsubscribe_token}`;
        const html = await render(
          <NewsletterEmail
            subject={subject}
            body={body}
            siteUrl={siteUrl}
            unsubscribeUrl={unsubscribeUrl}
          />,
        );
        return {
          from,
          to: s.email,
          subject,
          html,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }),
    );

    try {
      const { error } = await resend.batch.send(emails);
      if (error) {
        console.error("sendNewsletter(): batch error", error);
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error("sendNewsletter(): batch threw", err);
      failed += chunk.length;
    }
  }

  if (campaign) {
    await supabaseAdmin
      .from("campaigns")
      .update({
        status: failed === 0 ? "sent" : "failed",
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
  }

  return { ok: true, sent, failed };
}
