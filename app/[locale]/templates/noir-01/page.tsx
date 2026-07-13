"use client";
import { motion, type Variants } from "framer-motion";
import { Cormorant_Garamond, Great_Vibes, Jost } from "next/font/google";
import { ChevronDown } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

export default function Noir01Template({ data }: { data?: any }) {
  const c = data?.content?.content || {};
  const bride = data?.bride_name || "Anastasia";
  const groom = data?.groom_name || "Matthew";
  const eventDate = data?.event_date || new Date().toISOString();

  const formattedDate = new Date(eventDate).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full bg-[#0A0A0A] text-[#0A0A0A] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          01 · HERO
      ══════════════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-8 py-12 relative">

        {/* White card */}
        <motion.div
          className="w-full max-w-2xl bg-[#FAFAF8] flex flex-col items-center text-center py-20 px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="flex flex-col items-center w-full"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="w-14 h-px bg-[#0A0A0A]/20 mb-10" />

            {/* Bride name */}
            <motion.h1
              variants={fadeUp}
              className={`${cormorant.className} text-5xl sm:text-6xl md:text-7xl font-light tracking-[0.15em] uppercase leading-tight`}
            >
              {bride.split(" ").map((word: string, i: number) => (
                <span key={i} className="block">{word}</span>
              ))}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className={`${greatVibes.className} text-5xl sm:text-6xl text-[#0A0A0A]/40 my-5`}
            >
              and
            </motion.p>

            {/* Groom name */}
            <motion.h1
              variants={fadeUp}
              className={`${cormorant.className} text-5xl sm:text-6xl md:text-7xl font-light tracking-[0.15em] uppercase leading-tight`}
            >
              {groom.split(" ").map((word: string, i: number) => (
                <span key={i} className="block">{word}</span>
              ))}
            </motion.h1>

            <motion.div variants={fadeUp} className="w-14 h-px bg-[#0A0A0A]/20 mt-10 mb-8" />

            {/* Date */}
            <motion.p
              variants={fadeUp}
              className={`${jost.className} text-sm tracking-[0.3em] uppercase text-[#0A0A0A]/40 font-light`}
            >
              {c.hero?.date_text ?? formattedDate}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className={`${jost.className} text-[9px] tracking-[0.4em] uppercase text-white/20`}>
            scroll
          </span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={14} className="text-white/20" />
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
