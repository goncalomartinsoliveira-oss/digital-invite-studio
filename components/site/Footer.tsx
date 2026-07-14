"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 1. IMPORTAR OS DICIONÁRIOS
import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';
import type { Brand } from '../../lib/brands';

const dictionaries = {
  pt: pt,
  en: en
};

export default function Footer({ brand }: { brand?: Brand }) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname.includes("/invite") || pathname.includes("/dashboard") || pathname.includes("/login")) {
    return null;
  }

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const segments = pathname.split("/");
  const locale = (segments[1] === 'en' || segments[1] === 'pt') ? segments[1] : 'pt'; 
  
  // 3. SELECIONAR OS TEXTOS
  const dict = dictionaries[locale as 'pt' | 'en']?.Footer || dictionaries.pt.Footer;

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href={`/${locale}`} className="font-serif text-2xl text-brand block mb-4">
              {brand?.name ?? "Digital Invite Studio"}
            </Link>
            <p className="text-sm text-gray-500">
              {dict.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">{dict.product}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${locale}/features`} className="text-sm text-gray-500 hover:text-brand">{dict.features}</Link></li>
              <li><Link href={`/${locale}/pricing`} className="text-sm text-gray-500 hover:text-brand">{dict.pricing}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">{dict.company}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${locale}/contact`} className="text-sm text-gray-500 hover:text-brand">{dict.contact}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">{dict.legal}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${locale}/privacy`} className="text-sm text-gray-500 hover:text-brand">{dict.privacy}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 text-center md:text-left">
          <p className="text-xs text-gray-400">&copy; {currentYear} {dict.copyright}</p>
        </div>
      </div>
    </footer>
  );
}