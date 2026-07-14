"use client";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

export default function TermsAndConditionsPage() {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.TermsPage || dictionaries.pt.TermsPage;
  const s = dict.sections;

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 px-6 font-sans">
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

          <p className="mb-8 font-medium italic">{dict.intro}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s1_title}</h2>
          <p className="mb-8">{s.s1_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s2_title}</h2>
          <p className="mb-4">{s.s2_desc}</p>
          <ul className="list-disc pl-6 space-y-3 mb-4 marker:text-[#722F37]">
            {(s.s2_items as { prefix: string; bold: string; text: string }[]).map((item, idx) => (
              <li key={idx}>
                {item.prefix}
                {item.bold && <strong>{item.bold}</strong>}
                {item.text}
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s3_title}</h2>
          <p className="mb-8">{s.s3_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s4_title}</h2>
          <p className="mb-8">{s.s4_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s5_title}</h2>
          <p className="mb-8">{s.s5_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s6_title}</h2>
          <p className="mb-8">
            {s.s6_prefix}
            <strong className="text-gray-800">{s.s6_bold}</strong>
            {s.s6_suffix}
          </p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s7_title}</h2>
          <p className="mb-8">{s.s7_desc}</p>

          <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-serif text-xl text-gray-800 mb-2">{dict.footerBox.title}</h3>
            <p className="text-sm">
              {dict.footerBox.text}
              <a href="mailto:legal@digitalinvite.studio" className="text-[#722F37] font-bold hover:underline">
                legal@digitalinvite.studio
              </a>.
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
