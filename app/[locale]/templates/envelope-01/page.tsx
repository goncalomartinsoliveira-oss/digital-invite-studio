"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Modelo "Envelope" — de raiz, a pedido do casal. Passo 1: o ecrã de
// entrada (envelope a abrir para revelar o convite). As restantes secções
// vão sendo construídas a seguir, indicadas passo a passo.

export default function EnvelopeTemplate({ data }: { data: any; params?: any }) {
  const [opened, setOpened] = useState(false);

  const dbContent = data?.content || {};
  const content = dbContent.content || {};

  const bride = data?.bride_name || "Noiva";
  const groom = data?.groom_name || "Noivo";

  return (
    <div className="w-full min-h-screen bg-white font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section
            key="entry"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-[#332E2B]/55 mb-5"
            >
              {content.hero?.text_above_names ?? "Recebeu um convite de"}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-6xl md:text-8xl leading-tight mb-12 px-4"
              style={{ fontFamily: "var(--font-pinyon)", color: "#332E2B" }}
            >
              {groom} &amp; {bride}
            </motion.h1>

            <motion.button
              type="button"
              onClick={() => setOpened(true)}
              aria-label="Abrir o convite"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-[300px] md:max-w-[360px] cursor-pointer"
            >
              <img
                src="/envelope-01/envelope.webp"
                alt=""
                className="w-full h-auto drop-shadow-xl select-none"
                draggable={false}
              />
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-[#332E2B]/40 mt-9"
            >
              Clique para abrir
            </motion.p>
          </motion.section>
        ) : (
          <motion.section
            key="invite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {/* Placeholder — as secções seguintes entram aqui, uma de cada vez */}
            <div className="min-h-screen flex items-center justify-center text-center px-6">
              <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.3em]">
                Próxima secção a caminho
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
