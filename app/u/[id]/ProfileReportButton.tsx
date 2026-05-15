"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { reportProfile } from "@/app/actions/profile";

export default function ProfileReportButton({
  profileId,
}: {
  profileId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function submit() {
    setBusy(true);
    try {
      await reportProfile(profileId, reason);
    } catch {
      /* never reveal report state */
    }
    setDone(true);
    setBusy(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-bark/45 transition-colors hover:text-bark/70"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        Report
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-bark/15 bg-cream p-3 shadow-lg">
          {done ? (
            <p className="px-1 py-2 text-sm text-bark/70">
              Thanks — we&rsquo;ll take a look.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-bark/60">
                What&rsquo;s wrong with this profile? (optional)
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
                onClick={submit}
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bark px-4 py-1.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-60"
              >
                {busy && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Submit report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
