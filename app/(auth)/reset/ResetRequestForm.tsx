"use client";

import { useState, type FormEvent } from "react";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ResetRequestForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await requestPasswordReset(new FormData(e.currentTarget));
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/25">
          <MailCheck className="h-6 w-6 text-moss" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-bark/75">
          If that email is registered, a reset link is on its way. Check
          your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        disabled={busy}
        className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Send reset link
      </button>
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-2 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
