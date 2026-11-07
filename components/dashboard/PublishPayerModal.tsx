"use client";
import { useEffect } from "react";
import { Loader2, X, CheckCircle2, UserPlus } from "lucide-react";

// "Publicar convite" num evento de parceiro, para a equipa do parceiro:
// antes do pagamento, escolher quem paga (invitations.paid_by).
//  - A agência → segue para o checkout, ao preço de parceiro.
//  - Os noivos → grava a escolha e explica que são eles a publicar e a pagar,
//    ao preço normal, no painel deles (com atalho para os convidar).

export type PayerModalDict = {
  title: string;
  intro: string;
  partner: { label: string; desc: string };
  couple: { label: string; desc: string };
  continuePartner: string;
  continueCouple: string;
  cancel: string;
  coupleDoneTitle: string;
  coupleDoneText: string;
  inviteCouple: string;
  close: string;
};

type Props = {
  step: "choose" | "couple-done";
  current: "partner" | "couple";
  partnerPrice?: string; // ex.: "59,00 €", quando o servidor o deu
  busy: boolean;
  dict: PayerModalDict;
  onChoose: (payer: "partner" | "couple") => void;
  onInviteCouple: () => void;
  onClose: () => void;
};

export default function PublishPayerModal({ step, current, partnerPrice, busy, dict, onChoose, onInviteCouple, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const btn = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="payer-modal-title" className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} disabled={busy} aria-label={dict.close} className="absolute top-5 right-5 text-gray-300 hover:text-ink"><X size={18} /></button>

        {step === "choose" ? (
          <>
            <h2 id="payer-modal-title" className="font-serif text-2xl text-ink mb-2 pr-8">{dict.title}</h2>
            <p className="text-sm text-gray-500 mb-6">{dict.intro}</p>
            <div className="space-y-3">
              <button onClick={() => onChoose("partner")} disabled={busy}
                className={`w-full text-left rounded-2xl border px-5 py-4 transition-colors disabled:opacity-60 ${current === "partner" ? "border-brand bg-brand/5" : "border-gray-200 hover:border-brand"}`}>
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{dict.partner.label}</span>
                  {partnerPrice && <span className="font-serif text-lg text-brand">{partnerPrice}</span>}
                </span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{dict.partner.desc}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand">
                  {busy ? <Loader2 size={12} className="animate-spin" /> : null}{dict.continuePartner}
                </span>
              </button>
              <button onClick={() => onChoose("couple")} disabled={busy}
                className={`w-full text-left rounded-2xl border px-5 py-4 transition-colors disabled:opacity-60 ${current === "couple" ? "border-brand bg-brand/5" : "border-gray-200 hover:border-brand"}`}>
                <span className="text-sm font-semibold text-ink">{dict.couple.label}</span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{dict.couple.desc}</span>
                <span className="mt-3 inline-flex text-[10px] font-bold uppercase tracking-widest text-brand">{dict.continueCouple}</span>
              </button>
            </div>
            <div className="mt-6 text-right">
              <button onClick={onClose} disabled={busy} className={`${btn} text-gray-400 hover:text-ink`}>{dict.cancel}</button>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={28} className="text-green-600 mb-3" />
            <h2 id="payer-modal-title" className="font-serif text-2xl text-ink mb-2 pr-8">{dict.coupleDoneTitle}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{dict.coupleDoneText}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={onClose} className={`${btn} text-gray-400 hover:text-ink`}>{dict.close}</button>
              <button onClick={onInviteCouple} className={`${btn} bg-brand text-gold-soft shadow-md hover:bg-brand-dark`}><UserPlus size={14} /> {dict.inviteCouple}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
