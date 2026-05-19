"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { toggleLike } from "@/app/actions/posts";

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
  canInteract,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  canInteract: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  // Logged-out / not-onboarded: static display, not interactive.
  if (!canInteract) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-bark/45">
        <Heart className="h-4 w-4" aria-hidden="true" />
        {count > 0 && count}
      </span>
    );
  }

  async function onClick() {
    if (busy) return;
    setBusy(true);
    // Optimistic.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const res = await toggleLike(postId);
    if (!res.ok) {
      // Revert.
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } else if (res.liked !== nextLiked) {
      // Reconcile with server truth (e.g. race).
      setLiked(res.liked);
      setCount((c) => c + (res.liked ? 1 : -1) - (nextLiked ? 1 : -1));
    }
    setBusy(false);
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={busy}
      whileTap={{ scale: 0.85 }}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className="inline-flex items-center gap-1.5 text-sm text-bark/55 transition-colors hover:text-bark disabled:opacity-60"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          liked ? "fill-moss text-moss" : ""
        }`}
        aria-hidden="true"
      />
      {count > 0 && <span className={liked ? "text-moss" : ""}>{count}</span>}
    </motion.button>
  );
}
