"use client";
import { useEffect, useState } from "react";
import { X, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";

// "Lembrar quem falta": grupos com pelo menos um convidado sem resposta, cada
// um com uma mensagem pronta (nome, link pessoal, prazo) para copiar e enviar
// por WhatsApp, SMS ou e-mail. Só possível porque o RSVP vive aqui: sabemos
// quem respondeu e quem nem abriu o link. A mensagem é editável (fica guardada
// neste browser) e o painel lembra a quem já se copiou o lembrete.

export type PendingGroup = {
  groupId: string;
  displayName: string;
  pendingCount: number;
  url: string;
  hasLink: boolean;
  opened: boolean;
};

type Dict = {
  remindTitle: string; remindIntro: string; remindTemplateLabel: string; remindPlaceholders: string;
  remindDefault: string; remindDeadline: string; remindCopy: string; remindCopied: string;
  remindRemindedToday: string; remindRemindedOn: string; remindNeverOpened: string; remindOpened: string;
  remindNoLink: string; remindPending: string; remindNone: string; remindMissingLink: string; remindReset: string; close: string;
};

type Props = {
  invitationId: string;
  locale: string;
  coupleNames: string;
  deadline: string | null;
  groups: PendingGroup[];
  dict: Dict;
  onClose: () => void;
};

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

export default function RemindPendingModal({ invitationId, locale, coupleNames, deadline, groups, dict, onClose }: Props) {
  const tplKey = `dis_remind_tpl_${invitationId}`;
  const remKey = `dis_reminded_${invitationId}`;
  const [template, setTemplate] = useState(dict.remindDefault);
  const [reminded, setReminded] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const t = read(tplKey); if (t) setTemplate(t);
    try { setReminded(JSON.parse(read(remKey) || "{}")); } catch { setReminded({}); }
  }, [tplKey, remKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const message = (g: PendingGroup) => template
    .split("{nome}").join(g.displayName)
    .split("{name}").join(g.displayName)
    .split("{casal}").join(coupleNames)
    .split("{couple}").join(coupleNames)
    .split("{link}").join(g.url)
    .split("{prazo}").join(deadline ? dict.remindDeadline.replace("{data}", deadline) : "")
    .split("{deadline}").join(deadline ? dict.remindDeadline.replace("{data}", deadline) : "");

  const copy = async (g: PendingGroup) => {
    try { await navigator.clipboard.writeText(message(g)); } catch { return; }
    const today = new Date().toISOString().slice(0, 10);
    const next = { ...reminded, [g.groupId]: today };
    setReminded(next); write(remKey, JSON.stringify(next));
    setCopied(g.groupId);
    setTimeout(() => setCopied(c => (c === g.groupId ? null : c)), 2000);
  };

  const onTemplate = (v: string) => { setTemplate(v); write(tplKey, v); };
  const resetTemplate = () => { setTemplate(dict.remindDefault); try { localStorage.removeItem(tplKey); } catch { /* */ } };
  const today = new Date().toISOString().slice(0, 10);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short" });
  const missingLink = !template.includes("{link}");

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" data-remind-modal>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={dict.remindTitle} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[88vh]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-2xl text-brand leading-tight">{dict.remindTitle}</h3>
            <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">{dict.remindIntro}</p>
          </div>
          <button onClick={onClose} aria-label={dict.close} className="shrink-0 w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-brand hover:text-white flex items-center justify-center transition-all"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label htmlFor="remind-tpl" className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{dict.remindTemplateLabel}</label>
              {template !== dict.remindDefault && (
                <button onClick={resetTemplate} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand"><RotateCcw size={11} /> {dict.remindReset}</button>
              )}
            </div>
            <textarea id="remind-tpl" rows={3} value={template} onChange={e => onTemplate(e.target.value)} className="w-full bg-cream border border-gray-200 rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:border-brand resize-y" />
            <p className="text-[11px] text-gray-400 mt-1">{dict.remindPlaceholders}</p>
            {missingLink && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> {dict.remindMissingLink}</p>}
          </div>

          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">{dict.remindNone}</p>
          ) : (
            <ul className="divide-y divide-gray-50 border border-gray-100 rounded-2xl">
              {groups.map(g => {
                const when = reminded[g.groupId];
                return (
                  <li key={g.groupId} data-remind-group={g.groupId} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{g.displayName}</p>
                      <p className="text-[11px] text-gray-400 flex flex-wrap gap-x-2">
                        <span>{dict.remindPending.replace("{n}", String(g.pendingCount))}</span>
                        <span>·</span>
                        <span className={!g.hasLink ? "" : g.opened ? "text-emerald-600" : "text-amber-600"}>
                          {!g.hasLink ? dict.remindNoLink : g.opened ? dict.remindOpened : dict.remindNeverOpened}
                        </span>
                        {when && (<><span>·</span><span className="text-brand">{when === today ? dict.remindRemindedToday : dict.remindRemindedOn.replace("{data}", fmt(when))}</span></>)}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1.5 line-clamp-2 break-all sm:break-normal">{message(g)}</p>
                    </div>
                    <button onClick={() => copy(g)} className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 border border-gray-200 rounded-full px-4 py-2 hover:text-brand hover:bg-gray-50">
                      {copied === g.groupId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copied === g.groupId ? dict.remindCopied : dict.remindCopy}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
