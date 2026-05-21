"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Globe } from "lucide-react";

import pt from '../../dictionaries/pt';
import en from '../../dictionaries/en';

const dictionaries = { pt, en };
const LOCALES = ['pt', 'en'] as const;
type Locale = typeof LOCALES[number];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.includes("/invite") || pathname.includes("/dashboard") || pathname.includes("/login")) {
    return null;
  }

  const segments = pathname.split("/");
  const locale = (segments[1] === 'en' || segments[1] === 'pt') ? segments[1] as Locale : 'pt';
  const dict = dictionaries[locale]?.Navbar || dictionaries.pt.Navbar;

  const navLinks = [
    { name: dict.features, href: `/${locale}/features` },
    { name: dict.pricing, href: `/${locale}/pricing` },
    { name: dict.contact, href: `/${locale}/contact` },
  ];

  const switchLocale = (newLocale: Locale) => {
    // Guardar escolha do utilizador em cookie (1 ano)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Navegar para a mesma página no novo locale
    const newSegments = [...segments];
    newSegments[1] = newLocale;
    router.push(newSegments.join('/') || `/${newLocale}`);
    setLangOpen(false);
    setIsOpen(false);
  };

  const localeLabels: Record<Locale, string> = { pt: 'PT', en: 'EN' };

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

          {/* LADO DIREITO */}
          <div className="hidden md:flex items-center gap-6">

            {/* SELETOR DE LÍNGUA */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                aria-label={dict.language}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#332E2B]/60 hover:text-[#630100] transition-colors px-2 py-1"
              >
                <Globe size={14} />
                <span>{localeLabels[locale]}</span>
              </button>

              {langOpen && (
                <>
                  {/* Overlay para fechar ao clicar fora */}
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white border border-[#EFDFBB]/60 rounded-2xl shadow-xl overflow-hidden z-20 min-w-[80px]">
                    {LOCALES.map(l => (
                      <button
                        key={l}
                        onClick={() => switchLocale(l)}
                        className={`w-full px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-left transition-colors ${
                          l === locale
                            ? 'bg-[#630100] text-white'
                            : 'text-[#332E2B] hover:bg-[#FDFBF7] hover:text-[#630100]'
                        }`}
                      >
                        {localeLabels[l]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

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

          {/* SELETOR DE LÍNGUA MOBILE */}
          <div className="flex items-center gap-3 pt-2">
            <Globe size={14} className="text-[#332E2B]/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#332E2B]/50">{dict.language}:</span>
            <div className="flex gap-1">
              {LOCALES.map(l => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                    l === locale
                      ? 'bg-[#630100] text-white'
                      : 'bg-gray-100 text-[#332E2B]/60 hover:text-[#630100]'
                  }`}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>
          </div>

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
