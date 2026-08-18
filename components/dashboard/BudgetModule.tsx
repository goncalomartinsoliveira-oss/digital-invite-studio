"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, ChevronDown, Eye, EyeOff, Users, AlertTriangle, Loader2 } from "lucide-react";
import {
  COST_CATEGORIES,
  DEFAULT_VAT_PCT,
  budgetTotals,
  costGrossCents,
  costNetCents,
  effectiveQuantity,
  formatCents,
  parseAmountToCents,
  type CostPayment,
  type EventCost,
} from "@/lib/planner";

// Orçamento e custos do evento — área de gestão, exclusiva de contas de
// agência. Escreve diretamente nas suas tabelas (como Convidados ou Mesas),
// não pelo handleSaveDesign do painel: são dados financeiros, e o gravar do
// painel atualiza a linha inteira do evento, o que perderia escritas se duas
// pessoas mexessem ao mesmo tempo.

type Vendor = { id: string; name: string; category: string | null };

interface Props {
  invitationId: string;
  brandId: string;
  canEdit: boolean;
  /** Equipa da agência vê tudo; o casal só vê as linhas partilhadas. */
  isAgency: boolean;
  confirmedGuests: number;
  locale: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  espaco: "Espaço", catering: "Catering", bebidas: "Bebidas", decoracao: "Decoração",
  flores: "Flores", fotografia: "Fotografia", video: "Vídeo", musica: "Música",
  bolo: "Bolo", convites: "Convites", beleza: "Beleza", vestuario: "Vestuário",
  transporte: "Transporte", honorarios: "Honorários", outros: "Outros",
};

