"use client";

import { useState } from "react";
import { Loader2, MailX } from "lucide-react";
import { motion } from "motion/react";
import { unsubscribe } from "@/app/actions/unsubscribe";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.append("token", token);

    const result = await unsubscribe(formData);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
    // On success: revalidatePath in the action triggers a fresh render
    // that shows the "you're unsubscribed" state, so we don't need to
    // clear submitting here.
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-base text-cream transition-colors hover:bg-bark/90 disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Unsubscribing…
          </>
        ) : (
          <>
            <MailX className="h-4 w-4" aria-hidden="true" />
            Confirm unsubscribe
          </>
        )}
      </motion.button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
