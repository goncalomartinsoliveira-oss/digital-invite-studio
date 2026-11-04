"use client";
import { useEffect, useMemo, useState } from "react";
import { Link2, ChevronDown, Copy, Check, RefreshCw, Trash2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  type GuestLinkRow,
  type LinkMember,
  buildGuestLinkUrl,
  generateGuestToken,
  guestLinksToCsv,
  resolveGuestLink,
  autoDisplayName,
  autoSeats,
} from "@/lib/guestLinks";

// Links personalizados por grupo de convidados — 100% opcional. Fechado por
// omissão: quem prefere um único link para todos nem precisa de abrir isto, e
// sem nenhuma linha em guest_links o convite e o RSVP funcionam como sempre.
// Fica por cima da lista de convidados (GuestsModule) mas não depende dela;
// só lê a lista que recebe e guarda em guest_links (RLS: quem edita o evento).

type Dict = {
  title: string; badge: string; intro: string; open: string; close: string; summary: string;
  generateAll: string; generating: string; exportCsv: string;
  colGroup: string; colName: string; colSeats: string; colLink: string;
  noLink: string; auto: string; copy: string; copied: string; regenerate: string; revoke: string;
  confirmRegenerate: string; confirmRevoke: string; noGroups: string; error: string; generalNote: string;
  csvHeaders: string[]; seatsHint: string;
  colSeen: string; notOpened: string; openedSummary: string; onlyUnopened: string; openedTitle: string;
};

type GuestLike = { id: string; name: string; category: string; status: string; group_id?: string | null };

type Props = {
  invitationId: string;
  slug: string;
  locale: string;
  guests: GuestLike[];
  canEdit: boolean;
  dict: Dict;
};

type Group = { groupId: string; members: LinkMember[] };

