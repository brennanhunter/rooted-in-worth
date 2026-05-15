"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileResult = { ok: true } | { ok: false; error: string };

const MAX_BIO = 600;
const MAX_LOCATION = 200;
const MAX_NAME = 80;
const MAX_SKILLS = 20;
const MAX_SKILL_LEN = 40;

function parseSkills(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.slice(0, MAX_SKILL_LEN)),
    ),
  ).slice(0, MAX_SKILLS);
}

// formData is client-controlled. Only persist an avatar URL that
// points at our own Supabase Storage public path or Google's avatar
// host — never an arbitrary attacker-supplied URL.
function sanitizeAvatarUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    } catch {
      return "";
    }
  })();
  const okSupabase =
    u.host === supabaseHost &&
    u.pathname.startsWith("/storage/v1/object/public/avatars/");
  const okGoogle = u.host === "lh3.googleusercontent.com";
  return okSupabase || okGoogle ? value : null;
}

function parseFamilySize(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) return null;
  return n;
}

async function currentUserId(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

function parseProfileFields(formData: FormData) {
  return {
    display_name:
      String(formData.get("display_name") ?? "").trim().slice(0, MAX_NAME) ||
      null,
    bio: String(formData.get("bio") ?? "").trim().slice(0, MAX_BIO) || null,
    location_preference:
      String(formData.get("location_preference") ?? "")
        .trim()
        .slice(0, MAX_LOCATION) || null,
    skills: parseSkills(String(formData.get("skills") ?? "")),
    family_size: parseFamilySize(String(formData.get("family_size") ?? "")),
    avatar_url: sanitizeAvatarUrl(String(formData.get("avatar_url") ?? "")),
  };
}

const AGE_ERROR =
  "You must confirm you are at least 13 to continue.";

/**
 * Universal age gate. Every new user (email or Google, via any path)
 * passes through profile setup, so enforcing here closes the signup-page
 * gap. No-ops for users who already affirmed at signup (email) — they
 * never see the checkbox and aren't re-prompted. Records the affirmation
 * in user metadata so it's auditable and one-time.
 */
async function enforceAgeGate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  alreadyConfirmed: boolean,
  confirmedNow: boolean,
): Promise<string | null> {
  if (alreadyConfirmed) return null;
  if (!confirmedNow) return AGE_ERROR;
  await supabase.auth.updateUser({
    data: { age_confirmed_at: new Date().toISOString() },
  });
  return null;
}

export async function saveProfileSetup(
  formData: FormData,
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You're not signed in." };

  const ageErr = await enforceAgeGate(
    supabase,
    Boolean(user.user_metadata?.age_confirmed_at),
    formData.get("age_confirm") != null,
  );
  if (ageErr) return { ok: false, error: ageErr };

  const { error } = await supabase
    .from("profiles")
    .update({
      ...parseProfileFields(formData),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("saveProfileSetup(): update failed", error.message);
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }
  return { ok: true };
}

/** Edit an existing profile. Unlike setup, this does NOT touch
 *  onboarded_at — onboarding is a one-time event, editing is not. */
export async function updateProfile(
  formData: FormData,
): Promise<ProfileResult> {
  const user = await currentUserId();
  if (!user) return { ok: false, error: "You're not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parseProfileFields(formData))
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile(): update failed", error.message);
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }
  return { ok: true };
}

export async function skipProfileSetup(
  ageConfirm: boolean,
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You're not signed in." };

  const ageErr = await enforceAgeGate(
    supabase,
    Boolean(user.user_metadata?.age_confirmed_at),
    ageConfirm,
  );
  if (ageErr) return { ok: false, error: ageErr };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("skipProfileSetup(): update failed", error.message);
    return { ok: false, error: "Something went wrong. Try again." };
  }
  return { ok: true };
}
