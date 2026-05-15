"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Flag, Trash2, Loader2 } from "lucide-react";
import { reportPost, deleteOwnPost } from "@/app/actions/posts";

export default function PostMenu({
  postId,
  isOwn,
}: {
  postId: string;
  isOwn: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "done">("menu");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

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
        <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-bark/15 bg-cream p-1 shadow-lg">
          {mode === "menu" && (
            <>
              {isOwn ? (
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