export default function BudgetModule({ invitationId, brandId, canEdit, isAgency, confirmedGuests, locale }: Props) {
  const [costs, setCosts] = useState<EventCost[]>([]);
  const [payments, setPayments] = useState<CostPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [c, p, v] = await Promise.all([
      supabase.from("event_costs").select("*").eq("invitation_id", invitationId).order("sort_order").order("created_at"),
      supabase.from("event_cost_payments").select("*").eq("invitation_id", invitationId).order("due_date"),
      supabase.from("agency_vendors").select("id, name, category").eq("brand_id", brandId).order("name"),
    ]);
    setCosts((c.data as EventCost[]) || []);
    setPayments((p.data as CostPayment[]) || []);
    setVendors((v.data as Vendor[]) || []);
    setLoading(false);
  }, [invitationId, brandId]);

  useEffect(() => { load(); }, [load]);

  const totals = budgetTotals(costs, payments, confirmedGuests);
  const vendorName = (id: string | null) => vendors.find(v => v.id === id)?.name || "";

  // Fornecedor por nome: se ainda não existir no diretório da agência, é criado
  // agora. É assim que o diretório se constrói sozinho com o uso, sem obrigar
  // a agência a preenchê-lo antes de começar.
  const resolveVendor = async (name: string): Promise<string | null> => {
    const clean = name.trim();
    if (!clean) return null;
    const existing = vendors.find(v => v.name.toLowerCase() === clean.toLowerCase());
    if (existing) return existing.id;
    const { data } = await supabase
      .from("agency_vendors")
      .insert([{ brand_id: brandId, name: clean }])
      .select("id, name, category")
      .single();
    if (data) setVendors(prev => [...prev, data as Vendor].sort((a, b) => a.name.localeCompare(b.name)));
    return data?.id ?? null;
  };

  const addCost = async () => {
    if (!canEdit) return;
    setAdding(true);
    const { data } = await supabase
      .from("event_costs")
      .insert([{
        invitation_id: invitationId,
        category: "outros",
        description: "",
        pricing_mode: "fixed",
        unit_price_cents: 0,
        quantity: 1,
        budgeted_cents: 0,
        vat_pct: DEFAULT_VAT_PCT,
        // Privado por omissão: o honorário e as margens da agência nunca podem
        // escapar para o casal por distração.
        visibility: isAgency ? "agency" : "shared",
        sort_order: costs.length,
      }])
      .select("*")
      .single();
    if (data) {
      setCosts(prev => [...prev, data as EventCost]);
      setExpanded((data as EventCost).id);
    }
    setAdding(false);
  };

  const patchCost = async (id: string, patch: Partial<EventCost>) => {
    if (!canEdit) return;
    setCosts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    await supabase.from("event_costs").update(patch).eq("id", id);
  };

  const removeCost = async (id: string) => {
    if (!canEdit) return;
    setCosts(prev => prev.filter(c => c.id !== id));
    setPayments(prev => prev.filter(p => p.cost_id !== id));
    await supabase.from("event_costs").delete().eq("id", id);
  };

  const addPayment = async (costId: string) => {
    if (!canEdit) return;
    const { data } = await supabase
      .from("event_cost_payments")
      .insert([{ cost_id: costId, invitation_id: invitationId, label: "", amount_cents: 0 }])
      .select("*")
      .single();
    if (data) setPayments(prev => [...prev, data as CostPayment]);
  };

  const patchPayment = async (id: string, patch: Partial<CostPayment>) => {
    if (!canEdit) return;
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
    await supabase.from("event_cost_payments").update(patch).eq("id", id);
  };

  const removePayment = async (id: string) => {
    if (!canEdit) return;
    setPayments(prev => prev.filter(p => p.id !== id));
    await supabase.from("event_cost_payments").delete().eq("id", id);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors disabled:opacity-60";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block";

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">

      {/* ── Resumo ──────────────────────────────────────────────── */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h3 className="font-serif text-3xl text-brand">Orçamento</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">
              Custos, fornecedores e pagamentos
            </p>
          </div>
          <div className="flex items-center gap-2 bg-cream border border-gold-soft/60 rounded-full px-4 py-2">
            <Users size={14} className="text-brand" />
            <span className="text-[11px] font-bold text-ink tabular-nums">{confirmedGuests}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">confirmados</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Orçamentado", value: totals.budgeted, tone: "text-gray-500" },
            { label: "Contratado c/ IVA", value: totals.gross, tone: "text-ink" },
            { label: "Pago", value: totals.paid, tone: "text-green-600" },
            { label: "Por pagar", value: totals.outstanding, tone: "text-ink" },
            { label: "Vencido", value: totals.overdue, tone: totals.overdue > 0 ? "text-red-600" : "text-gray-300" },
          ].map(k => (
            <div key={k.label} className="bg-cream rounded-2xl border border-gray-100 p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{k.label}</p>
              <p className={`text-lg font-bold tabular-nums ${k.tone}`}>{formatCents(k.value, locale === "en" ? "en-GB" : "pt-PT")}</p>
            </div>
          ))}
        </div>

        {totals.gross > totals.budgeted && totals.budgeted > 0 && (
          <div className="mt-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-2xl px-4 py-3">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              O contratado ultrapassa o orçamentado em{" "}
              <strong>{formatCents(totals.gross - totals.budgeted, locale === "en" ? "en-GB" : "pt-PT")}</strong>.
            </span>
          </div>
        )}
      </section>

      {/* ── Linhas de custo ─────────────────────────────────────── */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-serif text-2xl text-ink">Custos</h4>
          {canEdit && (
            <button
              onClick={addCost}
              disabled={adding}
              className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50"
            >
              <Plus size={14} /> Adicionar custo
            </button>
          )}
        </div>

        {costs.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            Ainda não há custos registados. Comece por adicionar o espaço ou o catering.
          </p>
        ) : (
          <div className="space-y-3">
            {costs.map(cost => {
              const qty = effectiveQuantity(cost, confirmedGuests);
              const gross = costGrossCents(cost, confirmedGuests);
              const costPayments = payments.filter(p => p.cost_id === cost.id);
              const paid = costPayments.filter(p => p.paid_at).reduce((s, p) => s + p.amount_cents, 0);
              const isOpen = expanded === cost.id;

              return (
                <div key={cost.id} className={`border rounded-2xl transition-colors ${isOpen ? "border-brand/30 bg-cream/40" : "border-gray-100 bg-white hover:border-gray-200"}`}>

                  {/* Linha fechada */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : cost.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand bg-brand/5 px-2 py-0.5 rounded-md">
                          {CATEGORY_LABELS[cost.category] || cost.category}
                        </span>
                        {cost.pricing_mode === "per_person" && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                            {qty} × por pessoa
                          </span>
                        )}
                        {isAgency && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1"
                            title={cost.visibility === "shared" ? "Visível para o casal" : "Privado da agência"}
                          >
                            {cost.visibility === "shared" ? <Eye size={11} /> : <EyeOff size={11} />}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-ink mt-1.5 truncate">
                        {cost.description || "Sem descrição"}
                        {vendorName(cost.vendor_id) && (
                          <span className="text-gray-400 font-normal"> · {vendorName(cost.vendor_id)}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-ink tabular-nums">{formatCents(gross, locale === "en" ? "en-GB" : "pt-PT")}</p>
                      {costPayments.length > 0 && (
                        <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">
                          {formatCents(paid, locale === "en" ? "en-GB" : "pt-PT")} pago
                        </p>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Linha aberta */}
                  {isOpen && (
                    <div className={`px-4 pb-5 pt-1 border-t border-gray-100 ${!canEdit ? "opacity-70 pointer-events-none" : ""}`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={labelCls}>Categoria</label>
                          <select
                            className={inputCls}
                            value={cost.category}
                            onChange={e => patchCost(cost.id, { category: e.target.value })}
                          >
                            {COST_CATEGORIES.map(c => (
                              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className={labelCls}>Fornecedor</label>
                          <input
                            className={inputCls}
                            list="dis-vendors"
                            defaultValue={vendorName(cost.vendor_id)}
                            placeholder="Nome"
                            onBlur={async e => {
                              const id = await resolveVendor(e.target.value);
                              if (id !== cost.vendor_id) patchCost(cost.id, { vendor_id: id });
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>Descrição</label>
                          <input
                            className={inputCls}
                            defaultValue={cost.description || ""}
                            placeholder="Ex: Jantar e bar aberto"
                            onBlur={e => patchCost(cost.id, { description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
                        <div>
                          <label className={labelCls}>Modo</label>
                          <select
                            className={inputCls}
                            value={cost.pricing_mode}
                            onChange={e => patchCost(cost.id, { pricing_mode: e.target.value as EventCost["pricing_mode"] })}
                          >
                            <option value="fixed">Valor fixo</option>
                            <option value="per_person">Por pessoa</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>{cost.pricing_mode === "per_person" ? "Preço/pessoa" : "Preço unitário"}</label>
                          <input
                            className={inputCls}
                            inputMode="decimal"
                            defaultValue={(cost.unit_price_cents / 100).toFixed(2).replace(".", ",")}
                            onBlur={e => patchCost(cost.id, { unit_price_cents: parseAmountToCents(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Quantidade</label>
                          <input
                            className={inputCls}
                            type="number"
                            min={0}
                            disabled={cost.pricing_mode === "per_person"}
                            value={cost.pricing_mode === "per_person" ? confirmedGuests : cost.quantity}
                            onChange={e => patchCost(cost.id, { quantity: parseInt(e.target.value) || 0 })}
                            title={cost.pricing_mode === "per_person" ? "Vem dos convidados confirmados" : undefined}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>IVA %</label>
                          <input
                            className={inputCls}
                            inputMode="decimal"
                            defaultValue={String(cost.vat_pct)}
                            onBlur={e => patchCost(cost.id, { vat_pct: parseFloat(e.target.value.replace(",", ".")) || 0 })}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Orçamentado</label>
                          <input
                            className={inputCls}
                            inputMode="decimal"
                            defaultValue={(cost.budgeted_cents / 100).toFixed(2).replace(".", ",")}
                            onBlur={e => patchCost(cost.id, { budgeted_cents: parseAmountToCents(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Sem IVA <strong className="text-ink tabular-nums">{formatCents(costNetCents(cost, confirmedGuests), locale === "en" ? "en-GB" : "pt-PT")}</strong>
                          <span className="mx-2 text-gray-200">·</span>
                          Com IVA <strong className="text-ink tabular-nums">{formatCents(gross, locale === "en" ? "en-GB" : "pt-PT")}</strong>
                        </p>
                        <div className="flex items-center gap-3">
                          {isAgency && (
                            <button
                              onClick={() => patchCost(cost.id, { visibility: cost.visibility === "shared" ? "agency" : "shared" })}
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
                            >
                              {cost.visibility === "shared" ? <Eye size={13} /> : <EyeOff size={13} />}
                              {cost.visibility === "shared" ? "Visível ao casal" : "Privado"}
                            </button>
                          )}
                          <button
                            onClick={() => removeCost(cost.id)}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} /> Remover
                          </button>
                        </div>
                      </div>

                      {/* Marcos de pagamento */}
                      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className={labelCls + " mb-0"}>Pagamentos</p>
                          <button
                            onClick={() => addPayment(cost.id)}
                            className="text-[10px] font-bold text-brand uppercase tracking-widest hover:opacity-70 transition-opacity"
                          >
                            + Marco
                          </button>
                        </div>
                        {costPayments.length === 0 ? (
                          <p className="text-xs text-gray-300 py-2">Sem pagamentos definidos — ex: sinal, reforço, restante.</p>
                        ) : (
                          <div className="space-y-2">
                            {costPayments.map(p => (
                              <div key={p.id} className="flex flex-wrap items-center gap-2">
                                <input
                                  className={inputCls + " flex-1 min-w-[110px]"}
                                  defaultValue={p.label || ""}
                                  placeholder="Sinal"
                                  onBlur={e => patchPayment(p.id, { label: e.target.value })}
                                />
                                <input
                                  className={inputCls + " w-28"}
                                  inputMode="decimal"
                                  defaultValue={(p.amount_cents / 100).toFixed(2).replace(".", ",")}
                                  onBlur={e => patchPayment(p.id, { amount_cents: parseAmountToCents(e.target.value) })}
                                />
                                <input
                                  className={inputCls + " w-36"}
                                  type="date"
                                  defaultValue={p.due_date || ""}
                                  onChange={e => patchPayment(p.id, { due_date: e.target.value || null })}
                                />
                                <button
                                  onClick={() => patchPayment(p.id, { paid_at: p.paid_at ? null : new Date().toISOString().slice(0, 10) })}
                                  className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-colors ${
                                    p.paid_at ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                >
                                  {p.paid_at ? "Pago" : "Por pagar"}
                                </button>
                                <button
                                  onClick={() => removePayment(p.id)}
                                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shrink-0"
                                  aria-label="Remover pagamento"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Sugestões do diretório da agência, para o campo de fornecedor */}
        <datalist id="dis-vendors">
          {vendors.map(v => <option key={v.id} value={v.name} />)}
        </datalist>
      </section>
    </div>
  );
}
