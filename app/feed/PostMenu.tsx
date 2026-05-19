"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Flag,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { reportPost, deleteOwnPost, editPost } from "@/app/actions/posts";

export default function PostMenu({
  postId,
  isOwn,
  initialBody,
  initialTags,
}: {
  postId: string;
  isOwn: boolean;
  initialBody: string;
  initialTags: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "edit" | "done">(
    "menu",
  );
  const [reason, setReason] = useState("");
  const [body, setBody] = useState(initialBody);
  const [tags, setTags] = useState(initialTags);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("menu");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function submitReport() {
    setBusy(true);
    try {
      await reportPost(postId, reason);
      setMode("done");
    } catch {
      setMode("done"); // never reveal report state / errors
    }
    setBusy(false);
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      const r = await deleteOwnPost(postId);
      if (r.ok) {
        setOpen(false);
        router.refresh();
        return;
      }
    } catch {
      /* fall through */
    }
    setBusy(false);
  }

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      const r = await editPost(postId, body, tags);
      if (r.ok) {
        setOpen(false);
        setMode("menu");
        router.refresh();
        return;
      }
      setError(r.error);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Post options"
        className="rounded-full p-1 text-bark/40 transition-colors hover:bg-bark/5 hover:text-bark/70"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-bark/15 bg-cream p-1 shadow-lg">
          {mode === "menu" && (
            <>
              {isOwn ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-bark transition-colors hover:bg-bark/5"
                  >
                    <Pencil className="h-4 w-4 text-bark/60" aria-hidden="true" />
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={busy}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    Delete post
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("report")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-bark transition-colors hover:bg-bark/5"
                >
                  <Flag className="h-4 w-4 text-bark/60" aria-hidden="true" />
                  Report
                </button>
              )}
            </>
          )}

          {mode === "edit" && (
            <div className="p-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={5000}
                disabled={busy}
                className="w-full resize-y rounded-lg border border-bark/20 bg-cream px-2 py-1.5 text-sm text-bark focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={busy}
                placeholder="tags (comma-separated)"
                className="mt-2 w-full rounded-lg border border-bark/20 bg-cream px-2 py-1.5 text-xs text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
              {error && (
                <p className="mt-1 text-xs text-red-700">{error}</p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-bark px-4 py-1.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
                >
                  {busy && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("menu");
                    setBody(initialBody);
                    setTags(initialTags);
                    setError(null);
                  }}
                  disabled={busy}
                  className="rounded-full border border-bark/20 px-4 py-1.5 text-sm text-bark transition-colors hover:bg-bark/5 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === "report" && (
            <div className="p-2">
              <p className="mb-2 text-xs text-bark/60">
                Tell us what&rsquo;s wrong (optional).
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={busy}
                className="w-full resize-none rounded-lg border border-bark/20 bg-cream px-2 py-1.5 text-sm text-bark focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
              <button
                type="button"
                onClick={submitReport}
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bark px-4 py-1.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
              >
                {busy && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Submit report
              </button>
            </div>
          )}

          {mode === "done" && (
            <p className="px-3 py-3 text-sm text-bark/70">
              Thanks — we&rsquo;ll take a look.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
