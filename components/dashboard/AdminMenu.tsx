"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Menu "Administração" da lista de eventos: junta num só botão as vistas que
// antes eram 6 botões lado a lado (Gestão, Membros, Marcas, Cupões, Preços,
// Negócio). Com um único item disponível (agências, que só vêem "Gestão")
// mostra o botão simples — um menu com uma só opção seria ruído.

export type AdminMenuItem<Id extends string> = {
  id: Id;
  label: string;
  icon: ReactNode;
};

type Props<Id extends string> = {
  label: string;
  icon: ReactNode;
  items: AdminMenuItem<Id>[];
  active: string;
  onSelect: (id: Id) => void;
};

const pillBase =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all";
const pillOn = "bg-brand text-white";
const pillOff = "text-gray-400 hover:text-brand";

export default function AdminMenu<Id extends string>({ label, icon, items, active, onSelect }: Props<Id>) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  if (items.length === 1) {
    const only = items[0];
    return (
      <button onClick={() => onSelect(only.id)} className={`${pillBase} ${active === only.id ? pillOn : pillOff}`}>
        {only.icon} <span className="hidden sm:inline">{only.label}</span>
      </button>
    );
  }

  const current = items.find(i => i.id === active);

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${pillBase} ${current ? pillOn : pillOff}`}
      >
        {icon}
        <span className="hidden sm:inline">{current ? `${label} · ${current.label}` : label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[190px] bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 z-30"
        >
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left ${
                active === item.id ? "bg-brand text-white" : "text-gray-500 hover:bg-cream hover:text-brand"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
