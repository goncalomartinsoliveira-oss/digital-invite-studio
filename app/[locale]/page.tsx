"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-[#FDFBF7] text-[#332E2B] selection:bg-[#630100] selection:text-[#EFDFBB] font-montserrat">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-20 px-8 md:px-20 min-h-[90vh] flex flex-col md:flex-row items-center gap-20 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="md:w-1/2 space-y-10"
        >
          {/* Título Principal com Cormorant Garamond */}
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-[#332E2B] tracking-tight font-medium">
            Criamos experiências digitais <br/>
            <span className="italic text-[#630100] font-normal italic">que contam histórias únicas.</span>
          </h1>

          <div className="space-y-6 max-w-md text-left">
            <p className="text-[#332E2B] text-lg leading-relaxed opacity-70 font-normal">
              Websites de eventos que refletem o essencial: a vossa história. Cada detalhe é pensado para criar uma experiência memorável e sofisticada.
            </p>
            <div className="h-px w-20 bg-[#630100]/30"></div>
          </div>

          <div className="flex justify-start">
            <Link href="/pricing">
              <button className="bg-[#630100] text-[#EFDFBB] border-2 border-[#630100] px-12 py-5 text-[11px] uppercase tracking-[0.3em] font-semibold rounded-full shadow-xl hover:bg-transparent hover:text-[#630100] transition-all duration-500 transform hover:-translate-y-1">
                Criar o Vosso Convite
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="md:w-1/2 relative w-full"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="aspect-[4/5] bg-[#EFDFBB] relative overflow-hidden shadow-2xl rounded-[2rem]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale-[10%] opacity-90"></div>
            <div className="absolute inset-0 bg-[#630100]/5"></div>
            
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FDFBF7] rounded-full flex items-center justify-center border border-[#EFDFBB] shadow-xl">
              <span className="font-serif text-3xl tracking-widest text-[#332E2B] font-light">DIS</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- MISSION STRIP --- */}
      <section className="bg-[#332E2B] py-24 w-full border-y border-[#630100]/10">
        <h2 className="font-serif text-3xl md:text-[2.5vw] text-[#EFDFBB] uppercase italic tracking-[0.1em] text-center opacity-90 px-4 font-light leading-none">
          Curating digital wedding experiences —
        </h2>
      </section>

      {/* --- SERVICES / FEATURES --- */}
      <section className="py-32 px-8 md:px-20 grid md:grid-cols-3 gap-16 text-left max-w-7xl mx-auto">
        {[
          { title: "Design Editorial", desc: "Templates inspirados em revistas de luxo e tipografia clássica Cormorant Garamond.", step: "01" },
          { title: "RSVP Inteligente", desc: "Gestão de convidados simplificada com confirmação automática e em tempo real.", step: "02" },
          { title: "Personalização", desc: "Cada cor e cada detalhe adaptado à identidade visual única do vosso casamento.", step: "03" }
        ].map((service) => (
          <div key={service.step} className="group space-y-6">
            <span className="font-serif text-5xl text-[#630100] italic opacity-20 group-hover:opacity-100 transition-opacity duration-700">{service.step}</span>
            <h3 className="font-serif text-2xl uppercase tracking-[0.15em] text-[#332E2B]">{service.title}</h3>
            <p className="text-sm text-[#332E2B] opacity-60 leading-relaxed font-normal">{service.desc}</p>
            <div className="h-[1px] w-full bg-[#EFDFBB] group-hover:bg-[#630100] transition-colors duration-500"></div>
          </div>
        ))}
      </section>

      {/* --- CTA FINAL --- */}
      <section className="bg-[#EFDFBB]/30 pt-20 pb-40 px-8 md:px-20 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-serif text-4xl md:text-5xl italic text-[#332E2B]">Prontos para digitalizar a vossa história?</h2>
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 font-semibold text-[#630100] font-montserrat">Elegância e sofisticação em cada clique.</p>
          <div className="flex justify-center pt-4">
            <Link href="/contact">
               <button className="bg-[#630100] text-[#EFDFBB] border-2 border-[#630100] px-12 py-4 text-[11px] uppercase tracking-[0.3em] font-semibold rounded-full hover:bg-transparent hover:text-[#630100] shadow-lg transition-all duration-500 transform hover:scale-105 font-montserrat">
                 Falar com um especialista
               </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}