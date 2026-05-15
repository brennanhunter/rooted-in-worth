"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  adminRemoveAvatar,
  adminDismissProfileReport,
} from "@/app/actions/moderation";

export default function ProfileModerationActions({
  profileId,
  reportId,
  hasAvatar,
}: {
  profileId: string;
  reportId: string;
  hasAvatar: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {busy && (
        <Loader2
          className="h-4 w-4 animate-spin text-bark/50"
          aria-hidden="true"
        />
      )}
      {hasAvatar && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => adminRemoveAvatar(profileId))}
          className="rounded-full bg-red-700 px-4 py-1.5 text-sm text-white transition-colors hover:bg-red-800 disabled:opacity-60"
        >
          Remove avatar
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => adminDismissProfileReport(reportId))}
        className="rounded-full border border-bark/20 px-4 py-1.5 text-sm text-bark transition-colors hover:bg-bark/5 disabled:opacity-60"
      >
        Dismiss report
      </button>
    </div>
  );
}
