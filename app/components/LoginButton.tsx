"use client";

import { useEffect, useState } from "react";
import { UserCircle2, X, Sprout } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function LoginButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
        whileTap={{ scale: 0.92 }}
        transition={{ rotate: { duration: 0.4 }, scale: { type: "spring", stiffness: 400 } }}
        className="inline-flex items-center gap-2 rounded-full border border-bark/20 bg-cream px-4 py-2 text-sm text-bark transition-colors hover:border-bark/40 hover:bg-bark/5"
        aria-label="Sign in"
      >
        <UserCircle2 className="h-5 w-5 text-bark" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -8, y: 40 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 6, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              className="relative w-full max-w-md rounded-2xl border border-bark/10 bg-cream p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-bark/60 transition-colors hover:bg-bark/5 hover:text-bark"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 12,
                    delay: 0.15,
                  }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sprout className="h-7 w-7 text-moss" aria-hidden="true" />
                  </motion.div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  id="coming-soon-title"
                  className="text-2xl text-bark"
                >
                  Coming Soon
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-3 text-sm leading-relaxed text-bark/70"
                >
                  Accounts, community posts, and messaging are still being
                  planted. Check back as Rooted in Worth grows.
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 rounded-full bg-bark px-6 py-2 text-sm text-cream transition-colors hover:bg-bark/90"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
