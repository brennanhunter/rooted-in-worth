"use client";

import Image from "next/image";
import { motion } from "motion/react";

const titleWords = ["Rooted", "in", "Worth"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-20 text-center md:py-28">
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 12, delay: 0.1 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          >
            <Image
              src="/logo.png"
              alt="Rooted in Worth"
              width={220}
              height={220}
              className="h-44 w-44 md:h-56 md:w-56"
              priority
            />
          </motion.div>
        </motion.div>

        <div className="flex max-w-3xl flex-col gap-6">
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ duration: 1.4, delay: 0.9, ease: "easeOut" }}
            className="text-xs uppercase text-moss"
          >
            A community taking root
          </motion.p>

          <h1 className="text-5xl leading-tight text-bark md:text-7xl">
            {titleWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ y: 80, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                  delay: 0.5 + i * 0.18,
                }}
                className="inline-block"
                style={{ transformOrigin: "bottom" }}
              >
                {word}
                {i < titleWords.length - 1 && " "}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.3, ease: "easeOut" }}
            className="text-lg leading-relaxed text-bark/75 md:text-xl"
          >
            Belonging, dignity, and shared land. We&rsquo;re building a small,
            self-sustaining community grounded in the conviction that every
            person carries inherent worth.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
