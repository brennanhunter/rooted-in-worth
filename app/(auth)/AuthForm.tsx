"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { motion } from "motion/react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "@/app/actions/auth";

type Mode = "signin" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentConfirm, setSentConfirm] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result =
      mode === "signin"
        ? await signInWithPassword(fd)
        : await signUpWithPassword(fd);

    if (result.ok) {
      if (mode === "signup") {
        setSentConfirm(true);
        setBusy(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  if (sentConfirm) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/25">
          <Mail className="h-6 w-6 text-moss" aria-hidden="true" />
        </div>
        <h2 className="text-2xl text-bark">Check your inbox</h2>
        <p className="text-sm leading-relaxed text-bark/70">
          We sent a confirmation link. Click it to finish creating your
          account, then sign in.
        </p>
        <Link
          href="/signin"
          className="mt-2 text-sm text-moss underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            name="display_name"
            type="text"
            autoComplete="name"
            placeholder="Display name (optional)"
            disabled={busy}
            className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
          />
        )}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={busy}
          className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={
            mode === "signup" ? "Password (10+ characters)" : "Password"
          }
          disabled={busy}
          className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
        />

        {mode === "signin" && (
          <Link
            href="/reset"
            className="self-end text-xs text-bark/60 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        )}

        <motion.button
          type="submit"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
        >
          {busy && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {mode === "signin" ? "Sign in" : "Create account"}
        </motion.button>
      </form>

      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-2 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-bark/40">
        <span className="h-px flex-1 bg-bark/15" />
        or
        <span className="h-px flex-1 bg-bark/15" />
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-bark/20 bg-cream px-6 py-3 text-bark transition-colors hover:bg-bark/5"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-bark/65">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <Link
              href="/signup"
              className="text-moss underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-moss underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
