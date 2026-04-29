"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTES AUXILIARES ---

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center space-y-4 mb-20">
    {subtitle && (
      <span className="font-sans text-[10px] uppercase tracking-[0.6em] opacity-40 block italic">
        {subtitle}
      </span>
    )}
    <h2 className="font-serif text-5xl md:text-7xl uppercase tracking-tighter">
      {title}
    </h2>
    <div className="h-px w-16 bg-black mx-auto opacity-10 mt-6"></div>
  </div>
);

// --- TEMPLATE PRINCIPAL ---

export default function LuxuryTemplate() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="relative selection:bg-black selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
        <div className="absolute inset-0 z-0 opacity-60 animate-slow-zoom">
          <img 
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070" 
            alt="Wedding Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          className="z-10 text-center text-[#FDFBF7] px-4 space-y-8"
        >
          <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.8em] font-light">
            O Início do Nosso Sempre
          </p>
          <h1 className="font-serif text-6xl md:text-[10rem] leading-none uppercase tracking-tighter">
            Dmitry <br /> <span className="italic font-light text-4xl md:text-8xl">&</span> Maria
          </h1>
          <div className="space-y-4">
            <p className="font-serif text-xl md:text-2xl italic opacity-90">03 de Outubro de 2026</p>
            <div className="h-12 w-px bg-white/20 mx-auto"></div>
            <p className="font-sans text-[10px] uppercase tracking-widest opacity-60">Lisboa, Portugal</p>
          </div>
        </motion.div>
      </section>

      {/* 2. A NOSSA HISTÓRIA */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <SectionTitle title="A Nossa História" subtitle="Our Story" />
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100 shadow-2xl"
          >
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069" alt="Story" className="w-full h-full object-cover" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="space-y-8"
          >
            <h3 className="font-serif text-4xl italic leading-tight text-neutral-800">
              "Encontrámos no outro o que nem sabíamos que procurávamos."
            </h3>
            <p className="font-sans text-xs leading-loose opacity-70 uppercase tracking-[0.2em] text-justify">
              O nosso caminho cruzou-se de forma inesperada, e desde esse dia, cada momento tem sido 
              uma celebração da vida. Este site é o convite para que faças parte do capítulo mais 
              importante da nossa história.
            </p>
            <div className="pt-10 border-t border-black/5 flex gap-12">
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

      {/* 3. AGENDA */}
      <section className="py-32 bg-[#F8F5F0] px-6">
        <SectionTitle title="O Grande Dia" subtitle="The Celebration" />
        <div className="max-w-3xl mx-auto space-y-12">
          {[
            { t: "16:00", e: "Cerimónia Religiosa", l: "Basílica da Estrela, Lisboa" },
            { t: "18:00", e: "Cocktail & Receção", l: "Quinta do Lago, Sintra" },
            { t: "20:00", e: "Jantar de Gala", l: "Salão Nobre" },
            { t: "23:30", e: "Festa & Open Bar", l: "Pista Principal" }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/5 pb-8 group"
            >
              <div className="font-serif text-5xl italic opacity-20 group-hover:opacity-100 group-hover:text-amber-900 transition-all duration-700">
                {item.t}
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <h4 className="font-sans text-[10px] uppercase tracking-[0.4em] font-bold">{item.e}</h4>
                <p className="font-sans text-[9px] uppercase tracking-widest opacity-40 mt-1">{item.l}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. RSVP FORM */}
      <section className="py-32 bg-[#1a1a1a] text-[#FDFBF7] px-6">
        <div className="max-w-xl mx-auto">
          <SectionTitle title="RSVP" subtitle="Confirmação" />
          <form className="space-y-12">
            <div className="space-y-2 group">
              <label className="font-sans text-[8px] uppercase tracking-[0.5em] opacity-40">Nome Completo</label>
              <input type="text" className="w-full bg-transparent border-b border-white/20 py-4 font-serif text-2xl outline-none focus:border-white transition-all" placeholder="Como devemos chamar-te?" />
            </div>
            <button className="w-full py-6 bg-[#FDFBF7] text-[#1a1a1a] font-sans text-[10px] uppercase tracking-[0.6em] font-bold hover:bg-white transition-all duration-500 shadow-xl">
              Enviar Confirmação
            </button>
          </form>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-32 px-6 max-w-2xl mx-auto">
        <SectionTitle title="Perguntas" subtitle="Informações Úteis" />
        <div className="divide-y divide-black/5">
          {[
            { q: "Qual é o Dress Code?", a: "Sugerimos traje formal (Black Tie opcional)." },
            { q: "Crianças são bem-vindas?", a: "Para esta noite planeámos um evento apenas para adultos." }
          ].map((faq, i) => (
            <div key={i} className="py-8">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex justify-between items-center text-left"
              >
                <span className="font-serif text-2xl italic">{faq.q}</span>
                <span className="text-2xl font-light">{activeFaq === i ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden"
                  >
                    <p className="py-6 font-sans text-[10px] uppercase tracking-[0.2em] opacity-50 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-20 text-center border-t border-black/5">
        <p className="font-sans text-[8px] uppercase tracking-[1.5em] opacity-30">
          Digital Invite Studio — Handcrafted Elegance
        </p>
      </footer>

    </div>
  );
}