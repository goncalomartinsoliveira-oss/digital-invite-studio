"use client";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";

import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = { pt, en };

export default function PrivacyPolicyPage() {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const dict = dictionaries[locale]?.PrivacyPolicyPage || dictionaries.pt.PrivacyPolicyPage;
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

          <p className="mb-8">{dict.intro}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s1_title}</h2>
          <p className="mb-4">{s.s1_desc}</p>
          <ul className="list-disc pl-6 space-y-3 mb-8 marker:text-[#722F37]">
            {(s.s1_items as { bold: string; text: string }[]).map((item, idx) => (
              <li key={idx}>
                <strong>{item.bold}</strong>{item.text}
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s2_title}</h2>
          <p className="mb-8">{s.s2_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s3_title}</h2>
          <p className="mb-8">
            {s.s3_prefix}
            <strong className="text-gray-800">{s.s3_bold}</strong>
            {s.s3_suffix}
          </p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s4_title}</h2>
          <p className="mb-8">{s.s4_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s5_title}</h2>
          <p className="mb-8">{s.s5_desc}</p>

          <h2 className="text-2xl font-serif text-[#722F37] mt-12 mb-4">{s.s6_title}</h2>
          <p className="mb-8">
            {s.s6_desc}
            <Link href={`/${locale}/contact`} className="text-[#722F37] font-bold hover:underline">
              {dict.contactLinkText}
            </Link>.
          </p>

        </div>
      </motion.div>
    </div>
  );
}
