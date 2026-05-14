"use client";

import { Sprout, Users, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type Pillar = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const pillars: Pillar[] = [
  {
    icon: Users,
    title: "Genuine Community",
    body: "Neighbors who actually know each other. Shared meals, shared work, and the kind of belonging that doesn't ask you to earn it.",
  },
  {
    icon: Sprout,
    title: "Rooted in Land",
    body: "Gardens, orchards, livestock, and water rights. Real ground under our feet and the skills to tend it well, together.",
  },
  {
    icon: Sun,
    title: "Self-Sustaining",
    body: "Less dependent on systems that don't serve us, more connected to the seasons, our food, and the people we live alongside.",
  },
];

export default function Pillars() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] text-moss"
        >
          What we&rsquo;re building
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 text-4xl text-bark md:text-5xl"
        >
          Three roots, one tree
        </motion.h2>
      </div>

      <motion.div
        className="mt-14 grid gap-8 md:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
        }}
      >
        {pillars.map(({ icon: Icon, title, body }, i) => (
          <motion.article
            key={title}
            variants={{
              hidden: {
                opacity: 0,
                y: 80,
                rotate: i % 2 === 0 ? -6 : 6,
                scale: 0.85,
              },
              visible: {
                opacity: 1,
                y: 0,
                rotate: 0,
                scale: 1,
              },
            }}
            transition={{ type: "spring", stiffness: 100, damping: 12 }}
            whileHover={{
              y: -8,
              rotate: i % 2 === 0 ? -1 : 1,
              transition: { type: "spring", stiffness: 300, damping: 15 },
            }}
            className="flex flex-col items-center rounded-2xl border border-bark/10 bg-cream p-8 text-center shadow-sm"
          >
            <motion.div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sage/25"
              whileHover={{ rotate: 360, scale: 1.15 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Icon className="h-7 w-7 text-moss" aria-hidden="true" />
            </motion.div>
            <h3 className="text-2xl text-bark">{title}</h3>
            <p className="mt-4 text-base leading-relaxed text-bark/75">
              {body}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
