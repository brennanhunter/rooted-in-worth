"use client";

import { motion } from "motion/react";

export default function Vision() {
  return (
    <section className="border-y border-bark/10 bg-sage/10 overflow-hidden">
      <div className="mx-auto w-full max-w-4xl px-6 py-20 text-center md:py-24">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.3em] text-moss"
        >
          Our Vision
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 80, damping: 14, delay: 0.1 }}
          className="mt-4 text-4xl text-bark md:text-5xl"
        >
          A place worth coming home to
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.25, delayChildren: 0.4 } },
          }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="mt-8 text-lg leading-relaxed text-bark/80 md:text-xl"
          >
            The long-term dream is a shared plot of land &mdash; with water
            rights, gardens, and homes &mdash; where a small circle of friends
            and families build something self-sustaining together. Some people
            call it an <em>agrihood</em>. We call it the next chapter.
          </motion.p>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="mt-6 text-base leading-relaxed text-bark/70"
          >
            For now, this is where the idea lives. A digital front porch while
            the real one is still being built.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
