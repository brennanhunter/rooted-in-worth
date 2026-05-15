"use client";

import { useState, type FormEvent } from "react";
import { Loader2, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  type AuthResult,
} from "@/app/actions/auth";

function Status({ result }: { result: AuthResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p className="inline-flex items-center gap-2 text-sm text-moss">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      Saved. Check your inbox if confirmation is required.
    </p>
  ) : (
    <p
      role="alert"
      className="inline-flex items-center gap-2 text-sm text-red-700"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {result.error}
    </p>
  );
}

export default function AccountForms({ email }: { email: string }) {
  const [emailRes, setEmailRes] = useState<AuthResult | null>(null);
  const [pwRes, setPwRes] = useState<AuthResult | null>(null);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyPw, setBusyPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusyEmail(true);
    setEmailRes(null);
    setEmailRes(await changeEmail(new FormData(e.currentTarget)));
    setBusyEmail(false);
  }

  async function onPw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setPwRes({ ok: false, error: "Passwords don't match." });
      return;
    }
    setBusyPw(true);
    setPwRes(null);
    setPwRes(await changePassword(fd));
    setBusyPw(false);
  }

  const field =
    "w-full rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60";
  const btn =
    "inline-flex items-center justify-center gap-2 self-start rounded-full bg-bark px-5 py-2.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl text-bark">Email</h2>
        <p className="text-sm text-bark/60">
          Currently <span className="text-bark">{email}</span>. Changing it
          requires confirming from both the old and new address.
        </p>
        <form onSubmit={onEmail} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="new@example.com"
            disabled={busyEmail}
            className={field}
          />
          <button type="submit" disabled={busyEmail} className={btn}>
            {busyEmail && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Update email
          </button>
          <Status result={emailRes} />
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl text-bark">Password</h2>
        <form onSubmit={onPw} className="flex flex-col gap-3">
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Current password"
            disabled={busyPw}
            className={field}
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password (10+ characters)"
            disabled={busyPw}
            className={field}
          />
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            disabled={busyPw}
            className={field}
          />
          <button type="submit" disabled={busyPw} className={btn}>
            {busyPw && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Update password
          </button>
          <Status result={pwRes} />
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-2xl text-bark">Delete account</h2>
        <p className="text-sm text-bark/70">
          This permanently removes your account and profile. It can&rsquo;t
          be undone.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-red-300 px-5 py-2.5 text-sm text-red-700 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete my account
          </button>
        ) : (
          <form action={deleteAccount} className="flex items-center gap-3">
            <button
              type="submit"
              onClick={() => setDeleting(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-sm text-white transition-colors hover:bg-red-800 disabled:opacity-60"
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Yes, permanently delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-full border border-bark/20 px-5 py-2.5 text-sm text-bark transition-colors hover:bg-bark/5"
            >
              Cancel
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
