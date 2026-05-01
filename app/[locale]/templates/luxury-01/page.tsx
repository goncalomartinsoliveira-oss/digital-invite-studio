"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Definição da estrutura de dados (TypeScript)
interface LuxuryProps {
  data?: {
    groom_name: string;
    bride_name: string;
    event_date: string;
    location_name: string;
    story_text?: string;
    main_image_url?: string; // Campo para a foto dinâmica
  };
}

export default function LuxuryTemplate({ data }: LuxuryProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // 2. Variáveis com nomes reais ou padrão (Fallback)
  const groom = data?.groom_name || "Dmitry";
  const bride = data?.bride_name || "Maria";
  const location = data?.location_name || "Lisboa, Portugal";
  
  const formattedDate = data?.event_date 
    ? new Date(data.event_date).toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })
    : "03 de Outubro de 2026";

  // 3. Configuração da animação com "as const" para evitar erros de TS
  const fadeIn = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { 
      duration: 1, 
      ease: "easeOut" as const 
    }
  };

  return (
    <div className="relative bg-[#FDFBF7] text-[#1a1a1a] min-h-screen selection:bg-black selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 opacity-50 animate-slow-zoom">
          <img 
            // Lógica dinâmica: Usa a foto do Supabase ou a padrão do Unsplash
            src={data?.main_image_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070"} 
            alt="Casamento" 
            className="w-full h-full object-cover"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="z-10 text-center text-[#FDFBF7] px-4 space-y-8"
        >
          <p className="font-sans text-xs uppercase tracking-[0.8em]">The Wedding of</p>
          <h1 className="font-serif text-6xl md:text-[11rem] leading-none uppercase tracking-tighter">
            {groom} <br /> <span className="italic font-light text-4xl md:text-8xl">&</span> {bride}
          </h1>
          <div className="space-y-4">
            <p className="font-serif text-2xl italic">{formattedDate}</p>
            <div className="h-12 w-px bg-white/20 mx-auto"></div>
            <p className="font-sans text-[10px] uppercase tracking-widest opacity-60">{location}</p>
          </div>
        </motion.div>
      </section>

      {/* --- NOSSA HISTÓRIA --- */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] opacity-40 block italic">Our Journey</span>
          <h2 className="font-serif text-5xl md:text-7xl uppercase tracking-tighter">A Nossa História</h2>
          <div className="h-px w-16 bg-black mx-auto opacity-10 mt-6"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeIn} className="aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100 shadow-xl">
            <img 
              // DICA: Também podes tornar esta imagem dinâmica no futuro se quiseres!
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069" 
              alt="Casal" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
          <motion.div {...fadeIn} className="space-y-8">
            <h3 className="font-serif text-4xl italic text-neutral-800">"Foi o melhor sim das nossas vidas..."</h3>
            <p className="font-sans text-sm leading-loose opacity-70 uppercase tracking-widest text-justify">
              {data?.story_text || "O que começou com uma simples conversa transformou-se numa vida de aventuras. Ao longo destes anos, construímos um caminho de cumplicidade, risos e um amor que agora celebramos com quem mais gostamos."}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-10 border-t border-black/5">
              <div>
                <span className="block font-serif text-3xl">2018</span>
                <span className="font-sans text-[8px] uppercase tracking-widest opacity-40">O Encontro</span>
              </div>
              <div>
                <span className="block font-serif text-3xl">2026</span>
                <span className="font-sans text-[8px] uppercase tracking-widest opacity-40">O Sim</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- RSVP --- */}
      <section className="py-32 bg-black text-white px-6">
        <div className="max-w-xl mx-auto space-y-16 text-center">
          <h2 className="font-serif text-5xl md:text-7xl uppercase tracking-tighter">RSVP</h2>
          <p className="font-sans text-xs uppercase tracking-widest opacity-60">Por favor, confirmem a vossa presença até 01 de Setembro.</p>
          <button className="px-12 py-5 border border-white/20 rounded-full font-sans text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-700 w-full md:w-auto">
            Confirmar Presença
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 text-center border-t border-black/5">
        <p className="font-sans text-[8px] uppercase tracking-[1.5em] opacity-30">
          {groom} & {bride} — 2026
        </p>
      </footer>

    </div>
  );
}