"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Camera, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useBrand } from "@/components/site/BrandProvider";

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
  const brand = useBrand();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(dict.form.options[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

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
            <span className="italic text-brand">{dict.title2}</span>
          </motion.h1>
          <p className="text-gray-500 text-lg max-w-xl">
            {dict.desc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20">
          
          {/* Informações de Contacto (ocultas para marcas parceiras — usam o seu próprio site) */}
          {!brand.contactUrl && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              {/* Email */}
              <a
                href="mailto:hello@digitalinvitestudio.com"
                className="flex items-center gap-6 group rounded-3xl -mx-3 px-3 py-2 hover:bg-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.channels.email}</p>
                  <p className="text-lg text-ink group-hover:text-brand transition-colors">hello@digitalinvitestudio.com</p>
                </div>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/digitalinvitestudio.official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 group rounded-3xl -mx-3 px-3 py-2 hover:bg-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all shrink-0">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.channels.instagram}</p>
                  <p className="text-lg text-ink group-hover:text-brand transition-colors">@digitalinvitestudio.official</p>
                </div>
              </a>
            </div>

            {/* Caixa de Horário */}
            <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-serif text-2xl italic text-brand">{dict.schedule.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {dict.schedule.hours} <br />
                {dict.schedule.saturday}
              </p>
            </div>
          </motion.div>
          )}

          {/* Formulário de Contacto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-gray-50"
          >
            {status === "sent" && !brand.contactUrl ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-brand/5 flex items-center justify-center text-brand mx-auto mb-6">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-2">{dict.sent.title}</h3>
                <p className="text-gray-500 text-sm mb-8">{dict.sent.message}</p>
                <button
                  onClick={() => { setStatus("idle"); setName(""); setEmail(""); setMessage(""); setSubject(dict.form.options[0]); }}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand hover:text-ink transition-colors"
                >
                  {dict.sent.newMessageBtn}
                </button>
              </div>
            ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelName}</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm" placeholder={dict.form.placeholderName} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelEmail}</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm" placeholder={dict.form.placeholderEmail} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelSubject}</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm appearance-none cursor-pointer">
                  {(dict.form.options as string[]).map((option, idx) => (
                    <option key={idx}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">{dict.form.labelMessage}</label>
                <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-cream border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm resize-none" placeholder={dict.form.placeholderMessage}></textarea>
              </div>

              {status === "error" && (
                <p className="text-[12px] text-red-500 text-center">{dict.form.errorMessage}</p>
              )}

              {brand.contactUrl ? (
                <a
                  href={brand.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-brand text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-3 group"
                >
                  {dict.form.btnSubmit}
                  <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              ) : (
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-brand text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg hover:bg-ink transition-all flex items-center justify-center gap-3 group disabled:opacity-60"
                >
                  {status === "sending" ? (
                    <>{dict.form.btnSending} <Loader2 size={14} className="animate-spin" /></>
                  ) : (
                    <>{dict.form.btnSubmit} <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                  )}
                </button>
              )}
            </form>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}