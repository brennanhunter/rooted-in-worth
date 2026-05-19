"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createReply,
  editReply,
  deleteOwnReply,
  reportReply,
} from "@/app/actions/replies";

export type ReplyView = {
  id: string;
  body: string;
  time: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  isOwn: boolean;
};

function ReplyItem({ reply }: { reply: ReplyView }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "report" | "reported">(
    "view",
  );
  const [body, setBody] = useState(reply.body);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    setBusy(true);
    try {
      const r = await editReply(reply.id, body);
      if (r.ok) {
        setMode("view");
        setMenu(false);
        router.refresh();
        return;
      }
    } catch {
      /* keep editing */
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    try {
      const r = await deleteOwnReply(reply.id);
      if (r.ok) {
        router.refresh();
        return;
      }
    } catch {
      /* fall through */
    }
    setBusy(false);
  }

  async function submitReport() {
    setBusy(true);
    try {
      await reportReply(reply.id, reason);
    } catch {
      /* never reveal */
    }
    setMode("reported");
    setMenu(false);
    setBusy(false);
  }

  return (
    <div className="flex gap-3">
      <Link href={`/u/${reply.authorId}`} className="shrink-0">
        <span className="relative block h-8 w-8 overflow-hidden rounded-full bg-sage/25">
          {reply.authorAvatar ? (
            <Image
              src={reply.authorAvatar}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-moss">
              {reply.authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${reply.authorId}`}
            className="text-sm text-bark hover:underline"
          >
            {reply.authorName}
          </Link>
          <span className="text-xs text-bark/45">· {reply.time}</span>
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label="Reply options"
              className="rounded-full p-1 text-bark/35 transition-colors hover:bg-bark/5 hover:text-bark/60"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {menu && (
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-bark/15 bg-cream p-1 shadow-lg">
                {reply.isOwn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("edit");
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-bark hover:bg-bark/5"
                    >
                      <Pencil className="h-4 w-4 text-bark/60" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={busy}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("report");
                      setMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-bark hover:bg-bark/5"
                  >
                    <Flag className="h-4 w-4 text-bark/60" aria-hidden="true" />
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {mode === "edit" ? (
          <div className="mt-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={busy}
              className="w-full resize-y rounded-lg border border-bark/20 bg-cream px-2 py-1.5 text-sm text-bark focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="rounded-full bg-bark px-4 py-1 text-xs text-cream hover:bg-bark/90 disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("view");
                  setBody(reply.body);
                }}
                disabled={busy}
                className="rounded-full border border-bark/20 px-4 py-1 text-xs text-bark hover:bg-bark/5 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : mode === "report" ? (
          <div className="mt-1">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="What's wrong? (optional)"
              disabled={busy}
              className="w-full resize-none rounded-lg border border-bark/20 bg-cream px-2 py-1.5 text-sm text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <button
              type="button"
              onClick={submitReport}
              disabled={busy}
              className="mt-1 rounded-full bg-bark px-4 py-1 text-xs text-cream hover:bg-bark/90 disabled:opacity-60"
            >
              Submit report
            </button>
          </div>
        ) : mode === "reported" ? (
          <p className="mt-1 text-sm text-bark/60">
            Thanks — we&rsquo;ll take a look.
          </p>
        ) : (
          <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-bark/85">
            {reply.body}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Replies({
  postId,
  replies,
  canInteract,
}: {
  postId: string;
  replies: ReplyView[];
  canInteract: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await createReply(postId, body);
      if (r.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(r.error);
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm text-bark/55 transition-colors hover:text-bark"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {replies.length > 0
          ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`
          : "Reply"}
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-l-2 border-bark/10 pl-4">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}

          {canInteract ? (
            <div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={busy}
                placeholder="Write a reply…"
                className="w-full resize-y rounded-xl border border-bark/20 bg-cream px-3 py-2 text-sm text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
              />
              {error && (
                <p className="mt-1 text-xs text-red-700">{error}</p>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={busy || !body.trim()}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-bark px-4 py-1.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-50"
              >
                {busy && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Reply
              </button>
            </div>
          ) : (
            <p className="text-xs text-bark/50">
              <Link
                href="/signup"
                className="text-moss underline-offset-4 hover:underline"
              >
                Create an account
              </Link>{" "}
              to reply.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
