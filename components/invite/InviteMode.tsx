"use client";
import { createContext, useContext, type ReactNode } from "react";

// Estado do convite visto por quem o abre. "unpublished" = pré-visualização
// de um convite ainda por publicar (só quem gere o evento a vê): mostra uma
// faixa a avisar e o RSVP fica inativo, para não mexer na lista real.
type InviteMode = { unpublished: boolean };
const Ctx = createContext<InviteMode>({ unpublished: false });

export function InviteModeProvider({ unpublished, label, children }: { unpublished: boolean; label?: string; children: ReactNode }) {
  return (
    <Ctx.Provider value={{ unpublished }}>
      {children}
      {unpublished && label && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-ink/90 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
          {label}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useInviteMode(): InviteMode {
  return useContext(Ctx);
}
