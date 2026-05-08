"use client";
import { motion } from "framer-motion";
import { Mail, Phone, Camera, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Cabeçalho */}
        <div className="mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif text-[#332E2B] mb-6"
          >
            Vamos falar sobre o <br />
            <span className="italic text-[#722F37]">vosso grande dia.</span>
          </motion.h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Têm alguma dúvida ou precisam de uma solução personalizada? Estamos aqui para garantir que a vossa experiência digital seja perfeita.
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">E-mail</p>
                  <p className="text-lg text-[#332E2B]">hello@digitalinvitestudio.com</p>
                </div>
              </div>

              {/* Telefone */}
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-[#722F37] group-hover:text-white transition-all">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">WhatsApp</p>
                  <p className="text-lg text-[#332E2B]">+351 912 345 678</p>
                </div>
              </div>

              {/* Instagram (Usando ícone Camera para evitar erro de export) */}
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-[#722F37] group-hover:text-white transition-all">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Instagram</p>
                  <p className="text-lg text-[#332E2B]">@digitalinvitestudio</p>
                </div>
              </div>
            </div>

            {/* Caixa de Horário */}
            <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-serif text-2xl italic text-[#722F37]">Horário de Atendimento</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Segunda a Sexta: 09h00 — 18h00 <br />
                Sábados: Apenas por marcação (consultoria de design).
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">O Vosso Nome</label>
                  <input type="text" className="w-full bg-[#FDFBF7] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm" placeholder="Ana e Pedro" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                  <input type="email" className="w-full bg-[#FDFBF7] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm" placeholder="ana@email.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Assunto</label>
                <select className="w-full bg-[#FDFBF7] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm appearance-none cursor-pointer">
                  <option>Dúvida Geral</option>
                  <option>Pedido de Orçamento Personalizado</option>
                  <option>Suporte Técnico</option>
                  <option>Parceria White Label</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Mensagem</label>
                <textarea rows={5} className="w-full bg-[#FDFBF7] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#722F37]/20 transition-all outline-none text-sm resize-none" placeholder="Como podemos ajudar?"></textarea>
              </div>

              <button className="w-full bg-[#722F37] text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg hover:bg-[#332E2B] transition-all flex items-center justify-center gap-3 group">
                Enviar Mensagem
                <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}