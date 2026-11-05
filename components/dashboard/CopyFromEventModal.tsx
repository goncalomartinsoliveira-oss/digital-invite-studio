"use client";
import { useEffect, useMemo, useState } from "react";
import { X, Search, Loader2, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { EventCost, EventTask } from "@/lib/planner";
import { copiedCostRows, copiedTaskRows } from "@/lib/plannerCopy";

// "Copiar de outro casamento": escolhe um casamento da mesma marca e copia a
// checklist ou as linhas de orçamento para este, acrescentando ao que já existe
// (nunca apaga nada). Ver lib/plannerCopy.ts para o que é e não é copiado.

type Kind = "tasks" | "costs";
type EventLite = { id: string; slug: string; groom_name: string | null; bride_name: string | null; event_date: string | null; brand_id: string | null };

type Props = {
  kind: Kind;
  invitationId: string;
  brandId: string | null;
  eventDate: string | null;
  startOrder: number;
  onClose: () => void;
  onDone: (inserted: any[]) => void;
};

const label = {
  tasks: { title: "Copiar checklist de outro casamento", noun: "tarefas", empty: "Esse casamento não tem tarefas.", note: "As tarefas voltam a “por fazer” e os prazos passam a contar a partir da data deste casamento." },
  costs: { title: "Copiar orçamento de outro casamento", noun: "linhas de orçamento", empty: "Esse casamento não tem linhas de orçamento.", note: "Copiam-se preços, modo de cálculo e IVA. O estado volta a “a orçar”; pagamentos, notas e documentos não são copiados." },
};

export default function CopyFromEventModal({ kind, invitationId, brandId, eventDate, startOrder, onClose, onDone }: Props) {
  const L = label[kind];
  const [events, setEvents] = useState<EventLite[] | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<EventLite | null>(null);
  const [source, setSource] = useState<(EventTask | EventCost)[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase.from("invitations").select("id, slug, groom_name, bride_name, event_date, brand_id").neq("id", invitationId);
    query = brandId ? query.eq("brand_id", brandId) : query.is("brand_id", null);
    query.order("event_date", { ascending: false }).limit(300).then(({ data }) => setEvents((data as EventLite[]) || []));
  }, [invitationId, brandId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nameOf = (e: EventLite) => (e.groom_name && e.bride_name ? `${e.groom_name} & ${e.bride_name}` : e.slug);
  const filtered = useMemo(() => {
    const n = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return (events || []).filter(e => !q.trim() || n(nameOf(e) + " " + e.slug).includes(n(q.trim())));
  }, [events, q]);

  const pick = async (e: EventLite) => {
    setPicked(e); setSource(null); setError(null);
    const table = kind === "tasks" ? "event_tasks" : "event_costs";
    const { data } = await supabase.from(table).select("*").eq("invitation_id", e.id);
    const rows = (data as (EventTask | EventCost)[]) || [];
    setSource(kind === "costs" ? rows.filter(r => (r as EventCost).status !== "cancelado") : rows);
  };

  const copy = async () => {
    if (!picked || !source || source.length === 0) return;
    setBusy(true); setError(null);
    const rows = kind === "tasks"
      ? copiedTaskRows(source as EventTask[], { sourceEventDate: picked.event_date, targetEventDate: eventDate, targetInvitationId: invitationId, startOrder })
      : copiedCostRows(source as EventCost[], { targetInvitationId: invitationId, startOrder, keepVendors: (picked.brand_id ?? null) === (brandId ?? null) });
    const { data, error: err } = await supabase.from(kind === "tasks" ? "event_tasks" : "event_costs").insert(rows).select("*");
    setBusy(false);
    if (err || !data) { setError("Não foi possível copiar. Tentem outra vez."); return; }
    onDone(data);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" data-copy-modal>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={L.title} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-2xl text-brand leading-tight">{L.title}</h3>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{L.note}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="shrink-0 w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-brand hover:text-white flex items-center justify-center transition-all"><X size={16} /></button>
        </div>

        {!picked ? (
          <>
            <div className="px-6 pt-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar casamento…" className="w-full bg-cream border border-gray-200 rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {events === null ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Não há outros casamentos desta marca.</p>
              ) : (
                <ul>
                  {filtered.map(e => (
                    <li key={e.id}>
                      <button onClick={() => pick(e)} data-pick={e.slug} className="w-full text-left px-3 py-3 rounded-xl hover:bg-cream transition-colors">
                        <span className="block font-serif text-lg text-ink leading-tight">{nameOf(e)}</span>
                        <span className="block text-[11px] text-gray-400">{e.event_date ? new Date(e.event_date).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }) : "Sem data"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-600">De <strong className="text-ink">{nameOf(picked)}</strong></p>
            {source === null ? (
              <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
            ) : source.length === 0 ? (
              <p className="text-sm text-gray-500">{L.empty}</p>
            ) : (
              <p className="text-sm text-gray-600" data-copy-count={source.length}>
                Vão ser acrescentadas <strong className="text-ink">{source.length} {L.noun}</strong> a este casamento. O que já existe aqui não é alterado.
              </p>
            )}
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => setPicked(null)} className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-200 text-gray-500 hover:text-brand">Escolher outro</button>
              {source && source.length > 0 && (
                <button onClick={copy} disabled={busy} className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />} Copiar {source.length} {L.noun}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
