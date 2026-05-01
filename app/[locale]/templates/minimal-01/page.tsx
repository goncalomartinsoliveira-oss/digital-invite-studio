"use client";

import React from "react";
import { motion } from "framer-motion";

// 1. Interface Completa (Para não dar erro nos nomes)
interface MinimalProps {
  data?: {
    groom_name: string;
    bride_name: string;
    event_date: string;
    location_name: string;
    story_text?: string;
    main_image_url?: string;
  };
}

export default function MinimalTemplate({ data }: MinimalProps) {
  const groom = data?.groom_name || "Dmitry";
  const bride = data?.bride_name || "Maria";
  
  // 2. Correção do erro do toLocaleDateString
  const formattedDate = data?.event_date 
    ? new Date(data.event_date).toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' // <-- Corrigido aqui: era '2026' e deve ser 'numeric'
      })
    : "03.10.2026";

  return (
    <div className="bg-white text-zinc-900 min-h-screen font-sans selection:bg-zinc-100">
      {/* HEADER MINIMALISTA */}
      <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-50 text-[10px] uppercase tracking-[0.3em] mix-blend-difference text-white">
        <span>{groom.charAt(0)} & {bride.charAt(0)}</span>
        <span>{formattedDate}</span>
      </nav>

      {/* HERO SECTION */}
      <section className="h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-8xl font-light tracking-tighter uppercase italic">
            {groom} <span className="not-italic text-zinc-300">+</span> {bride}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-400 font-bold">Save the Date</p>
        </motion.div>

        <motion.div 
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          whileInView={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 2, delay: 0.2 }}
          className="mt-20 w-full max-w-lg aspect-[3/4] bg-zinc-100 overflow-hidden shadow-2xl"
        >
          <img 
            src={data?.main_image_url || "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070"} 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            alt="Casal"
          />
        </motion.div>
      </section>

      {/* INFO SECTION */}
      <section className="py-40 px-6 max-w-2xl mx-auto text-center space-y-12">
        <h2 className="text-xs uppercase tracking-[0.4em] text-zinc-400">O Evento</h2>
        <div className="space-y-2">
          <p className="text-2xl font-light tracking-wide">{data?.location_name || "Lisboa, Portugal"}</p>
          <p className="text-zinc-400 font-light text-[11px] uppercase tracking-widest italic">{formattedDate}</p>
        </div>
        <div className="h-px w-12 bg-zinc-200 mx-auto my-10"></div>
        <p className="text-sm leading-relaxed text-zinc-500 font-light max-w-md mx-auto text-justify uppercase tracking-tighter">
          {data?.story_text || "Uma celebração íntima para marcar o início de um novo capítulo nas nossas vidas. Contamos convosco."}
        </p>
      </section>

      {/* RSVP BOTÃO */}
      <section className="pb-40 text-center">
        <button className="px-10 py-5 bg-zinc-900 text-white text-[9px] uppercase tracking-[0.4em] hover:bg-zinc-700 transition-all duration-500 shadow-xl active:scale-95">
          Confirmar Presença
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center border-t border-zinc-100">
         <p className="text-[8px] uppercase tracking-[0.8em] text-zinc-300 italic">{groom} + {bride}</p>
      </footer>
    </div>
  );
}