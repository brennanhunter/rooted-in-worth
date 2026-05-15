"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { render } from "@react-email/render";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { authRatelimit, clientIp } from "@/lib/ratelimit";
import GoogleAccountEmail from "@/emails/GoogleAccountEmail";

export type AuthResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function rateLimited(): Promise<boolean> {
  if (!authRatelimit) {
    console.warn(
      "auth: rate limiting INACTIVE — UPSTASH env vars not set. Provision Upstash to enforce.",
    );
    return false;
  }
  const ip = clientIp(await headers());
  const { success } = await authRatelimit.limit(ip);
  return !success;
}

async function siteOrigin(): Promise<string> {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function signInWithPassword(
  formData: FormData,
): Promise<AuthResult> {
  if (await rateLimited()) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic message — don't reveal whether the email exists.
    return { ok: false, error: "Incorrect email or password." };
  }
  return { ok: true };
}

export async function signUpWithPassword(
  formData: FormData,
): Promise<AuthResult> {
  if (await rateLimited()) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const ageConfirmed = formData.get("age_confirm") != null;

  if (!ageConfirmed) {
    return {
      ok: false,
      error: "You must confirm you are at least 13 to create an account.",
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  if (password.length < 10) {
    return {
      ok: false,
      error: "Password must be at least 10 characters.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      data: {
        age_confirmed_at: new Date().toISOString(),
        ...(displayName ? { display_name: displayName } : {}),
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });

  if (error || !data?.url) {
    redirect("/signin?error=google");
  }
  redirect(data.url);
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<AuthResult> {
  if (await rateLimited()) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  // Decide what to actually send to the mailbox owner. The requester
  // always sees the same generic success (no enumeration leak); the
  // differentiation only reaches the real inbox.
  let method = "password";
  const { data, error } = await supabaseAdmin.rpc("auth_method_for_email", {
    p_email: email,
  });
  if (error) {
    // Function not deployed / failed — fail safe to the normal reset
    // path so password recovery never silently breaks.
    console.warn("requestPasswordReset(): rpc failed, defaulting to reset", error.message);
  } else if (typeof data === "string") {
    method = data;
  }

  if (method === "oauth_only") {
    const from = process.env.RESEND_FROM_EMAIL;
    if (from) {
      try {
        const html = await render(<GoogleAccountEmail siteUrl={origin} />);
        await resend.emails.send({
          from,
          to: email,
          subject: "Your Rooted in Worth account uses Google",
          html,
        });
      } catch (err) {
        console.error("requestPasswordReset(): google-notice send failed", err);
      }
    }
  } else if (method !== "none") {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset/update`,
    });
  }
  // method === 'none': send nothing, but still report success below.

  // Always report success — don't leak whether the email is registered.
  return { ok: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) {
    return { ok: false, error: "Password must be at least 10 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function changeEmail(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  );
  if (error) return { ok: false, error: error.message };
  // "Secure email change" is on in Supabase, so both the old and new
  // address must confirm before the change takes effect.
  return { ok: true };
}

export async function changePassword(
  formData: FormData,
): Promise<AuthResult> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 10) {
    return { ok: false, error: "Password must be at least 10 characters." };
  }
  if (!currentPassword) {
    return { ok: false, error: "Enter your current password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: "You're not signed in." };
  }

  // Re-authenticate: proves the requester knows the current password
  // (satisfies Supabase's "require current password" policy and blocks
  // a hijacked session from silently changing the password).
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Hard-delete via service role. The profiles row cascades
    // (FK on auth.users ON DELETE CASCADE). Posts handling will be
    // decided in Phase 3 (anonymize vs remove) — none exist yet.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("deleteAccount(): admin delete failed", error.message);
    }
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
