"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

// 1. IMPORTAR OS DICIONÁRIOS (2 níveis para trás a partir de components/site/)
import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';

const dictionaries = {
  pt: pt,
  en: en
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.includes("/invite") || pathname.includes("/dashboard") || pathname.includes("/login")) {
    return null;
  }

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const segments = pathname.split("/");
  const locale = (segments[1] === 'en' || segments[1] === 'pt') ? segments[1] : 'pt'; 
  
  // 3. SELECIONAR OS TEXTOS
  const dict = dictionaries[locale as 'pt' | 'en']?.Navbar || dictionaries.pt.Navbar;

  const navLinks = [
    { name: dict.features, href: `/${locale}/features` },
    { name: dict.pricing, href: `/${locale}/pricing` },
    { name: dict.contact, href: `/${locale}/contact` },
  ];

  return (
    <nav className="fixed w-full z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EFDFBB]/50 transition-all duration-300 font-montserrat">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-28">
          
          {/* LOGOTIPO */}
          <Link href={`/${locale}`} className="flex items-center group">
            <img 
              src="/logo-dis.svg" 
              alt="Digital Invite Studio" 
              className="h-12 md:h-20 w-auto transition-transform duration-500 group-hover:scale-105" 
            />
          </Link>

          {/* LINKS CENTRAIS */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#332E2B]/70 hover:text-[#630100] transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#630100] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* BOTÕES LADO DIREITO */}
          <div className="hidden md:flex items-center gap-10">
            <Link 
              href={`/${locale}/login`} 
              className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#332E2B] hover:text-[#630100] transition-colors"
            >
              {dict.login}
            </Link>
            
            <Link 
              href={`/${locale}/pricing`} 
              className="bg-[#630100] text-[#EFDFBB] border-2 border-[#630100] px-10 py-4 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-transparent hover:text-[#630100] transition-all duration-500 transform hover:-translate-y-0.5 shadow-lg active:scale-95"
            >
              {dict.startNow}
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button className="md:hidden text-[#332E2B] p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#FDFBF7] border-t border-[#EFDFBB] absolute w-full shadow-2xl py-12 px-8 space-y-8 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="block text-[13px] font-semibold uppercase tracking-[0.2em] text-[#332E2B]"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-6 border-t border-[#EFDFBB] space-y-6">
            <Link href={`/${locale}/login`} onClick={() => setIsOpen(false)} className="block text-[13px] font-semibold uppercase tracking-[0.2em] text-[#630100]">{dict.login}</Link>
            <Link href={`/${locale}/pricing`} onClick={() => setIsOpen(false)} className="block bg-[#630100] text-[#EFDFBB] text-center py-5 text-[11px] font-semibold uppercase tracking-[0.2em] rounded-full shadow-md">
              {dict.startNow}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}