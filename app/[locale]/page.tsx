"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Sparkles, 
  Smartphone, 
  Clock, 
  Leaf, 
  ClipboardCheck, 
  Map, 
  Camera, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

// 1. IMPORTAR OS DICIONÁRIOS COM O CAMINHO CORRETO (3 níveis para trás até à raiz)
import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';
const dictionaries = {
  pt: pt,
  en: en
};

export default function HomePage() {
  const params = useParams();
  
  // 2. DESCOBRIR A LÍNGUA (se não existir ou for inválida, assume 'pt')
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.HomePage || dictionaries.pt.HomePage;

  return (
    <div className="bg-[#FDFBF7] text-[#332E2B] selection:bg-[#630100] selection:text-[#EFDFBB] font-montserrat overflow-hidden">
      
      {/* --- 1. HERO SECTION (IMPACTO IMEDIATO) --- */}
      <section className="relative pt-40 pb-20 px-6 md:px-20 min-h-[95vh] flex flex-col justify-center max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-10 z-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFDFBB]/30 border border-[#EFDFBB] text-[10px] font-bold uppercase tracking-widest text-[#630100] shadow-sm mx-auto lg:mx-0">
              <Sparkles size={14} />
              <span>{dict.hero.tag}</span>
            </div>
            
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-[#332E2B] tracking-tight">
              {dict.hero.title1} <br className="hidden md:block"/>
              <span className="italic text-[#630100]">{dict.hero.title2}</span>
            </h1>

            <p className="text-[#332E2B] text-lg leading-relaxed opacity-75 font-normal max-w-lg mx-auto lg:mx-0">
              {dict.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start pt-4">
              <Link href={`/${locale}/pricing`}>
                <button className="w-full sm:w-auto bg-[#630100] text-[#EFDFBB] border-2 border-[#630100] px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full shadow-xl hover:bg-transparent hover:text-[#630100] transition-all duration-500 transform hover:-translate-y-1">
                  {dict.hero.btn1}
                </button>
              </Link>
              <Link href={`/${locale}/features`}>
                <button className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold text-[#332E2B] hover:text-[#630100] transition-colors">
                  {dict.hero.btn2}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="w-full lg:w-1/2 relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* COMPOSIÇÃO DE IMAGENS HERO */}
            <div className="relative w-[300px] md:w-[400px] h-[450px] md:h-[550px]">
              <div className="absolute inset-0 bg-[#EFDFBB] rounded-[2.5rem] rotate-[-4deg] scale-105 opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-2">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center rounded-[1.5rem] opacity-90 grayscale-[10%]"></div>
              </div>
              {/* Badge Flutuante */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 md:-left-16 bg-white p-6 rounded-3xl shadow-2xl border border-gray-50 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.hero.floatingBadge}</p>
                  <p className="font-serif text-lg text-[#332E2B]">{dict.hero.floatingText}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- 2. O PRODUTO CORE (VENDER O WEBSITE) --- */}
      <section className="bg-white py-32 px-6 md:px-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 relative aspect-[3/4] rounded-[2.5rem] bg-[#F4F5F7] overflow-hidden shadow-inner flex items-center justify-center border-2 border-dashed border-gray-200"
          >
            {/* SUBSTITUIR POR MOCKUPS DE TELEMÓVEIS COM OS VOSSOS SITES */}
            <p className="text-gray-400 text-sm font-medium text-center px-8">
              {dict.core.promo}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 space-y-8 text-center lg:text-left"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B] leading-tight">
              {dict.core.title1} <span className="italic text-[#630100]">{dict.core.title2}</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {dict.core.desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-left">
              {[
                { icon: <Smartphone size={20} className="text-[#630100]"/>, title: dict.core.features[0].title, desc: dict.core.features[0].desc },
                { icon: <Clock size={20} className="text-[#630100]"/>, title: dict.core.features[1].title, desc: dict.core.features[1].desc },
                { icon: <Leaf size={20} className="text-[#630100]"/>, title: dict.core.features[2].title, desc: dict.core.features[2].desc },
                { icon: <Sparkles size={20} className="text-[#630100]"/>, title: dict.core.features[3].title, desc: dict.core.features[3].desc },
              ].map((item, i) => (
                <div key={i} className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#EFDFBB]/30 hover:shadow-md transition-shadow">
                  <div className="mb-3">{item.icon}</div>
                  <h4 className="font-bold text-[#332E2B] text-sm mb-2">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- 3. O ECOSSISTEMA (FUNCIONALIDADES DE VALOR ACRESCENTADO) --- */}
      <section className="py-32 px-6 md:px-20 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="font-serif text-4xl md:text-5xl text-[#332E2B]">{dict.eco.title1} <br/> <span className="italic text-[#630100]">{dict.eco.title2}</span></h2>
          <p className="text-gray-500 text-lg">{dict.eco.desc}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: <ClipboardCheck size={32} strokeWidth={1.5} />, 
              title: dict.eco.cards[0].title, 
              desc: dict.eco.cards[0].desc 
            },
            { 
              icon: <Map size={32} strokeWidth={1.5} />, 
              title: dict.eco.cards[1].title, 
              desc: dict.eco.cards[1].desc 
            },
            { 
              icon: <Camera size={32} strokeWidth={1.5} />, 
              title: dict.eco.cards[2].title, 
              desc: dict.eco.cards[2].desc 
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#EFDFBB] transition-all duration-500 text-center group"
            >
              <div className="w-20 h-20 mx-auto bg-[#FDFBF7] rounded-full flex items-center justify-center text-[#630100] mb-6 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="font-serif text-2xl text-[#332E2B] mb-4">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href={`/${locale}/features`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#630100] hover:text-black transition-colors border-b-2 border-[#630100] pb-1">
            {dict.eco.link} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* --- 4. COMO FUNCIONA (PASSO A PASSO) --- */}
      <section className="bg-[#332E2B] py-32 px-6 md:px-20 text-center border-y border-[#630100]/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl text-[#EFDFBB] italic mb-20">{dict.steps.title}</h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-[#EFDFBB]/20"></div>
            
            {(dict.steps.items as any[]).map((s: any, i: number) => (
              <div key={i} className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto bg-[#332E2B] border border-[#EFDFBB]/30 text-[#EFDFBB] rounded-full flex items-center justify-center font-serif text-3xl italic shadow-2xl">
                  {s.step}
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">{s.title}</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. CTA FINAL --- */}
      <section className="bg-[#EFDFBB]/20 pt-32 pb-40 px-6 md:px-20 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-10 bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border border-white"
        >
          <div className="w-16 h-1 bg-[#630100] mx-auto opacity-50"></div>
          <h2 className="font-serif text-4xl md:text-5xl italic text-[#332E2B]">{dict.cta.title}</h2>
          <p className="text-gray-600 text-lg">{dict.cta.desc}</p>
          <div className="pt-6">
            <Link href={`/${locale}/pricing`}>
               <button className="bg-[#630100] text-[#EFDFBB] px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-[#4a0100] shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                 {dict.cta.btn}
               </button>
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}