import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "riw_admin";
const SESSION_PAYLOAD = "rooted-in-worth-admin";

function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error("Missing ADMIN_PASSWORD env var.");
  }
  return pw;
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Constant-time check of a submitted password against the env value. */
export function verifyPassword(input: string): boolean {
  return timingSafeEqual(input, adminPassword());
}

/** Opaque session token: HMAC of a fixed payload keyed by the password.
 *  Changing ADMIN_PASSWORD invalidates all existing sessions. */
export function sessionToken(): string {
  return crypto
    .createHmac("sha256", adminPassword())
    .update(SESSION_PAYLOAD)
    .digest("hex");
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  return timingSafeEqual(token, sessionToken());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Call at the top of any protected admin server component / layout. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
