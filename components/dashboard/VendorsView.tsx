"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Loader2, Mail, Phone, Globe, Star, Trash2, Plus, ExternalLink } from "lucide-react";
import {
  COST_CATEGORIES,
  COST_STATUS_LABELS,
  costGrossCents,
  formatCents,
  type AgencyVendor,
  type CostStatus,
  type EventCost,
} from "@/lib/planner";

// Diretório de fornecedores da agência — reutilizado em todos os eventos da
// marca. Além da ficha de contacto (que `agency_vendors` já suportava desde
// a Fase 0 mas sem nenhuma interface a preencher), mostra o histórico de
// preços de cada fornecedor entre casamentos: a memória institucional que
// não se perde quando um assistente sai da equipa, e o argumento de
// retenção mais forte deste módulo.

type EventLite = { id: string; slug: string; groom_name: string; bride_name: string; event_date: string };

interface Props {
  brandId: string;
  events: EventLite[];
  locale: string;
  onOpenEvent: (slug: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  espaco: "Espaço", catering: "Catering", bebidas: "Bebidas", decoracao: "Decoração",
  flores: "Flores", fotografia: "Fotografia", video: "Vídeo", musica: "Música",
  bolo: "Bolo", convites: "Convites", beleza: "Beleza", vestuario: "Vestuário",
  transporte: "Transporte", honorarios: "Honorários", outros: "Outros",
};

const STATUS_COLOR: Record<CostStatus, string> = {
  a_orcar: "text-gray-500 bg-gray-50 border-gray-100",
  orcamento_pedido: "text-blue-600 bg-blue-50 border-blue-100",
  em_negociacao: "text-amber-600 bg-amber-50 border-amber-100",
  contratado: "text-green-700 bg-green-50 border-green-100",
  cancelado: "text-red-500 bg-red-50 border-red-100",
};

export default function VendorsView({ brandId, events, locale, onOpenEvent }: Props) {
  const en = locale === "en";
  const [vendors, setVendors] = useState<AgencyVendor[]>([]);
  const [costs, setCosts] = useState<EventCost[]>([]);
  // Convidados confirmados por evento — necessário para calcular o preço real
  // das linhas "por pessoa" no histórico (sem isto dariam sempre 0€).
  const [confirmedByEvent, setConfirmedByEvent] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const eventIds = events.map(e => e.id);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, c, g] = await Promise.all([
      supabase.from("agency_vendors").select("*").eq("brand_id", brandId).order("name"),
      eventIds.length > 0
        ? supabase.from("event_costs").select("*").in("invitation_id", eventIds).not("vendor_id", "is", null)
        : Promise.resolve({ data: [] as EventCost[] }),
      eventIds.length > 0
        ? supabase.from("guests").select("invitation_id, status").in("invitation_id", eventIds)
        : Promise.resolve({ data: [] as { invitation_id: string; status: string }[] }),
    ]);
    setVendors((v.data as AgencyVendor[]) || []);
    setCosts((c.data as EventCost[]) || []);
    const counts: Record<string, number> = {};
    ((g.data as { invitation_id: string; status: string }[]) || []).forEach(row => {
      if (row.status === "confirmed") counts[row.invitation_id] = (counts[row.invitation_id] || 0) + 1;
    });
    setConfirmedByEvent(counts);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, eventIds.join(",")]);

  useEffect(() => { load(); }, [load]);

  const eventName = (invitationId: string) => {
    const ev = events.find(e => e.id === invitationId);
    if (!ev) return "—";
    return ev.groom_name && ev.bride_name ? `${ev.groom_name} & ${ev.bride_name}` : ev.slug;
  };

  const historyFor = (vendorId: string) =>
    costs.filter(c => c.vendor_id === vendorId).sort((a, b) => b.invitation_id.localeCompare(a.invitation_id));

  const addVendor = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const { data } = await supabase.from("agency_vendors").insert([{ brand_id: brandId, name }]).select("*").single();
    if (data) {
      setVendors(prev => [...prev, data as AgencyVendor].sort((a, b) => a.name.localeCompare(b.name)));
      setExpanded((data as AgencyVendor).id);
    }
    setNewName("");
    setAdding(false);
  };

  const patchVendor = async (id: string, patch: Partial<AgencyVendor>) => {
    setVendors(prev => prev.map(v => (v.id === id ? { ...v, ...patch } : v)));
    await supabase.from("agency_vendors").update(patch).eq("id", id);
  };

  // event_costs.vendor_id tem "on delete set null", por isso apagar o
  // fornecedor não apaga as linhas de custo já criadas — só desliga o link.
  const removeVendor = async (id: string) => {
    if (!confirm(en ? "Remove this vendor? Past cost lines keep their history." : "Remover este fornecedor? As linhas de custo já criadas mantêm o histórico.")) return;
    setVendors(prev => prev.filter(v => v.id !== id));
    await supabase.from("agency_vendors").delete().eq("id", id);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{en ? "Vendors" : "Fornecedores"}</h1>
        <p className="text-gray-500 text-sm">
          {en ? "One directory, every event. Price history follows the vendor across weddings." : "Um diretório só, para todos os eventos. O histórico de preços segue o fornecedor entre casamentos."}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className={inputCls}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addVendor(); }}
          placeholder={en ? "New vendor — e.g. Quinta da Boavista" : "Novo fornecedor — ex: Quinta da Boavista"}
        />
        <button
          onClick={addVendor}
          disabled={adding || !newName.trim()}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-40 shrink-0"
        >
          <Plus size={14} /> {en ? "Add" : "Adicionar"}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
      ) : vendors.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">
          {en ? "No vendors yet." : "Ainda não há fornecedores."}
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map(vendor => {
            const history = historyFor(vendor.id);
            const isOpen = expanded === vendor.id;
            const usedIn = new Set(history.map(h => h.invitation_id)).size;
            const prices = history.map(c => costGrossCents(c, confirmedByEvent[c.invitation_id] || 0)).filter(p => p > 0);
            const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : null;

            return (
              <div key={vendor.id} className={`bg-white border rounded-3xl shadow-sm overflow-hidden transition-colors ${isOpen ? "border-brand/30" : "border-gray-100"}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : vendor.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-serif text-xl text-ink leading-tight">{vendor.name}</p>
                      {vendor.category && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand bg-brand/5 px-2 py-0.5 rounded-md">
                          {CATEGORY_LABELS[vendor.category] || vendor.category}
                        </span>
                      )}
                      {vendor.rating && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                          <Star size={11} fill="currentColor" /> {vendor.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {usedIn > 0
                        ? (en ? `Used in ${usedIn} event${usedIn > 1 ? "s" : ""}` : `Usado em ${usedIn} evento${usedIn > 1 ? "s" : ""}`)
                        : (en ? "Not used yet" : "Ainda não usado")}
                      {avgPrice !== null && ` · ${en ? "avg." : "média"} ${formatCents(avgPrice, en ? "en-GB" : "pt-PT")}`}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className={labelCls}>{en ? "Category" : "Categoria"}</label>
                        <select className={inputCls} value={vendor.category || ""} onChange={e => patchVendor(vendor.id, { category: e.target.value || null })}>
                          <option value="">—</option>
                          {COST_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{en ? "Contact person" : "Pessoa de contacto"}</label>
                        <input className={inputCls} defaultValue={vendor.contact_name || ""} onBlur={e => patchVendor(vendor.id, { contact_name: e.target.value || null })} />
                      </div>
                      <div>
                        <label className={labelCls}><Mail size={10} className="inline mr-1" />Email</label>
                        <input className={inputCls} type="email" defaultValue={vendor.email || ""} onBlur={e => patchVendor(vendor.id, { email: e.target.value || null })} />
                      </div>
                      <div>
                        <label className={labelCls}><Phone size={10} className="inline mr-1" />{en ? "Phone" : "Telefone"}</label>
                        <input className={inputCls} defaultValue={vendor.phone || ""} onBlur={e => patchVendor(vendor.id, { phone: e.target.value || null })} />
                      </div>
                      <div>
                        <label className={labelCls}><Globe size={10} className="inline mr-1" />Website</label>
                        <input className={inputCls} defaultValue={vendor.website || ""} onBlur={e => patchVendor(vendor.id, { website: e.target.value || null })} />
                      </div>
                      <div>
                        <label className={labelCls}><Star size={10} className="inline mr-1" />{en ? "Rating (1-5)" : "Avaliação (1-5)"}</label>
                        <select className={inputCls} value={vendor.rating ?? ""} onChange={e => patchVendor(vendor.id, { rating: e.target.value ? parseInt(e.target.value) : null })}>
                          <option value="">—</option>
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className={labelCls}>{en ? "Private notes" : "Notas privadas"}</label>
                      <textarea
                        className={`${inputCls} resize-none`}
                        rows={2}
                        defaultValue={vendor.notes || ""}
                        placeholder={en ? "Reliability, punctuality, anything worth remembering next time." : "Fiabilidade, pontualidade, o que valha a pena lembrar da próxima vez."}
                        onBlur={e => patchVendor(vendor.id, { notes: e.target.value || null })}
                      />
                    </div>

                    {/* Histórico de preços entre casamentos */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <p className={labelCls}>{en ? "Price history" : "Histórico de preços"}</p>
                      {history.length === 0 ? (
                        <p className="text-xs text-gray-300 py-2">{en ? "No cost lines linked to this vendor yet." : "Ainda sem linhas de custo ligadas a este fornecedor."}</p>
                      ) : (
                        <ul className="space-y-1.5 mt-2">
                          {history.map(c => {
                            const ev = events.find(e => e.id === c.invitation_id);
                            return (
                              <li key={c.id}>
                                <button
                                  onClick={() => ev && onOpenEvent(ev.slug)}
                                  className="w-full flex items-center gap-3 bg-cream/60 hover:bg-cream rounded-xl px-3 py-2.5 text-left transition-colors"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-ink truncate">{eventName(c.invitation_id)}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{c.description || CATEGORY_LABELS[c.category] || c.category}</p>
                                  </div>
                                  <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${STATUS_COLOR[c.status]}`}>
                                    {COST_STATUS_LABELS[c.status]}
                                  </span>
                                  <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatCents(costGrossCents(c, confirmedByEvent[c.invitation_id] || 0), en ? "en-GB" : "pt-PT")}</span>
                                  <ExternalLink size={12} className="text-gray-300 shrink-0" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => removeVendor(vendor.id)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} /> {en ? "Remove vendor" : "Remover fornecedor"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
