"use client";

import { MessageCircle, UserPlus, Users2, Map } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
  status: "soon" | "later" | "dream";
};

const steps: Step[] = [
  {
    icon: UserPlus,
    title: "Accounts & profiles",
    body: "A way for founding families and friends to join, share their story, and find each other.",
    status: "soon",
  },
  {
    icon: Users2,
    title: "A community feed",
    body: "Post updates, share what you’re learning, and keep the conversation going between gatherings.",
    status: "soon",
  },
  {
    icon: MessageCircle,
    title: "Direct messages",
    body: "Private threads for the practical stuff — planning, coordination, and the slower one-on-one work.",
    status: "later",
  },
  {
    icon: Map,
    title: "Land, water, neighbors",
    body: "The big one. A shared place to live, grow food, and raise each other’s kids well.",
    status: "dream",
  },
];

const statusLabel: Record<Step["status"], string> = {
  soon: "In progress",
  later: "Coming later",
  dream: "The long game",
};

export default function Roadmap() {
  return (
    <section className="border-t border-bark/10 bg-cream overflow-hidden">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-[0.3em] text-moss"
          >
            What&rsquo;s coming
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.1 }}
            className="mt-4 text-4xl text-bark md:text-5xl"
          >
            The road ahead
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-base leading-relaxed text-bark/75"
          >
            This site grows as we do. Here&rsquo;s the shape of what&rsquo;s
            next.
          </motion.p>
        </div>

        <ol className="mt-14 space-y-5">
          {steps.map(({ icon: Icon, title, body, status }, i) => {
            const fromLeft = i % 2 === 0;
            return (
              <motion.li
                key={title}
                initial={{
                  opacity: 0,
                  x: fromLeft ? -120 : 120,
                  rotate: fromLeft ? -3 : 3,
                }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 14,
                  delay: i * 0.08,
                }}
                whileHover={{ scale: 1.02, x: fromLeft ? 4 : -4 }}
                className="flex gap-5 rounded-2xl border border-bark/10 bg-sage/5 p-6"
              >
                <motion.div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage/25"
                  whileHover={{ rotate: [0, -15, 15, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="h-6 w-6 text-moss" aria-hidden="true" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-2xl text-bark">{title}</h3>
                    <motion.span
                      animate={
                        status === "dream"
                          ? {
                              opacity: [0.6, 1, 0.6],
                              scale: [1, 1.05, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="rounded-full bg-oak/15 px-3 py-0.5 text-xs uppercase tracking-wider text-oak"
                    >
                      {statusLabel[status]}
                    </motion.span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-bark/75">
                    {body}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
