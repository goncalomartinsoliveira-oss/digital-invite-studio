"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F0E9E3] text-[#332E2B] selection:bg-[#72393F] selection:text-[#F0E9E3]">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed w-full z-50 px-4 md:px-8 py-4 flex justify-between items-center bg-[#F0E9E3]/90 backdrop-blur-md border-b border-[#332E2B]/5">
        <div className="flex items-center">
          <img 
            src="/logo-dis.svg" 
            alt="Digital Invite Studio" 
            className="h-12 md:h-20 w-auto py-2" 
          />
        </div>

        {/* --- MENU DESKTOP (Escondido em Mobile) --- */}
        <div className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-[0.2em] font-bold">
          <a href="#" className="hover:text-[#72393F] transition-colors">Portfólio</a>
          <a href="#" className="hover:text-[#72393F] transition-colors">A Experiência</a>
          <a href="#" className="hover:text-[#72393F] transition-colors">Preços</a>
        </div>

        {/* --- BOTÕES LADO DIREITO (Visíveis em Mobile e Desktop) --- */}
        <div className="flex items-center gap-4 md:gap-8">
          <Link 
            href="/pt/login" 
            className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold hover:text-[#72393F] transition-colors"
          >
            Login
          </Link>
          
          {/* BOTÃO DA NAV EM VINHO */}
          <button className="bg-[#72393F] text-[#F0E9E3] px-4 md:px-8 py-3 text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-[#332E2B] transition-all duration-500 shadow-sm whitespace-nowrap">
            Começar Agora
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-20 px-8 md:px-20 min-h-screen flex flex-col md:flex-row items-center gap-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="md:w-1/2 space-y-10"
        >
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-[#332E2B]">
            Criamos experiências digitais <br/>
            <span className="italic text-[#72393F] font-semibold">que contam histórias únicas.</span>
          </h1>
          <div className="space-y-6 max-w-md text-left">
            <p className="font-sans text-[#332E2B] text-lg leading-relaxed opacity-80">
              Websites de eventos que refletem o essencial: a vossa história. Cada detalhe é pensado para criar uma experiência memorável.
            </p>
            <div className="h-px w-20 bg-[#AD9D8D]"></div>
          </div>
          <div className="flex justify-start">
            <button className="bg-[#72393F] text-[#F0E9E3] px-12 py-5 text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl hover:bg-[#332E2B] transition-all duration-500 transform hover:-translate-y-1">
              Criar o Vosso Convite
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="md:w-1/2 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="aspect-[4/5] bg-[#D0C8BD] relative overflow-hidden shadow-2xl">
            {/* Imagem de Contexto */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale-[20%]"></div>
            
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#F0E9E3] rounded-full flex items-center justify-center border border-[#AD9D8D] shadow-xl">
              <span className="font-serif text-2xl tracking-tighter text-[#332E2B]">DIS</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- MISSION STRIP --- */}
      <section className="bg-[#332E2B] py-24">
        <h2 className="font-serif text-3xl md:text-[3vw] text-[#F0E9E3] uppercase italic tracking-tighter text-center opacity-80 px-4">
          Curating digital wedding experiences —
        </h2>
      </section>

      {/* --- SERVICES / FEATURES --- */}
      <section className="py-32 px-8 md:px-20 grid md:grid-cols-3 gap-16 text-left">
        {[
          { title: "Design Editorial", desc: "Templates inspirados em revistas de moda e tipografia clássica.", step: "01" },
          { title: "RSVP Inteligente", desc: "Gestão de convidados simplificada com confirmação em tempo real.", step: "02" },
          { title: "Personalização", desc: "Cada cor e cada detalhe adaptado à identidade do vosso casamento.", step: "03" }
        ].map((service) => (
          <div key={service.step} className="group space-y-6">
            <span className="font-serif text-4xl text-[#72393F] italic opacity-30 group-hover:opacity-100 transition-opacity duration-500">{service.step}</span>
            <h3 className="font-serif text-2xl uppercase tracking-widest">{service.title}</h3>
            <p className="font-sans text-sm text-[#332E2B] opacity-60 leading-relaxed">{service.desc}</p>
            <div className="h-px w-full bg-[#D9D9D9] group-hover:bg-[#72393F] transition-colors duration-500"></div>
          </div>
        ))}
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#F0E9E3] border-t border-[#AD9D8D]/30 pt-32 pb-12 px-8 md:px-20 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <img src="/logo-dis.svg" alt="Digital Invite Studio" className="h-16 w-auto mx-auto opacity-60" />
          <h2 className="font-serif text-4xl italic">Prontos para digitalizar a vossa história?</h2>
          <div className="flex justify-center pt-4">
             <button className="bg-[#72393F] text-[#F0E9E3] px-10 py-4 text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-[#332E2B] transition-all">
               Falar com um especialista
             </button>
          </div>
          <p className="font-sans text-[10px] uppercase tracking-[0.5em] opacity-40 pt-8">digital invite studio © 2026</p>
        </div>
      </footer>
    </div>
  );
}