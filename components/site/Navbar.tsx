"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Esconde em páginas de convite, dashboard ou login
  if (pathname.includes("/invite") || pathname.includes("/dashboard") || pathname.includes("/login")) {
    return null;
  }

  // 1. Extrair o locale do pathname (ex: extrai "pt" de "/pt/pricing")
  // Isto garante que os links mantêm o utilizador no idioma correto
  const segments = pathname.split("/");
  const locale = segments[1] || "pt"; 

  const navLinks = [
    { name: "Funcionalidades", href: `/${locale}/features` },
    { name: "Preços", href: `/${locale}/pricing` },
    { name: "Contactos", href: `/${locale}/contact` },
  ];

  return (
    <nav className="fixed w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-24">
          
          {/* LOGOTIPO */}
          <Link href={`/${locale}`} className="flex items-center group">
            <img 
              src="/logo-dis.svg" 
              alt="Digital Invite Studio" 
              className="h-12 md:h-16 w-auto transition-transform duration-500 group-hover:scale-105" 
            />
          </Link>

          {/* LINKS CENTRAIS */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-[#722F37] transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#722F37] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* BOTÕES LADO DIREITO */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href={`/${locale}/login`} 
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-800 hover:text-[#722F37] transition-colors"
            >
              Login
            </Link>
            <Link 
              href={`/${locale}/pricing`} 
              className="bg-[#722F37] text-[#FDFBF7] px-8 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-[#332E2B] transition-all duration-500 transform hover:-translate-y-0.5"
            >
              Começar Agora
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button className="md:hidden text-gray-800 p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#FDFBF7] border-t border-gray-100 absolute w-full shadow-2xl py-8 px-6 space-y-6">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="block text-sm font-bold uppercase tracking-widest text-gray-800"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <Link href={`/${locale}/login`} onClick={() => setIsOpen(false)} className="block text-sm font-bold uppercase tracking-widest text-[#722F37]">Login</Link>
            <Link href={`/${locale}/pricing`} onClick={() => setIsOpen(false)} className="block bg-[#722F37] text-white text-center py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest">
              Começar Agora
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}