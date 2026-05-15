import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Vercel's Upstash integration injects KV_REST_API_* names; the classic
// UPSTASH_REDIS_REST_* names are the fallback (e.g. if set manually for
// local dev). Use the read-WRITE token — rate limiting increments
// counters, so the read-only token would fail.
const url =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Sliding-window limiter for the public newsletter signup.
 * 5 attempts per 10 minutes per IP — generous for a real person
 * (who subscribes once), tight enough to stop bulk abuse.
 *
 * Null until Upstash is provisioned. Callers must decide fail-open
 * vs fail-closed explicitly (see subscribe()), so this never silently
 * pretends to be protecting an endpoint it isn't.
 */
export const subscribeRatelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "ratelimit:subscribe",
        analytics: false,
      })
    : null;

/**
 * Limiter for auth endpoints (sign-in, sign-up, password reset).
 * Tighter than subscribe — these are brute-force / enumeration targets.
 * 8 attempts per 10 minutes per IP.
 */
export const authRatelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(8, "10 m"),
        prefix: "ratelimit:auth",
        analytics: false,
      })
    : null;

/**
 * Limiter for creating posts. Keyed by user id (authed action), not
 * IP. Stops one account flooding the shared feed: 5 posts per 5 min.
 */
export const postRatelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(5, "5 m"),
        prefix: "ratelimit:post",
        analytics: false,
      })
    : null;

/**
 * Limiter for filing reports. Keyed by user id. Stops report-spam /
 * harassment-by-mass-reporting: 15 reports per 10 min.
 */
export const reportRatelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(15, "10 m"),
        prefix: "ratelimit:report",
        analytics: false,
      })
    : null;

/** Best-effort client IP from Vercel's forwarding headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
