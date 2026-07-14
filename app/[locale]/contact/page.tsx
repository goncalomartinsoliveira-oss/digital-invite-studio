"use client";
import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Phone, Camera, Send } from "lucide-react";

// 1. IMPORTAR OS DICIONÁRIOS COM OS 3 NÍVEIS CORRETOS PARA TRÁS
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function ContactPage() {
  const params = useParams();
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.ContactPage || dictionaries.pt.ContactPage;

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Cabeçalho */}
        <div className="mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif text-ink mb-6"
          >
            {dict.title1} <br />
            <span className="italic text-[#722F37]">{dict.title2}</span>
          </motion.h1>
          <p className="text-gray-500 text-lg max-w-xl">
            {dict.desc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20">
          
          {/* Informações de Contacto */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            <div className="space-y-8">
              {/* Email */}
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-[#722F37] group-hover:text-white transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.channels.email}</p>
                  <p className="text-lg text-ink">hello@digitalinvitestudio.com</p>
                </div>
              </div>

              {/* Telefone */}
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-[#722F37] group-hover:text-white transition-all">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.channels.whatsapp}</p>
                  <p className="text-lg text-ink">+351 912 345 678</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-[#722F37] group-hover:text-white transition-all">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.channels.instagram}</p>
                  <p className="text-lg text-ink">@digitalinvitestudio</p>
                </div>
              </div>
            </div>

            {/* Caixa de Horário */}
            <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-serif text-2xl italic text-[#722F37]">{dict.schedule.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {dict.schedule.hours} <br />
                {dict.schedule.saturday}
              </p>
            </div>
          </motion.div>

          {/* Formulário de Contacto */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-gray-50"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelName}</label>
                  <input type="text" className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm" placeholder={dict.form.placeholderName} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelEmail}</label>
                  <input type="email" className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm" placeholder={dict.form.placeholderEmail} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelSubject}</label>
                <select className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm appearance-none cursor-pointer">
                  {(dict.form.options as string[]).map((option, idx) => (
                    <option key={idx}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelMessage}</label>
                <textarea rows={5} className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm resize-none" placeholder={dict.form.placeholderMessage}></textarea>
              </div>

              <button className="w-full bg-[#722F37] text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-3 group">
                {dict.form.btnSubmit}
                <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}