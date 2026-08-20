"use client";
import { useState } from "react";
import { Users, AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { formatCents, parseAmountToCents, budgetHealth, type BudgetTotals, type CostGroup } from "@/lib/planner";

// Cabeçalho do Orçamento: a leitura de conjunto antes da lista de linhas.
//
// Duas perguntas, por esta ordem: "quanto do bolo já está comprometido?"
// (medidor face ao orçamento total) e "onde está esse dinheiro?" (barras por
// fornecedor/categoria). A lista de custos por baixo é a vista em tabela
// destes mesmos números — nenhum valor aqui existe só dentro de um gráfico.

interface Props {
  totals: BudgetTotals;
  budgetTotalCents: number;
  onBudgetTotalChange: (cents: number) => void;
  vendorGroups: CostGroup[];
  categoryGroups: CostGroup[];
  confirmedGuests: number;
  canEdit: boolean;
  locale: string;
}

// Barras num só tom (o bordô da marca): a identidade está no rótulo de cada
// linha, não na cor. Dar uma cor diferente a cada fornecedor gastaria o único
// canal livre a repetir o que o comprimento da barra já diz.
const BAR_FILL = "bg-brand";
const BAR_TRACK = "bg-brand/10";

export default function BudgetSummary({
  totals,
  budgetTotalCents,
  onBudgetTotalChange,
  vendorGroups,
  categoryGroups,
  confirmedGuests,
  canEdit,
  locale,
}: Props) {
  const en = locale === "en";
  const money = (cents: number) => formatCents(cents, en ? "en-GB" : "pt-PT");
  const [dimension, setDimension] = useState<"vendor" | "category">("vendor");
  // O campo do orçamento mostra o valor formatado ("20 000,00 €") em repouso
  // e os dígitos crus só enquanto está a ser editado — sem isto ficava um
  // "20000,00" solto, destoante de todos os outros números do ecrã.
  const [budgetFocused, setBudgetFocused] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");

  const health = budgetHealth(totals.gross, budgetTotalCents);
  const pctUsed = budgetTotalCents > 0 ? (totals.gross / budgetTotalCents) * 100 : 0;
  const remaining = budgetTotalCents - totals.gross;

  const METER = {
    under: { fill: "bg-brand", text: "text-brand" },
    close: { fill: "bg-amber-500", text: "text-amber-600" },
    over: { fill: "bg-red-500", text: "text-red-600" },
  }[health];

  const groups = dimension === "vendor" ? vendorGroups : categoryGroups;
  const groupsTotal = groups.reduce((sum, g) => sum + g.cents, 0);
  const largest = groups[0]?.cents || 0;

  const tiles = [
    { label: en ? "Paid" : "Pago", value: totals.paid, tone: "text-green-600" },
    { label: en ? "Outstanding" : "Por pagar", value: totals.outstanding, tone: "text-ink" },
    { label: en ? "Overdue" : "Vencido", value: totals.overdue, tone: totals.overdue > 0 ? "text-red-600" : "text-gray-300" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Orçamento vs. contratado ────────────────────────────── */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h3 className="font-serif text-3xl text-brand">{en ? "Budget" : "Orçamento"}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">
              {en ? "Costs, vendors and payments" : "Custos, fornecedores e pagamentos"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-cream border border-gold-soft/60 rounded-full px-4 py-2">
            <Users size={14} className="text-brand" />
            <span className="text-[11px] font-bold text-ink tabular-nums">{confirmedGuests}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">
              {en ? "confirmed" : "confirmados"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          {/* Medidor */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {en ? "Committed (incl. VAT)" : "Contratado c/ IVA"}
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-ink leading-none">{money(totals.gross)}</p>

            <div className="mt-5">
              <div className={`h-2.5 w-full rounded-full overflow-hidden ${BAR_TRACK}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${METER.fill}`}
                  style={{ width: `${Math.min(100, Math.max(pctUsed, totals.gross > 0 ? 2 : 0))}%` }}
                />
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mt-2.5">
                <p className="text-xs text-gray-500">
                  {budgetTotalCents > 0 ? (
                    <>
                      <strong className={METER.text}>{Math.round(pctUsed)}%</strong>{" "}
                      {en ? "of the total budget" : "do orçamento total"}
                    </>
                  ) : (
                    <span className="text-gray-400">
                      {en ? "Set a total budget to track it." : "Defina um orçamento total para acompanhar."}
                    </span>
                  )}
                </p>
                {budgetTotalCents > 0 && (
                  <p className={`text-xs font-bold ${remaining < 0 ? "text-red-600" : "text-gray-500"}`}>
                    {remaining < 0
                      ? `${money(-remaining)} ${en ? "over" : "acima"}`
                      : `${money(remaining)} ${en ? "left" : "disponível"}`}
                  </p>
                )}
              </div>
            </div>

            {health === "over" && budgetTotalCents > 0 && (
              <div className="mt-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl px-4 py-3">
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  {en ? "The committed total exceeds the budget by " : "O contratado ultrapassa o orçamento em "}
                  <strong>{money(-remaining)}</strong>.
                </span>
              </div>
            )}
            {health === "close" && (
              <div className="mt-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-2xl px-4 py-3">
                <TrendingUp size={15} className="shrink-0" />
                <span>
                  {en
                    ? "Little room left — under 15% of the budget is still free."
                    : "Resta pouca margem — menos de 15% do orçamento ainda por comprometer."}
                </span>
              </div>
            )}
          </div>

          {/* Orçamento total + estado dos pagamentos */}
          <div className="space-y-4">
            <div className="bg-cream rounded-2xl border border-gray-100 p-4">
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                {en ? "Total budget" : "Orçamento total"}
              </label>
              {canEdit ? (
                <input
                  className="w-full bg-transparent text-2xl font-bold text-ink outline-none border-b border-transparent focus:border-brand transition-colors placeholder:text-base placeholder:font-normal placeholder:text-gray-300"
                  inputMode="decimal"
                  value={budgetFocused ? budgetDraft : budgetTotalCents ? money(budgetTotalCents) : ""}
                  placeholder={en ? "Set a budget" : "Definir orçamento"}
                  onFocus={() => {
                    setBudgetDraft(budgetTotalCents ? (budgetTotalCents / 100).toFixed(2).replace(".", ",") : "");
                    setBudgetFocused(true);
                  }}
                  onChange={e => setBudgetDraft(e.target.value)}
                  onBlur={e => {
                    setBudgetFocused(false);
                    onBudgetTotalChange(parseAmountToCents(e.target.value));
                  }}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                />
              ) : (
                <p className="text-2xl font-bold text-ink">{money(budgetTotalCents)}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {tiles.map(tile => (
                <div key={tile.label} className="bg-cream rounded-2xl border border-gray-100 p-3 flex flex-col">
                  {/* min-h para os valores dos três cartões assentarem na mesma
                      linha, mesmo quando um rótulo passa para duas linhas. */}
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 leading-tight min-h-[2.1em]">{tile.label}</p>
                  <p className={`text-sm font-bold mt-auto ${tile.tone}`}>{money(tile.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Onde está o dinheiro ────────────────────────────────── */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <h4 className="font-serif text-2xl text-ink">{en ? "Where the money is" : "Onde está o dinheiro"}</h4>
            <p className="text-[11px] text-gray-400 mt-1">
              {en ? "Committed cost, incl. VAT" : "Custo contratado, com IVA"}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-cream rounded-full p-1 border border-gold-soft/50">
            {([
              ["vendor", en ? "Vendor" : "Fornecedor"],
              ["category", en ? "Category" : "Categoria"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setDimension(value)}
                className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                  dimension === value ? "bg-brand text-white" : "text-gray-400 hover:text-brand"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            {en
              ? "Nothing committed yet — add a cost line to see the breakdown."
              : "Ainda nada contratado — adicione uma linha de custo para ver a distribuição."}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Rótulo e valor por cima, barra a toda a largura por baixo: num
                telemóvel, pôr os três lado a lado deixava à barra ~60px e
                nenhuma comparação era legível. */}
            {groups.map(group => {
              const share = groupsTotal > 0 ? (group.cents / groupsTotal) * 100 : 0;
              return (
                <div key={group.key}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <p className="text-xs text-ink truncate" title={group.label}>{group.label}</p>
                    <p className="shrink-0 text-xs">
                      <span className="font-bold text-ink tabular-nums">{money(group.cents)}</span>
                      <span className="text-gray-400 tabular-nums ml-1.5">{share.toFixed(0)}%</span>
                    </p>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden ${BAR_TRACK}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${BAR_FILL}`}
                      style={{ width: `${largest > 0 ? Math.max((group.cents / largest) * 100, 2) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex items-baseline justify-between gap-3 pt-4 border-t border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {en ? "Total" : "Total"}
              </p>
              <p className="text-sm font-bold text-ink tabular-nums">{money(groupsTotal)}</p>
            </div>
          </div>
        )}

        {groups.length > 0 && (
          <p className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-5">
            <Wallet size={11} className="shrink-0" />
            {en ? "Cancelled lines are excluded." : "Linhas canceladas não contam."}
          </p>
        )}
      </section>
    </div>
  );
}
