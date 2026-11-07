"use client";
import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, HelpCircle, PartyPopper, X } from "lucide-react";

// "O que falta fazer": progresso de preparação do convite, no topo do hub.
// Cada passo é calculado a partir de dados que já existem (nomes, foto,
// textos, lista de convidados, link copiado) — não guarda estado próprio, por
// isso nunca fica dessincronizado com o que o casal realmente fez.
//
// Por omissão aparece fechado: uma barra de uma linha com o progresso, o
// próximo passo e "Ver tudo". Aberto, mostra a lista completa. A escolha fica
// guardada no browser, por evento (storageKey).

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
  next?: string;     // "Próximo:"
  showAll?: string;  // "Ver tudo"
  showLess?: string; // "Fechar"
};

type Props = {
  items: ChecklistItem[];
  dict: Dict;
  onDismiss: () => void;
  onHelp?: (slug: string) => void;
  storageKey?: string;
};

export default function SetupChecklist({ items, dict, onDismiss, onHelp, storageKey }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!storageKey) return;
    try { setOpen(localStorage.getItem(storageKey) === "1"); } catch { /* sem localStorage: fica fechado */ }
  }, [storageKey]);
  const toggle = () => {
    setOpen(o => {
      const next = !o;
      if (storageKey) { try { localStorage.setItem(storageKey, next ? "1" : "0"); } catch { /* ignorar */ } }
      return next;
    });
  };

  if (items.length === 0) return null;
  const done = items.filter(i => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const nextItem = items.find(i => !i.done);
  const progressLabel = dict.progress.replace("{done}", String(done)).replace("{total}", String(total));

  if (done === total) {
    return (
      <div data-checklist="done" className="mb-8 bg-green-50 border border-green-100 rounded-2xl px-5 py-3 flex items-center gap-3">
        <PartyPopper size={18} className="text-green-500 shrink-0" />
        <p className="flex-1 min-w-0 text-sm text-ink"><span className="font-semibold">{dict.allDoneTitle}</span> <span className="text-gray-500 text-xs hidden sm:inline">{dict.allDoneDesc}</span></p>
        <button onClick={onDismiss} aria-label={dict.dismiss} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white transition-all">
          <X size={15} />
        </button>
      </div>
    );
  }

  const progressBar = (
    <div className="h-1.5 bg-cream rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={progressLabel}>
      <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );

  return (
    <section data-checklist="todo" data-open={open} className="mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
      {/* Barra compacta (sempre visível) */}
      <div className="px-5 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-3 min-w-[180px]">
          <h3 className="font-serif text-xl text-ink whitespace-nowrap">{dict.title}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{done}/{total}</span>
          <div className="w-16 hidden sm:block">{progressBar}</div>
        </div>
        {nextItem && !open && (
          <button onClick={nextItem.onGo} className="flex-1 min-w-0 flex items-center gap-2 text-left group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{dict.next ?? "Próximo:"}</span>
            <span className="text-sm text-ink font-semibold truncate group-hover:text-brand transition-colors">{nextItem.label}</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-widest text-brand shrink-0 group-hover:gap-1.5 transition-all">
              {dict.go} <ChevronRight size={12} />
            </span>
          </button>
        )}
        {open && <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{progressLabel}</span>}
        <button
          onClick={toggle}
          aria-expanded={open}
          className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand border border-gray-200 hover:border-gold-soft rounded-full px-3 py-1.5 transition-all shrink-0"
        >
          {open ? (dict.showLess ?? "Fechar") : (dict.showAll ?? "Ver tudo")}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Lista completa (só aberta) */}
      {open && (
        <div className="px-5 sm:px-6 pb-4 border-t border-gray-50">
          <div className="pt-3 sm:hidden">{progressBar}</div>
          <ul className="divide-y divide-gray-50">
            {items.map(item => (
              <li key={item.id} data-item={item.id} data-done={item.done} className="flex items-center gap-2">
                <button onClick={item.onGo} className="flex-1 min-w-0 flex items-center gap-4 py-3 text-left group">
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
        </div>
      )}
    </section>
  );
}
