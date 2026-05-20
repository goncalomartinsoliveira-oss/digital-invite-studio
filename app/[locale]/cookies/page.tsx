"use client";
import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function CookiesPolicyPage() {
  const params = useParams();
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.CookiesPolicyPage || dictionaries.pt.CookiesPolicyPage;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#722F37] mb-4">{dict.title}</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">{dict.lastUpdate}</p>
        </div>

        <div className="text-gray-600 leading-relaxed">
          
          <p className="mb-8 font-medium">{dict.intro}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{dict.sections.s1_title}</h2>
          <p className="mb-8">{dict.sections.s1_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{dict.sections.s2_title}</h2>
          <p className="mb-4">{dict.sections.s2_desc}</p>
          <ul className="list-disc pl-6 space-y-4 mb-8 marker:text-[#722F37]">
            {(dict.sections.s2_items as any[]).map((item, idx) => (
              <li key={idx}>
                <strong className="text-gray-800">{item.bold}</strong>{item.text}
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{dict.sections.s3_title}</h2>
          <p className="mb-8">{dict.sections.s3_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{dict.sections.s4_title}</h2>
          <p className="mb-8">{dict.sections.s4_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{dict.sections.s5_title}</h2>
          <p className="mb-8">{dict.sections.s5_desc}</p>

          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-serif text-xl text-gray-800 mb-2">{dict.footerBox.title}</h3>
            <p className="text-sm">
              {dict.footerBox.text}
              <a href="mailto:privacy@digitalinvite.studio" className="text-[#722F37] font-bold hover:underline">
                privacy@digitalinvite.studio
              </a>.
            </p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}