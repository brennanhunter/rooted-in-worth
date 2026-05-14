"use client";

import { useState, type FormEvent } from "react";
import { Mail, Send, Sprout, AlertCircle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { subscribe } from "@/app/actions/subscribe";

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterSignup({
  source = "footer",
}: {
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("source", source);

    const result = await subscribe(formData);

    if (result.ok) {
      setStatus("success");
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  return (
    <section className="border-y border-bark/10 bg-sage/15">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7 }}
        className="mx-auto w-full max-w-3xl px-6 py-16 text-center md:py-20"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 180, damping: 12 }}
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cream"
        >
          <Mail className="h-6 w-6 text-moss" aria-hidden="true" />
        </motion.div>

        <p className="text-xs uppercase tracking-[0.3em] text-moss">
          Stay connected
        </p>
        <h2 className="mt-3 text-3xl text-bark md:text-4xl">
          Get letters from the field
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-bark/75">
          Occasional notes on what we&rsquo;re learning, who we&rsquo;re
          meeting, and how the work is taking root. No spam, ever.
        </p>

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-moss/30 bg-cream px-6 py-6"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 0], y: [0, -4, 0] }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/30"
                >
                  <Sprout className="h-5 w-5 text-moss" aria-hidden="true" />
                </motion.div>
                <p className="text-xl text-bark">
                  You&rsquo;re rooted in.
                </p>
                <p className="text-sm leading-relaxed text-bark/70">
                  Welcome to the grove. Keep an eye on your inbox &mdash; we
                  don&rsquo;t write often, but when we do, we mean it.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <label htmlFor={`newsletter-email-${source}`} className="sr-only">
                  Email address
                </label>
                <motion.input
                  id={`newsletter-email-${source}`}
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setError(null);
                    }
                  }}
                  disabled={status === "submitting"}
                  animate={
                    status === "error"
                      ? { x: [0, -8, 8, -6, 6, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.4 }}
                  className="flex-1 rounded-full border border-bark/20 bg-cream px-5 py-3 text-base text-bark placeholder:text-bark/40 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30 disabled:opacity-60"
                />
                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-bark px-6 py-3 text-base text-cream transition-colors hover:bg-bark/90 disabled:opacity-70"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Subscribe
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="mt-3 inline-flex items-center gap-2 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
