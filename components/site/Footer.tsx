"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname.includes("/invite") || pathname.includes("/dashboard") || pathname.includes("/login")) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-2xl text-[#722F37] block mb-4">
              Digital Invite Studio
            </Link>
            <p className="text-sm text-gray-500">
              O sistema operativo para o seu casamento.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">Produto</h4>
            <ul className="space-y-4">
              <li><Link href="/features" className="text-sm text-gray-500 hover:text-[#722F37]">Funcionalidades</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-[#722F37]">Preços</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">Empresa</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="text-sm text-gray-500 hover:text-[#722F37]">Contactos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-[#722F37]">Privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 text-center md:text-left">
          <p className="text-xs text-gray-400">&copy; {currentYear} Digital Invite Studio.</p>
        </div>
      </div>
    </footer>
  );
}