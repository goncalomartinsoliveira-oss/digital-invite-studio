"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, ChevronDown, Eye, EyeOff, Loader2, MessageSquare, FileText, Upload, Wallet, Images, ChevronRight } from "lucide-react";
import BudgetSummary from "@/components/dashboard/BudgetSummary";
import SaveStatusBadge from "@/components/dashboard/SaveStatusBadge";
import { useSaveStatus } from "@/lib/useSaveStatus";
import { WEDDING_COST_TEMPLATE } from "@/lib/plannerTemplates";
import { COST_CATEGORY_TO_SECTION } from "@/lib/moodboard";
import {
  COST_CATEGORIES,
  COST_STATUSES,
  COST_STATUS_LABELS,
  DEFAULT_VAT_PCT,
  budgetTotals,
  costGrossCents,
  costNetCents,
  effectiveQuantity,
  formatCents,
  groupCosts,
  parseAmountToCents,
  guestCountsTotal,
  type CostNote,
  type CostPayment,
  type CostStatus,
  type EventCost,
  type EventDocument,
  type GuestCounts,
} from "@/lib/planner";

// Cor do estado do contrato — a fase da relação com o fornecedor, à parte de
// estar pago ou não (isso já é a secção de Pagamentos).
const STATUS_COLOR: Record<CostStatus, string> = {
  a_orcar: "text-gray-500 bg-gray-50 border-gray-100",
  orcamento_pedido: "text-blue-600 bg-blue-50 border-blue-100",
  em_negociacao: "text-amber-600 bg-amber-50 border-amber-100",
  contratado: "text-green-700 bg-green-50 border-green-100",
  cancelado: "text-red-500 bg-red-50 border-red-100",
};

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
  /** Confirmados por escalão etário — alimenta linhas "por pessoa", incluindo as que cobram por escalão. */
  confirmedGuestCounts: GuestCounts;
  locale: string;
  /** Abre a Inspiração já na secção correspondente a esta categoria de custo. */
  onOpenMoodboard?: (sectionId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  espaco: "Espaço", catering: "Catering", bebidas: "Bebidas", decoracao: "Decoração",
  flores: "Flores", fotografia: "Fotografia", video: "Vídeo", musica: "Música",
  bolo: "Bolo", convites: "Convites", beleza: "Beleza", vestuario: "Vestuário",
  transporte: "Transporte", honorarios: "Honorários", outros: "Outros",
};

