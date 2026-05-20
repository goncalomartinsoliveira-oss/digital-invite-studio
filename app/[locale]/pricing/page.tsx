"use client";
import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

export default function PricingPage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.PricingPage || dictionaries.pt.PricingPage;

  const plans = [
    {
      name: dict.plans.essential.name,
      price: dict.plans.essential.price,
      description: dict.plans.essential.desc,
      features: dict.plans.essential.features,
      buttonText: dict.plans.essential.btn,
      highlight: false,
    },
    {
      name: dict.plans.premium.name,
      price: dict.plans.premium.price,
      description: dict.plans.premium.desc,
      features: dict.plans.premium.features,
      buttonText: dict.plans.premium.btn,
      highlight: true,
    },
    {
      name: dict.plans.luxury.name,
      price: dict.plans.luxury.price,
      description: dict.plans.luxury.desc,
      features: dict.plans.luxury.features,
      buttonText: dict.plans.luxury.btn,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho da Página */}
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-[#722F37] mb-6"
          >
            {dict.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto text-lg"
          >
            {dict.desc}
          </motion.p>
        </div>

        {/* Grelha de Preços */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 ${
                plan.highlight 
                ? "bg-white border-2 border-[#722F37] shadow-2xl scale-105 z-10" 
                : "bg-white border border-gray-100 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#722F37] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-md">
                  {dict.bestseller}
                </div>
              )}

              <div className="mb-8">
                <h3 className={`font-serif text-2xl mb-2 ${plan.highlight ? "text-[#722F37]" : "text-gray-800"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-serif text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/evento</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature: string) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? "bg-[#722F37] text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  plan.highlight
                  ? "bg-[#722F37] text-white shadow-lg hover:bg-[#5a252b] hover:scale-[1.02]"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Secção White Label / B2B */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-gray-800 mb-4">{dict.b2b.title}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {dict.b2b.desc}
            </p>
            <a 
              href={`/${locale}/contact`} 
              className="inline-block border-b-2 border-[#722F37] pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-800 hover:text-[#722F37] transition-colors"
            >
              {dict.b2b.link}
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}