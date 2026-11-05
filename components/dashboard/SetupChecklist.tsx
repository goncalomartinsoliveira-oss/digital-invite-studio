"use client";
import { Check, ChevronRight, HelpCircle, PartyPopper, X } from "lucide-react";

// "O que falta fazer": progresso de preparação do convite, no topo do hub.
// Cada passo é calculado a partir de dados que já existem (nomes, foto,
// textos, lista de convidados, link copiado) — não guarda estado próprio, por
// isso nunca fica dessincronizado com o que o casal realmente fez.

export type ChecklistItem = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  onGo: () => void;
  helpSlug?: string; // artigo de ajuda que explica este passo
};

type Dict = {
  title: string;
  progress: string; // "{done} de {total} passos concluídos"
  go: string;
  allDoneTitle: string;
  allDoneDesc: string;
  dismiss: string;
  howBtn?: string;
};

type Props = {
  items: ChecklistItem[];
  dict: Dict;
  onDismiss: () => void;
  onHelp?: (slug: string) => void;
};

export default function SetupChecklist({ items, dict, onDismiss, onHelp }: Props) {
  if (items.length === 0) return null;
  const done = items.filter(i => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);

  if (done === total) {
    return (
      <div data-checklist="done" className="mb-10 bg-green-50 border border-green-100 rounded-3xl px-6 py-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-white border border-green-100 flex items-center justify-center text-green-500 shrink-0">
          <PartyPopper size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-lg text-ink leading-snug">{dict.allDoneTitle}</p>
          <p className="text-gray-500 text-xs mt-0.5">{dict.allDoneDesc}</p>
        </div>
        <button onClick={onDismiss} aria-label={dict.dismiss} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-all">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <section data-checklist="todo" className="mb-10 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h3 className="font-serif text-xl text-ink">{dict.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">
          {dict.progress.replace("{done}", String(done)).replace("{total}", String(total))}
        </span>
      </div>

      <div className="h-1.5 bg-cream rounded-full overflow-hidden mb-5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <ul className="divide-y divide-gray-50">
        {items.map(item => (
          <li key={item.id} data-item={item.id} data-done={item.done} className="flex items-center gap-2">
            <button
              onClick={item.onGo}
              className="flex-1 min-w-0 flex items-center gap-4 py-3.5 text-left group"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${item.done ? "bg-brand border-brand text-white" : "border-gray-200 text-transparent group-hover:border-brand"}`}>
                <Check size={13} />
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-semibold ${item.done ? "text-gray-400 line-through" : "text-ink"}`}>{item.label}</span>
                {!item.done && <span className="block text-xs text-gray-400 mt-0.5">{item.hint}</span>}
              </span>
              {!item.done && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand group-hover:gap-2 transition-all shrink-0">
                  {dict.go} <ChevronRight size={13} />
                </span>
              )}
            </button>
            {!item.done && item.helpSlug && onHelp && dict.howBtn && (
              <button
                onClick={() => onHelp(item.helpSlug!)}
                className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand border border-gray-200 hover:border-gold-soft rounded-full px-3 py-1.5 transition-all"
              >
                <HelpCircle size={12} /> {dict.howBtn}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