export default function BudgetModule({ invitationId, brandId, canEdit, isAgency, confirmedGuestCounts, locale, onOpenMoodboard }: Props) {
  const confirmedGuests = guestCountsTotal(confirmedGuestCounts);
  const [costs, setCosts] = useState<EventCost[]>([]);
  const [payments, setPayments] = useState<CostPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  // Orçamento total do evento — um único número, vive em `invitations`
  // (ver 0008_budget_total.sql), não na soma das linhas de custo.
  const [budgetTotalCents, setBudgetTotalCents] = useState(0);
  const { status: saveStatus, track } = useSaveStatus("BudgetModule");
  // Histórico de reuniões/notas — sempre privado da agência (nem a RLS deixa
  // o casal ler), por isso só se pede quando quem está a ver é agência.
  const [notes, setNotes] = useState<CostNote[]>([]);
  const [newNoteDrafts, setNewNoteDrafts] = useState<Record<string, string>>({});
  // Documentos/contratos — `cost_id` nulo é um documento geral do evento
  // (ex.: contrato do espaço, cobre várias linhas); preenchido pertence a um
  // fornecedor específico. Chave "general" nos drafts/uploading é a secção
  // sem custo associado.
  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [newDocLabelDrafts, setNewDocLabelDrafts] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  // Secções da Inspiração com pelo menos uma imagem, para a linha de custo
  // poder oferecer o atalho só quando há mesmo alguma coisa para ver.
  const [sectionsWithItems, setSectionsWithItems] = useState<{ id: string; name: string; count: number }[]>([]);

  const load = useCallback(async () => {
    const [c, p, v, n, d, inv, mbSections, mbItems] = await Promise.all([
      supabase.from("event_costs").select("*").eq("invitation_id", invitationId).order("sort_order").order("created_at"),
      supabase.from("event_cost_payments").select("*").eq("invitation_id", invitationId).order("due_date"),
      supabase.from("agency_vendors").select("id, name, category").eq("brand_id", brandId).order("name"),
      isAgency
        ? supabase.from("event_cost_notes").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as CostNote[] }),
      supabase.from("event_documents").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false }),
      supabase.from("invitations").select("planner_budget_total_cents").eq("id", invitationId).maybeSingle(),
      supabase.from("event_moodboard_sections").select("id, name").eq("invitation_id", invitationId),
      supabase.from("event_moodboard_items").select("section_id").eq("invitation_id", invitationId),
    ]);
    setCosts((c.data as EventCost[]) || []);
    setPayments((p.data as CostPayment[]) || []);
    setBudgetTotalCents((inv.data as { planner_budget_total_cents: number } | null)?.planner_budget_total_cents || 0);
    setVendors((v.data as Vendor[]) || []);
    setNotes((n.data as CostNote[]) || []);
    setDocuments((d.data as EventDocument[]) || []);

    const counts = new Map<string, number>();
    ((mbItems.data as { section_id: string | null }[]) || []).forEach(item => {
      if (item.section_id) counts.set(item.section_id, (counts.get(item.section_id) || 0) + 1);
    });
    setSectionsWithItems(
      ((mbSections.data as { id: string; name: string }[]) || [])
        .map(sec => ({ ...sec, count: counts.get(sec.id) || 0 }))
        .filter(sec => sec.count > 0)
    );

    setLoading(false);
  }, [invitationId, brandId, isAgency]);

  useEffect(() => { load(); }, [load]);

  const totals = budgetTotals(costs, payments, confirmedGuestCounts);
  const vendorName = (id: string | null) => vendors.find(v => v.id === id)?.name || "";

  /** Secção da Inspiração ligada a esta categoria, se existir e tiver imagens. */
  const inspirationFor = (category: string) => {
    const name = COST_CATEGORY_TO_SECTION[category];
    if (!name) return null;
    return sectionsWithItems.find(sec => sec.name === name) || null;
  };

  const saveBudgetTotal = async (cents: number) => {
    if (!canEdit || cents === budgetTotalCents) return;
    setBudgetTotalCents(cents);
    await track(supabase.from("invitations").update({ planner_budget_total_cents: cents }).eq("id", invitationId));
  };

  const otherLabel = locale === "en" ? "Others" : "Outros";
  const vendorGroups = groupCosts(
    costs,
    confirmedGuestCounts,
    c => ({
      key: c.vendor_id || "__none__",
      label: vendorName(c.vendor_id) || (locale === "en" ? "No vendor" : "Sem fornecedor"),
    }),
    8,
    otherLabel
  );
  const categoryGroups = groupCosts(
    costs,
    confirmedGuestCounts,
    c => ({ key: c.category, label: CATEGORY_LABELS[c.category] || c.category }),
    8,
    otherLabel
  );

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
        vat_pct: DEFAULT_VAT_PCT,
        status: "a_orcar",
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

  /**
   * Ponto de partida: as rubricas que praticamente todos os casamentos têm,
   * a zeros. Catering e bebidas nascem em "por pessoa" — é assim que são
   * orçamentados, e é aí que a ligação aos confirmados ao vivo se paga.
   */
  const applyTemplate = async () => {
    if (!canEdit) return;
    if (!confirm(`Criar ${WEDDING_COST_TEMPLATE.length} rubricas de orçamento a zeros? Pode editar ou apagar qualquer uma a seguir.`)) return;
    setApplyingTemplate(true);
    const rows = WEDDING_COST_TEMPLATE.map((item, i) => ({
      invitation_id: invitationId,
      category: item.category,
      description: item.description,
      pricing_mode: item.pricingMode,
      unit_price_cents: 0,
      quantity: 1,
      vat_pct: DEFAULT_VAT_PCT,
      status: "a_orcar",
      visibility: isAgency ? "agency" : "shared",
      sort_order: costs.length + i,
    }));
    const { data } = await track(supabase.from("event_costs").insert(rows).select("*"));
    if (data) setCosts(prev => [...prev, ...(data as EventCost[])]);
    setApplyingTemplate(false);
  };

  const patchCost = async (id: string, patch: Partial<EventCost>) => {
    if (!canEdit) return;
    setCosts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    await track(supabase.from("event_costs").update(patch).eq("id", id));
  };

  // As duas variantes de "por pessoa" são mutuamente exclusivas (ver
  // 0009_cost_tiers_and_task_responsible.sql) — este par trata-as como um
  // seletor de três posições em vez de duas caixas independentes que
  // pudessem ficar ambas ligadas ao mesmo tempo.
  type PricingShape = "flat" | "category" | "minimum";
  const pricingShapeOf = (c: EventCost): PricingShape =>
    c.per_category ? "category" : c.min_quantity ? "minimum" : "flat";
  const setPricingShape = (c: EventCost, shape: PricingShape) => {
    if (shape === "flat") patchCost(c.id, { per_category: false, min_quantity: null, extra_unit_price_cents: null });
    else if (shape === "category") patchCost(c.id, { per_category: true, min_quantity: null, extra_unit_price_cents: null });
    else patchCost(c.id, { per_category: false, min_quantity: c.min_quantity || confirmedGuests || 1 });
  };

  const removeCost = async (id: string) => {
    if (!canEdit) return;
    setCosts(prev => prev.filter(c => c.id !== id));
    setPayments(prev => prev.filter(p => p.cost_id !== id));
    await track(supabase.from("event_costs").delete().eq("id", id));
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
    await track(supabase.from("event_cost_payments").update(patch).eq("id", id));
  };

  const removePayment = async (id: string) => {
    if (!canEdit) return;
    setPayments(prev => prev.filter(p => p.id !== id));
    await track(supabase.from("event_cost_payments").delete().eq("id", id));
  };

  const addNote = async (costId: string) => {
    const text = (newNoteDrafts[costId] || "").trim();
    if (!canEdit || !isAgency || !text) return;
    const { data } = await supabase
      .from("event_cost_notes")
      .insert([{ cost_id: costId, invitation_id: invitationId, note: text }])
      .select("*")
      .single();
    if (data) setNotes(prev => [data as CostNote, ...prev]);
    setNewNoteDrafts(prev => ({ ...prev, [costId]: "" }));
  };

  const removeNote = async (id: string) => {
    if (!canEdit || !isAgency) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    await track(supabase.from("event_cost_notes").delete().eq("id", id));
  };

  // costId null → documento geral do evento. draftKey identifica a secção nos
  // rascunhos de rótulo ("general" ou o id do custo).
  const uploadDocument = async (file: File, costId: string | null, draftKey: string) => {
    if (!canEdit) return;
    setUploadingDoc(draftKey);
    const ext = file.name.split(".").pop();
    const path = `event-documents/${invitationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("invites").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(path);
      const label = (newDocLabelDrafts[draftKey] || "").trim() || file.name;
      const { data } = await supabase
        .from("event_documents")
        .insert([{
          invitation_id: invitationId,
          cost_id: costId,
          name: label,
          file_url: publicUrl,
          // Mesma regra das restantes secções: privado por omissão.
          visibility: isAgency ? "agency" : "shared",
        }])
        .select("*")
        .single();
      if (data) setDocuments(prev => [data as EventDocument, ...prev]);
      setNewDocLabelDrafts(prev => ({ ...prev, [draftKey]: "" }));
    }
    setUploadingDoc(null);
  };

  const removeDocument = async (id: string) => {
    if (!canEdit) return;
    setDocuments(prev => prev.filter(d => d.id !== id));
    await track(supabase.from("event_documents").delete().eq("id", id));
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors disabled:opacity-60";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block";

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">

      <SaveStatusBadge status={saveStatus} locale={locale} />

      {/* ── Resumo: orçamento vs. contratado + onde está o dinheiro ── */}
      <BudgetSummary
        totals={totals}
        budgetTotalCents={budgetTotalCents}
        onBudgetTotalChange={saveBudgetTotal}
        vendorGroups={vendorGroups}
        categoryGroups={categoryGroups}
        confirmedGuests={confirmedGuests}
        canEdit={canEdit}
        locale={locale}
      />

      {/* ── Documentos gerais do evento (sem fornecedor associado) ── */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="mb-6">
          <h4 className="font-serif text-2xl text-ink">Documentos</h4>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">
            Contratos gerais — os ligados a um fornecedor específico ficam dentro de cada custo
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2 mb-5">
            <input
              className={inputCls}
              value={newDocLabelDrafts.general || ""}
              onChange={e => setNewDocLabelDrafts(prev => ({ ...prev, general: e.target.value }))}
              placeholder="Ex: Contrato da quinta"
            />
            <label className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all cursor-pointer shrink-0">
              {uploadingDoc === "general" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Carregar
              <input
                type="file"
                className="hidden"
                disabled={uploadingDoc === "general"}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocument(f, null, "general"); e.target.value = ""; }}
              />
            </label>
          </div>
        )}

        {documents.filter(d => !d.cost_id).length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sem documentos gerais.</p>
        ) : (
          <ul className="space-y-2">
            {documents.filter(d => !d.cost_id).map(doc => (
              <li key={doc.id} className="flex items-center gap-3 bg-cream/60 rounded-xl px-4 py-3">
                <FileText size={15} className="text-brand shrink-0" />
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm font-medium text-ink hover:text-brand transition-colors truncate">
                  {doc.name}
                </a>
                {canEdit && (
                  <button onClick={() => removeDocument(doc.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remover documento">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
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
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">Ainda não há custos registados.</p>
            {canEdit && (
              <>
                <button
                  onClick={applyTemplate}
                  disabled={applyingTemplate}
                  className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50 mt-4"
                >
                  {applyingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                  Começar com as rubricas típicas
                </button>
                <p className="text-[11px] text-gray-400 mt-3 max-w-xs mx-auto">
                  {WEDDING_COST_TEMPLATE.length} rubricas a zeros, prontas a preencher. Edite ou apague o que não se aplicar.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {costs.map(cost => {
              const qty = effectiveQuantity(cost, confirmedGuestCounts);
              const gross = costGrossCents(cost, confirmedGuestCounts);
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
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${STATUS_COLOR[cost.status]}`}>
                          {COST_STATUS_LABELS[cost.status]}
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
                        <div>
                          <label className={labelCls}>Estado do contrato</label>
                          <select
                            className={inputCls}
                            value={cost.status}
                            onChange={e => patchCost(cost.id, { status: e.target.value as CostStatus })}
                          >
                            {COST_STATUSES.map(s => (
                              <option key={s} value={s}>{COST_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {cost.pricing_mode === "per_person" && (
                        <div className="flex items-center gap-1 bg-cream rounded-full p-1 border border-gold-soft/50 w-fit mt-5">
                          {([
                            ["flat", "Preço único"],
                            ["category", "Por escalão"],
                            ["minimum", "Com mínimo"],
                          ] as const).map(([shape, label]) => (
                            <button
                              key={shape}
                              onClick={() => setPricingShape(cost, shape)}
                              disabled={!canEdit}
                              className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                                pricingShapeOf(cost) === shape ? "bg-brand text-white" : "text-gray-400 hover:text-brand"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
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
                          <label className={labelCls}>
                            {cost.pricing_mode !== "per_person" ? "Preço unitário" : cost.per_category ? "Preço/adulto" : "Preço/pessoa"}
                          </label>
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
                          {cost.pricing_mode === "per_person" && (
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              {cost.per_category
                                ? `${confirmedGuestCounts.adult} adultos · ${confirmedGuestCounts.child} crianças · ${confirmedGuestCounts.baby} bebés`
                                : cost.min_quantity
                                  ? `mínimo garantido: ${cost.min_quantity}`
                                  : "vem dos confirmados"}
                            </p>
                          )}
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
                      </div>

                      {cost.pricing_mode === "per_person" && cost.per_category && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className={labelCls}>Preço/criança</label>
                            <input
                              className={inputCls}
                              inputMode="decimal"
                              defaultValue={(cost.unit_price_child_cents / 100).toFixed(2).replace(".", ",")}
                              onBlur={e => patchCost(cost.id, { unit_price_child_cents: parseAmountToCents(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Preço/bebé</label>
                            <input
                              className={inputCls}
                              inputMode="decimal"
                              defaultValue={(cost.unit_price_baby_cents / 100).toFixed(2).replace(".", ",")}
                              onBlur={e => patchCost(cost.id, { unit_price_baby_cents: parseAmountToCents(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}

                      {cost.pricing_mode === "per_person" && !cost.per_category && cost.min_quantity != null && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className={labelCls}>Mínimo de convidados</label>
                            <input
                              className={inputCls}
                              type="number"
                              min={0}
                              defaultValue={cost.min_quantity}
                              onBlur={e => patchCost(cost.id, { min_quantity: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Preço extra/pessoa</label>
                            <input
                              className={inputCls}
                              inputMode="decimal"
                              placeholder="= preço normal"
                              defaultValue={cost.extra_unit_price_cents != null ? (cost.extra_unit_price_cents / 100).toFixed(2).replace(".", ",") : ""}
                              onBlur={e => {
                                const raw = e.target.value.trim();
                                patchCost(cost.id, { extra_unit_price_cents: raw === "" ? null : parseAmountToCents(raw) });
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Ponte para a Inspiração: só aparece quando a secção
                          correspondente existe e tem mesmo imagens. */}
                      {(() => {
                        const inspiration = inspirationFor(cost.category);
                        if (!inspiration || !onOpenMoodboard) return null;
                        return (
                          <button
                            onClick={() => onOpenMoodboard(inspiration.id)}
                            className="w-full flex items-center gap-2 mt-4 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-left hover:border-gold-soft transition-colors group"
                          >
                            <Images size={14} className="text-brand shrink-0" />
                            <span className="flex-1 text-xs text-gray-500">
                              {inspiration.count} {inspiration.count === 1 ? "inspiração" : "inspirações"} em{" "}
                              <strong className="text-ink font-medium">{inspiration.name}</strong>
                            </span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-brand transition-colors shrink-0" />
                          </button>
                        );
                      })()}

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Sem IVA <strong className="text-ink tabular-nums">{formatCents(costNetCents(cost, confirmedGuestCounts), locale === "en" ? "en-GB" : "pt-PT")}</strong>
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

                      {/* Histórico de reuniões/notas — nunca visível ao casal,
                          nem sequer pela RLS (ver 0002_task_priority_vendor_status). */}
                      {isAgency && (
                        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
                          <p className={labelCls}>Reuniões e notas</p>
                          <div className="flex gap-2 mt-2">
                            <input
                              className={inputCls}
                              value={newNoteDrafts[cost.id] || ""}
                              onChange={e => setNewNoteDrafts(prev => ({ ...prev, [cost.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") addNote(cost.id); }}
                              placeholder="Ex: Reunião dia 3 — confirmaram menu vegetariano"
                            />
                            <button
                              onClick={() => addNote(cost.id)}
                              disabled={!(newNoteDrafts[cost.id] || "").trim()}
                              className="inline-flex items-center gap-1.5 bg-brand/5 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-40 shrink-0"
                            >
                              <MessageSquare size={13} /> Registar
                            </button>
                          </div>
                          {notes.filter(n => n.cost_id === cost.id).length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {notes.filter(n => n.cost_id === cost.id).map(n => (
                                <li key={n.id} className="flex items-start gap-2 text-xs bg-cream/60 rounded-xl px-3 py-2.5">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-ink">{n.note}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {new Date(n.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeNote(n.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                                    aria-label="Remover nota"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Documentos deste fornecedor */}
                      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
                        <p className={labelCls}>Documentos</p>
                        {canEdit && (
                          <div className="flex gap-2 mt-2">
                            <input
                              className={inputCls}
                              value={newDocLabelDrafts[cost.id] || ""}
                              onChange={e => setNewDocLabelDrafts(prev => ({ ...prev, [cost.id]: e.target.value }))}
                              placeholder="Ex: Contrato assinado"
                            />
                            <label className="inline-flex items-center gap-1.5 bg-brand/5 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all cursor-pointer shrink-0">
                              {uploadingDoc === cost.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              Carregar
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploadingDoc === cost.id}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocument(f, cost.id, cost.id); e.target.value = ""; }}
                              />
                            </label>
                          </div>
                        )}
                        {documents.filter(d => d.cost_id === cost.id).length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {documents.filter(d => d.cost_id === cost.id).map(doc => (
                              <li key={doc.id} className="flex items-center gap-2 bg-cream/60 rounded-xl px-3 py-2.5 text-xs">
                                <FileText size={13} className="text-brand shrink-0" />
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 font-medium text-ink hover:text-brand transition-colors truncate">
                                  {doc.name}
                                </a>
                                {canEdit && (
                                  <button onClick={() => removeDocument(doc.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label="Remover documento">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
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
