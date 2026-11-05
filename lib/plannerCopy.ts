import { dueDateFromOffset, type EventCost, type EventTask } from "@/lib/planner";

// Copiar a checklist e o orçamento de outro casamento — a forma mais barata de
// a agência reaproveitar o seu próprio método (o pedido nº 1 previsto para o
// piloto: "modelos da agência"). Funções puras: devolvem as linhas a inserir.

const DAY_MS = 86400000;

/** "N dias antes do casamento" a partir de uma data-limite e da data do casamento. */
export function offsetFromDates(dueISO: string | null | undefined, eventDate: string | null | undefined): number | null {
  if (!dueISO || !eventDate) return null;
  const due = new Date(dueISO.slice(0, 10)).getTime();
  const ev = new Date(eventDate.slice(0, 10)).getTime();
  if (Number.isNaN(due) || Number.isNaN(ev)) return null;
  return Math.round((ev - due) / DAY_MS);
}

/**
 * Tarefas copiadas: tudo volta a "por fazer" e sem pessoa atribuída; os prazos
 * passam a contar a partir da data do casamento novo (o desvio é guardado, para
 * se recalcularem se a data mudar). Tarefas do casal/conjuntas são sempre
 * partilhadas — a base de dados impõe-no.
 */
export function copiedTaskRows(
  source: EventTask[],
  opts: { sourceEventDate: string | null; targetEventDate: string | null; targetInvitationId: string; startOrder: number }
) {
  return source
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((t, i) => {
      const offset = t.due_offset_days ?? offsetFromDates(t.due_date, opts.sourceEventDate);
      return {
        invitation_id: opts.targetInvitationId,
        title: t.title,
        notes: t.notes,
        status: "todo",
        priority: t.priority,
        responsible: t.responsible,
        due_offset_days: offset,
        due_date: dueDateFromOffset(opts.targetEventDate, offset),
        visibility: t.responsible === "agency" ? t.visibility : "shared",
        sort_order: opts.startOrder + i,
      };
    });
}

/**
 * Linhas de orçamento copiadas: preços, modo (fixo/por pessoa/escalões/mínimo),
 * IVA e visibilidade mantêm-se; o estado volta a "a orçar" (é um casamento novo)
 * e não se copiam pagamentos, notas de reunião nem documentos. O fornecedor só
 * se mantém se os dois casamentos forem da mesma marca (o diretório é por marca).
 */
export function copiedCostRows(
  source: EventCost[],
  opts: { targetInvitationId: string; startOrder: number; keepVendors: boolean }
) {
  return source
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .filter(c => c.status !== "cancelado")
    .map((c, i) => ({
      invitation_id: opts.targetInvitationId,
      vendor_id: opts.keepVendors ? c.vendor_id : null,
      category: c.category,
      description: c.description,
      pricing_mode: c.pricing_mode,
      unit_price_cents: c.unit_price_cents,
      quantity: c.quantity,
      vat_pct: c.vat_pct,
      status: "a_orcar",
      visibility: c.visibility,
      notes: c.notes,
      per_category: c.per_category ?? false,
      unit_price_child_cents: c.unit_price_child_cents ?? 0,
      unit_price_baby_cents: c.unit_price_baby_cents ?? 0,
      min_quantity: c.min_quantity ?? null,
      extra_unit_price_cents: c.extra_unit_price_cents ?? null,
      sort_order: opts.startOrder + i,
    }));
}
