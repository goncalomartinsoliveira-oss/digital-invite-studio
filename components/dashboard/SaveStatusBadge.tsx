"use client";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { SaveStatus } from "@/lib/useSaveStatus";

// Indicador de gravação dos módulos de Planeamento. Silencioso em repouso —
// só aparece quando há alguma coisa a dizer.
//
// Flutua sobre o conteúdo em vez de ocupar espaço no topo: estes ecrãs são
// longos e a gravação acontece ao sair de um campo que pode estar em qualquer
// ponto da página — um aviso no cabeçalho passaria despercebido. O `bottom-24`
// em mobile deixa-o acima da barra de navegação inferior.

export default function SaveStatusBadge({ status, locale }: { status: SaveStatus; locale: string }) {
  const en = locale === "en";
  if (status === "idle") return null;

  const look = {
    saving: {
      icon: <Loader2 size={12} className="animate-spin" />,
      text: en ? "Saving…" : "A guardar…",
      cls: "text-gray-400 bg-gray-50 border-gray-100",
    },
    saved: {
      icon: <Check size={12} />,
      text: en ? "Saved" : "Guardado",
      cls: "text-green-700 bg-green-50 border-green-100",
    },
    error: {
      icon: <AlertTriangle size={12} />,
      text: en ? "Couldn't save — check your connection" : "Não foi possível guardar — verifique a ligação",
      cls: "text-red-600 bg-red-50 border-red-100",
    },
  }[status];

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 border px-3 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md ${look.cls}`}
      >
        {look.icon} {look.text}
      </span>
    </div>
  );
}
