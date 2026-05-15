"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { motion } from "motion/react";
import { createPost } from "@/app/actions/posts";

export default function Composer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("body", body);
      fd.append("tags", tags);
      const result = await createPost(fd);
      if (result.ok) {
        setBody("");
        setTags("");
        // Re-fetch the server-rendered feed so the new post appears.
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("createPost threw", err);
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-bark/10 bg-cream p-5"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={busy}
        rows={3}
        maxLength={5000}
        placeholder="Share something with the community…"
        className="w-full resize-y rounded-xl border border-bark/20 bg-cream px-4 py-3 leading-relaxed text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={busy}
          type="text"
          placeholder="tags: gardening, prayer, update (comma-separated)"
          className="flex-1 rounded-xl border border-bark/20 bg-cream px-4 py-2.5 text-sm text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
        />
        <motion.button
          type="submit"
          disabled={busy || body.trim().length === 0}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-2.5 text-sm text-cream transition-colors hover:bg-bark/90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          Post
        </motion.button>
      </div>
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