export default function GuestLinksPanel({ invitationId, slug, locale, guests, canEdit, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<GuestLinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [onlyUnopened, setOnlyUnopened] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!invitationId) return;
    let cancelled = false;
    supabase.from("guest_links").select("*").eq("invitation_id", invitationId).then(({ data, error: err }) => {
      if (cancelled) return;
      // Tabela ainda não criada (migração 0010 por correr) → painel simplesmente vazio.
      if (!err && data) setRows(data as GuestLinkRow[]);
    });
    return () => { cancelled = true; };
  }, [invitationId]);

  // Grupos reais: sem pedidos de convite (REQ-) nem convidados sem grupo.
  const groups: Group[] = useMemo(() => {
    const map = new Map<string, LinkMember[]>();
    for (const g of guests) {
      if (!g.group_id || g.status === "requested" || g.group_id.startsWith("REQ-")) continue;
      const list = map.get(g.group_id) || [];
      list.push({ id: g.id, name: g.name, category: g.category });
      map.set(g.group_id, list);
    }
    return Array.from(map, ([groupId, members]) => ({ groupId, members }))
      .sort((a, b) => (a.members[0]?.name || "").localeCompare(b.members[0]?.name || "", locale));
  }, [guests, locale]);

  const rowByGroup = useMemo(() => new Map(rows.map(r => [r.group_id, r])), [rows]);
  const withLink = groups.filter(g => rowByGroup.has(g.groupId)).length;
  const missing = groups.filter(g => !rowByGroup.has(g.groupId));
  const opened = groups.filter(g => (rowByGroup.get(g.groupId)?.open_count ?? 0) > 0).length;
  const visibleGroups = onlyUnopened ? groups.filter(g => rowByGroup.has(g.groupId) && !(rowByGroup.get(g.groupId)?.open_count)) : groups;
  const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  const fail = () => { setError(true); setTimeout(() => setError(false), 4000); };

  const generateMissing = async () => {
    if (missing.length === 0) return;
    setBusy(true);
    const payload = missing.map(g => ({ invitation_id: invitationId, group_id: g.groupId, token: generateGuestToken() }));
    const { data, error: err } = await supabase.from("guest_links").insert(payload).select("*");
    if (err || !data) fail(); else setRows(prev => [...prev, ...(data as GuestLinkRow[])]);
    setBusy(false);
  };

  const patch = async (row: GuestLinkRow, changes: Partial<GuestLinkRow>) => {
    const { error: err } = await supabase.from("guest_links").update(changes).eq("id", row.id);
    if (err) { fail(); return; }
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, ...changes } : r)));
  };

  const groupName = (g: Group, row?: GuestLinkRow) => resolveGuestLink(g.members, row || null).displayName || g.members[0]?.name || "";

  const regenerate = async (g: Group, row: GuestLinkRow) => {
    if (!confirm(dict.confirmRegenerate.replace("{name}", groupName(g, row)))) return;
    await patch(row, { token: generateGuestToken() });
  };

  const revoke = async (g: Group, row: GuestLinkRow) => {
    if (!confirm(dict.confirmRevoke.replace("{name}", groupName(g, row)))) return;
    const { error: err } = await supabase.from("guest_links").delete().eq("id", row.id);
    if (err) { fail(); return; }
    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  const urlFor = (row: GuestLinkRow) => buildGuestLinkUrl(origin, locale, slug, row.token);

  const copy = async (row: GuestLinkRow) => {
    try {
      await navigator.clipboard.writeText(urlFor(row));
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(c => (c === row.id ? null : c)), 2000);
    } catch { /* sem permissão — o link está visível no campo */ }
  };

  const exportCsv = () => {
    const data = groups.flatMap(g => {
      const row = rowByGroup.get(g.groupId);
      if (!row) return [];
      const r = resolveGuestLink(g.members, row);
      return [{ name: r.displayName, seats: r.seats, url: urlFor(row) }];
    });
    const blob = new Blob([guestLinksToCsv(data, [dict.csvHeaders[0], dict.csvHeaders[1], dict.csvHeaders[2]])], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `links-convidados-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-brand disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <section data-guest-links className="mb-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center gap-4 p-5 sm:p-6 text-left">
        <span className="w-11 h-11 rounded-2xl bg-cream border border-gold-soft/70 flex items-center justify-center text-brand shrink-0">
          <Link2 size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2.5">
            <span className="font-serif text-lg text-ink">{dict.title}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md">{dict.badge}</span>
          </span>
          <span className="block text-xs text-gray-400 mt-0.5">
            {groups.length > 0 ? dict.summary.replace("{with}", String(withLink)).replace("{total}", String(groups.length)) : dict.noGroups}
            {withLink > 0 && ` · ${dict.openedSummary.replace("{n}", String(opened)).replace("{total}", String(withLink))}`}
          </span>
        </span>
        <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand shrink-0">
          {open ? dict.close : dict.open} <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
        <ChevronDown size={16} className={`sm:hidden text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 border-t border-gray-50 pt-5">
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">{dict.intro}</p>
          <p className="text-[11px] text-gray-400 mt-2">{dict.generalNote}</p>

          {groups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {canEdit && (
                <button
                  onClick={generateMissing}
                  disabled={busy || missing.length === 0}
                  className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-40"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                  {busy ? dict.generating : `${dict.generateAll}${missing.length ? ` (${missing.length})` : ""}`}
                </button>
              )}
              <button
                onClick={exportCsv}
                disabled={withLink === 0}
                className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all disabled:opacity-40"
              >
                <Download size={12} /> {dict.exportCsv}
              </button>
              {withLink > 0 && (
                <label className="flex items-center gap-2 text-[11px] text-gray-500 ml-1 cursor-pointer select-none">
                  <input type="checkbox" checked={onlyUnopened} onChange={e => setOnlyUnopened(e.target.checked)} className="accent-[#630100]" />
                  {dict.onlyUnopened}
                </label>
              )}
              {error && <span className="text-[11px] text-red-500">{dict.error}</span>}
            </div>
          )}

          {groups.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[920px]">
                <thead>
                  <tr className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="py-2 pr-3 font-bold w-44">{dict.colGroup}</th>
                    <th className="py-2 pr-3 font-bold w-48">{dict.colName}</th>
                    <th className="py-2 pr-3 font-bold w-24" title={dict.seatsHint}>{dict.colSeats}</th>
                    <th className="py-2 pr-3 font-bold w-32">{dict.colSeen}</th>
                    <th className="py-2 font-bold">{dict.colLink}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleGroups.map(g => {
                    const row = rowByGroup.get(g.groupId);
                    return (
                      <tr key={g.groupId} data-group={g.groupId} className="align-middle">
                        <td className="py-3 pr-3 text-gray-600 max-w-[220px]">
                          <span className="line-clamp-2">{g.members.map(m => m.name).join(", ")}</span>
                        </td>
                        <td className="py-3 pr-3">
                          {row ? (
                            <input
                              key={`${row.id}-${row.display_name ?? ""}`}
                              className={inputCls}
                              defaultValue={row.display_name ?? ""}
                              placeholder={autoDisplayName(g.members) || dict.auto}
                              disabled={!canEdit}
                              onBlur={e => {
                                const v = e.target.value.trim();
                                if (v !== (row.display_name ?? "")) patch(row, { display_name: v || null });
                              }}
                            />
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 pr-3">
                          {row ? (
                            <input
                              key={`${row.id}-${row.seats_override ?? ""}`}
                              type="number"
                              min={0}
                              max={99}
                              className={inputCls}
                              defaultValue={row.seats_override ?? ""}
                              placeholder={String(autoSeats(g.members))}
                              disabled={!canEdit}
                              onBlur={e => {
                                const raw = e.target.value.trim();
                                const v = raw === "" ? null : Math.max(0, Math.min(99, parseInt(raw, 10) || 0));
                                if (v !== row.seats_override) patch(row, { seats_override: v });
                              }}
                            />
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 pr-3 text-[11px]" data-seen={row?.open_count ? "yes" : "no"}>
                          {!row ? <span className="text-gray-300">—</span> : row.open_count ? (
                            <span className="text-gray-600" title={dict.openedTitle.replace("{first}", fmtDate(row.first_opened_at)).replace("{count}", String(row.open_count))}>
                              {fmtDate(row.last_opened_at)} <span className="text-gray-400">· {row.open_count}×</span>
                            </span>
                          ) : <span className="text-gray-400">{dict.notOpened}</span>}
                        </td>
                        <td className="py-3">
                          {row ? (
                            <div className="flex items-center gap-2">
                              <span className="flex-1 min-w-0 truncate font-mono text-[10px] text-gray-400 bg-cream rounded-md px-2 py-1.5" title={urlFor(row)}>{urlFor(row)}</span>
                              <button onClick={() => copy(row)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:text-brand hover:bg-gray-50 shrink-0">
                                {copiedId === row.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                {copiedId === row.id ? dict.copied : dict.copy}
                              </button>
                              {canEdit && (
                                <>
                                  <button onClick={() => regenerate(g, row)} title={dict.regenerate} aria-label={dict.regenerate} className="p-2 text-gray-400 hover:text-brand rounded-full hover:bg-gray-50">
                                    <RefreshCw size={13} />
                                  </button>
                                  <button onClick={() => revoke(g, row)} title={dict.revoke} aria-label={dict.revoke} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : <span className="text-gray-300">{dict.noLink}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
