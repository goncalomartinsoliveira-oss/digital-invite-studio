"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BUNDLES, bundleSavingsCents, cheapestModulePriceCents } from "@/lib/pricing";
import { formatPriceCents } from "@/lib/checkout";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

export default function PricingPage() {
  const params = useParams();
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.PricingPage || dictionaries.pt.PricingPage;
  const bundleDict = dictionaries[locale]?.BundleOffers || dictionaries.pt.BundleOffers;
  const moduleNames = dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames;

  // Os pacotes (nome, módulos e preços) vêm sempre de lib/pricing.ts — a
  // mesma fonte usada no checkout real — para esta página nunca mostrar
  // valores diferentes dos que são realmente cobrados.
  const plans = BUNDLES.map(bundle => {
    const meta = (bundleDict.bundles as Record<string, { name: string; desc: string }>)[bundle.id];
    return {
      id: bundle.id,
      name: meta?.name || bundle.id,
      description: meta?.desc || "",
      price: formatPriceCents(bundle.priceCents, locale),
      savings: bundleSavingsCents(bundle),
      features: bundle.moduleIds.map(m => (moduleNames as Record<string, string>)[m]),
      highlight: bundle.id === "completo",
    };
  });

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 px-6 font-sans">
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

        {/* Grelha de Pacotes */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
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
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-serif text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/evento</span>
                </div>
                {plan.savings > 0 && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2.5 py-1 rounded-md mt-1 mb-3">
                    {bundleDict.savingsLabel} {formatPriceCents(plan.savings, locale)}
                  </span>
                )}
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
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

              <Link
                href={`/${locale}/dashboard`}
                className={`w-full text-center py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  plan.highlight
                  ? "bg-[#722F37] text-white shadow-lg hover:bg-[#5a252b] hover:scale-[1.02]"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {dict.startBtn}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Nota: compra à peça */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-gray-500 text-sm mt-12 max-w-xl mx-auto"
        >
          {dict.alaCarteDesc.replace("{price}", formatPriceCents(cheapestModulePriceCents(), locale))}
        </motion.p>

        {/* Secção White Label / B2B */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm text-center"
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
