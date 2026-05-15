"use client";

import { useState, type FormEvent } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { updatePassword } from "@/app/actions/auth";

export default function ResetUpdateForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await updatePassword(fd);
      if (result.ok) {
        // Hard navigation so the header reflects the session.
        window.location.assign("/");
        return;
      }
      setError(result.error);
    } catch (err) {
      console.error("password update threw", err);
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        name="password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="New password (10+ characters)"
        disabled={busy}
        className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
      />
      <input
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Confirm new password"
        disabled={busy}
        className="w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Set new password
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
