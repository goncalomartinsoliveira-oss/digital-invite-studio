"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRANDS } from "@/lib/brands";
import { isArchivedEvent, isExpiredEvent } from "@/lib/eventArchive";
import { ExternalLink, Users, CheckCircle2, Archive, Mail, Trash2, Loader2, X, Search } from "lucide-react";

interface AdminManagementViewProps {
  events: any[];                                   // eventos no âmbito (marca ou todas)
  guestCounts: Record<string, { total: number; confirmed: number }>;
  showBrand: boolean;                              // mostrar coluna de marca (super-admin)
  brands?: { id: string; name: string }[];          // marcas conhecidas (código + BD), para resolver o nome
  locale: string;
  onOpen: (slug: string) => void;
  // Só super admin: avisar os noivos do fim do prazo e apagar o conteúdo dos
  // expirados (app/api/admin/expiry-notice e event-cleanup).
  canCleanup?: boolean;
  initialTab?: "active" | "archived";
}

type CleanupResult = { id: string; name: string; ok?: boolean; skipped?: string; error?: string; warning?: string; files?: number; guests?: number; messages?: number };

async function adminPost(path: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Erro");
  return json;
}

export default function AdminManagementView({ events: allEvents, guestCounts, showBrand, brands, locale, onOpen, canCleanup, initialTab = "active" }: AdminManagementViewProps) {
  const en = locale === "en";
  const t = {
    title: en ? "All events" : "Todos os eventos",
    subtitle: en ? "Every event, with filters by partner and by publication." : "Todos os eventos, com filtros por parceiro e por publicação.",
    search: en ? "Search couple or email…" : "Pesquisar casal ou e-mail…",
    allBrands: en ? "All partners" : "Todos os parceiros",
    direct: en ? "Direct (DIS)" : "Diretos (DIS)",
    allPub: en ? "Published or not" : "Publicados ou não",
    published: en ? "Published" : "Publicado",
    unpublished: en ? "Not published" : "Por publicar",
    publishedPlural: en ? "Published" : "Publicados",
    unpublishedPlural: en ? "Not published" : "Por publicar",
    couple: en ? "Couple" : "Casal",
    brand: en ? "Brand" : "Marca",
    date: en ? "Event date" : "Data do evento",
    registered: en ? "Registered" : "Registado em",
    status: en ? "Status" : "Estado",
    guests: en ? "Guests" : "Convidados",
    confirmed: en ? "Confirmed" : "Confirmados",
    upcoming: en ? "Upcoming" : "Próximo",
    past: en ? "Past" : "Passado",
    draft: en ? "Draft" : "Rascunho",
    open: en ? "Open" : "Abrir",
    empty: en ? "No events yet." : "Ainda não há eventos.",
    total: en ? "events" : "eventos",
    active: en ? "Active" : "Ativos",
    archived: en ? "Archived" : "Arquivados",
    archivedHint: en
      ? "Weddings that have already happened. Each one stays online until 60 days after the event."
      : "Casamentos que já aconteceram. Cada um fica online até 60 dias depois do evento.",
    availability: en ? "Online until" : "Online até",
    expiredOn: en ? "Expired on" : "Expirou a",
    noExpiry: en ? "No end date" : "Sem data de fim",
    actions: en ? "Actions" : "Ações",
    notify: en ? "Send notice" : "Enviar aviso",
    notifyAll: en ? "Send notice to all" : "Enviar aviso a todos",
    notifiedOn: en ? "Notice sent" : "Aviso enviado",
    notifyConfirm: en
      ? "Send the end-of-period email to {n} couple(s)? It tells them until when their photos and messages are available and how to download them."
      : "Enviar o e-mail de fim de prazo a {n} casal(is)? Diz-lhes até quando ficam disponíveis as fotos e as mensagens e como as descarregar.",
    purge: en ? "Delete content" : "Apagar conteúdo",
    purgeAll: en ? "Delete content of all expired" : "Apagar conteúdo de todos os expirados",
    purgedOn: en ? "Content deleted" : "Conteúdo apagado",
    purgeTitle: en ? "Delete content" : "Apagar conteúdo",
    purgeIntro: en ? "This will permanently delete, for each event below:" : "Isto apaga de forma definitiva, em cada evento abaixo:",
    purgeWhat: en
      ? "Guests' photos, videos and audio, invitation images, guest list, tables, family links, guestbook messages, access code and invitation texts."
      : "Fotos, vídeos e áudios dos convidados, imagens do convite, lista de convidados, mesas, links por família, mensagens do livro de visitas, código de acesso e textos do convite.",
    purgeKeep: en
      ? "Kept: the event record (names, date, brand), payments and all Wedding Planner data (budget, vendors, amounts, tasks, timeline, documents, moodboard)."
      : "Fica: o registo do evento (nomes, data, marca), os pagamentos e todos os dados do Wedding Planner (orçamento, fornecedores, valores, tarefas, cronograma, documentos, moodboard).",
    purgeType: en ? "Type DELETE to confirm" : "Escreva APAGAR para confirmar",
    purgeWord: en ? "DELETE" : "APAGAR",
    purgeGo: en ? "Delete permanently" : "Apagar definitivamente",
    cancel: en ? "Cancel" : "Cancelar",
    counting: en ? "Counting what will be deleted…" : "A contar o que vai ser apagado…",
    files: en ? "files" : "ficheiros",
    guestsShort: en ? "guests" : "convidados",
    messagesShort: en ? "messages" : "mensagens",
    done: en ? "Done" : "Concluído",
  };
  const [notified, setNotified] = useState<Record<string, string>>({});
  const [purged, setPurged] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [purgeModal, setPurgeModal] = useState<null | { ids: string[]; plan: CleanupResult[] | null; typed: string; running: boolean; done: CleanupResult[] | null; error?: string }>(null);
  const [tab, setTab] = useState<"active" | "archived">(initialTab);
  const [q, setQ] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [pubFilter, setPubFilter] = useState<"all" | "published" | "unpublished">("all");
  const isPublished = (ev: any) => (ev.unlocked_modules || []).includes("invite");
  const events = allEvents.filter(ev => {
    if (brandFilter !== "all" && (ev.brand_id || "dis") !== brandFilter) return false;
    if (pubFilter !== "all" && isPublished(ev) !== (pubFilter === "published")) return false;
    const needle = q.trim().toLowerCase();
    if (needle && ![ev.groom_name, ev.bride_name, ev.slug, ev.user_email].filter(Boolean).join(" ").toLowerCase().includes(needle)) return false;
    return true;
  });
  const brandIds = Array.from(new Set(allEvents.map(ev => ev.brand_id || "dis")));

  const now = new Date();
  const fmtDate = (d?: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(en ? "en-US" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  };
  const statusOf = (ev: any) => {
    if (!ev.event_date) return { label: t.draft, cls: "bg-gray-100 text-gray-500" };
    const d = new Date(ev.event_date);
    return d >= now
      ? { label: t.upcoming, cls: "bg-green-50 text-green-700 border border-green-100" }
      : { label: t.past, cls: "bg-gray-100 text-gray-500" };
  };
  const brandLookup = new Map((brands || []).map(b => [b.id, b.name]));
  const brandName = (id?: string) => (id && (brandLookup.get(id) || BRANDS[id]?.name)) || id || "—";
  const noticeAt = (ev: any): string | null => notified[ev.id] || ev.expiry_notice_sent_at || null;
  const purgedAt = (ev: any): string | null => purged[ev.id] || ev.content_purged_at || null;

  const sendNotice = async (ids: string[]) => {
    if (!ids.length || !confirm(t.notifyConfirm.replace("{n}", String(ids.length)))) return;
    setBusy(ids.length === 1 ? `notify:${ids[0]}` : "notify:all");
    try {
      const { results } = await adminPost("/api/admin/expiry-notice", { invitationIds: ids });
      const now = new Date().toISOString();
      const sent: Record<string, string> = {};
      const problems: string[] = [];
      (results as CleanupResult[]).forEach(r => {
        if (r.ok) sent[r.id] = now;
        if (r.error || r.warning) problems.push(`${r.name}: ${r.error || r.warning}`);
      });
      setNotified(prev => ({ ...prev, ...sent }));
      if (problems.length) alert(problems.join("\n"));
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(null);
  };

  const openPurge = async (ids: string[]) => {
    if (!ids.length) return;
    setPurgeModal({ ids, plan: null, typed: "", running: false, done: null });
    try {
      const { results } = await adminPost("/api/admin/event-cleanup", { invitationIds: ids, dryRun: true });
      setPurgeModal(m => (m ? { ...m, plan: results } : m));
    } catch (e: any) {
      setPurgeModal(m => (m ? { ...m, plan: [], error: e.message } : m));
    }
  };

  const runPurge = async () => {
    if (!purgeModal?.plan) return;
    const ids = purgeModal.plan.filter(r => r.ok).map(r => r.id);
    setPurgeModal(m => (m ? { ...m, running: true } : m));
    try {
      const { results } = await adminPost("/api/admin/event-cleanup", { invitationIds: ids });
      const now = new Date().toISOString();
      const done: Record<string, string> = {};
      (results as CleanupResult[]).forEach(r => { if (r.ok) done[r.id] = now; });
      setPurged(prev => ({ ...prev, ...done }));
      setPurgeModal(m => (m ? { ...m, running: false, done: results } : m));
    } catch (e: any) {
      setPurgeModal(m => (m ? { ...m, running: false, error: e.message } : m));
    }
  };

  // Arquivados: o casamento já passou (no dia seguinte ao evento, lib/eventArchive.ts).
  const archivedEvents = events.filter(ev => isArchivedEvent(ev));
  const activeEvents = events.filter(ev => !isArchivedEvent(ev));
  const showArchived = tab === "archived";
  const list = showArchived ? archivedEvents : activeEvents;

  // Ativos: data mais próxima primeiro, sem data no fim. Arquivados: os que
  // expiram primeiro no topo (são os primeiros que podem ser limpos).
  const sorted = [...list].sort((a, b) => {
    if (showArchived) {
      const ea = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
      const eb = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
      return ea - eb;
    }
    const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
    const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
    return da - db;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle} · <span className="font-semibold">{allEvents.length}</span> {t.total}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div role="tablist" className="inline-flex bg-white border border-gray-100 rounded-full p-1 shadow-sm">
            {(["active", "archived"] as const).map(id => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${tab === id ? "bg-brand text-gold-soft" : "text-gray-400 hover:text-brand"}`}
              >
                {id === "archived" && <Archive size={12} />}
                {t[id]} <span className={tab === id ? "text-gold-soft/70" : "text-gray-300"}>{id === "active" ? activeEvents.length : archivedEvents.length}</span>
              </button>
            ))}
          </div>
          {showArchived && <p className="text-xs text-gray-400">{t.archivedHint}</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} className="pl-8 pr-3 py-2 text-[12px] bg-white border border-gray-200 rounded-full outline-none focus:border-brand w-56" />
          </div>
          {showBrand && brandIds.length > 1 && (
            <select aria-label={t.brand} value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="py-2 px-3 text-[12px] bg-white border border-gray-200 rounded-full outline-none focus:border-brand">
              <option value="all">{t.allBrands}</option>
              {brandIds.map(id => <option key={id} value={id}>{id === "dis" ? t.direct : brandName(id)}</option>)}
            </select>
          )}
          <select aria-label={t.published} value={pubFilter} onChange={e => setPubFilter(e.target.value as any)} className="py-2 px-3 text-[12px] bg-white border border-gray-200 rounded-full outline-none focus:border-brand">
            <option value="all">{t.allPub}</option>
            <option value="published">{t.publishedPlural}</option>
            <option value="unpublished">{t.unpublishedPlural}</option>
          </select>
        </div>
        {showArchived && canCleanup && (() => {
          const toNotify = archivedEvents.filter(ev => !isExpiredEvent(ev) && !noticeAt(ev) && ev.user_email).map(ev => ev.id);
          const toPurge = archivedEvents.filter(ev => isExpiredEvent(ev) && !purgedAt(ev)).map(ev => ev.id);
          return (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => sendNotice(toNotify)}
                disabled={!toNotify.length || busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-soft bg-white text-[10px] font-bold uppercase tracking-widest text-ink hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-gold-soft disabled:hover:text-ink transition-colors"
              >
                {busy === "notify:all" ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />} {t.notifyAll} ({toNotify.length})
              </button>
              <button
                onClick={() => openPurge(toPurge)}
                disabled={!toPurge.length || busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 bg-white text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <Trash2 size={12} /> {t.purgeAll} ({toPurge.length})
              </button>
            </div>
          );
        })()}
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">{t.empty}</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-100 bg-cream/50">
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.couple}</th>
                  {showBrand && <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.brand}</th>}
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.date}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.registered}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{showArchived ? t.availability : t.status}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.guests}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.confirmed}</th>
                  {showArchived && canCleanup && <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.actions}</th>}
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ev) => {
                  const st = statusOf(ev);
                  const gc = guestCounts[ev.id] || { total: 0, confirmed: 0 };
                  return (
                    <tr key={ev.id} className="border-b border-gray-50 last:border-0 hover:bg-cream/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-serif text-lg text-ink leading-tight">
                          {ev.groom_name && ev.bride_name ? `${ev.groom_name} & ${ev.bride_name}` : ev.slug}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{ev.user_email}</p>
                      </td>
                      {showBrand && (
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{brandName(ev.brand_id)}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDate(ev.event_date)}</td>
                      <td className="px-6 py-4 text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(ev.created_at)}</td>
                      <td className="px-6 py-4">
                        {showArchived ? (
                          !ev.expires_at ? (
                            <span className="text-[11px] text-gray-400">{t.noExpiry}</span>
                          ) : isExpiredEvent(ev) ? (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">{t.expiredOn} {fmtDate(ev.expires_at)}</span>
                          ) : (
                            <span className="text-[11px] text-gray-600 whitespace-nowrap">{fmtDate(ev.expires_at)}</span>
                          )
                        ) : (
                          <span className="flex flex-wrap gap-1.5">
                            <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                            <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isPublished(ev) ? "bg-brand/5 text-brand" : "bg-amber-50 text-amber-700"}`}>{isPublished(ev) ? t.published : t.unpublished}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700"><Users size={13} className="text-gray-300" />{gc.total}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={13} className="text-green-400" />{gc.confirmed}</span>
                      </td>
                      {showArchived && canCleanup && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {purgedAt(ev) ? (
                            <span className="text-[10px] text-gray-400">{t.purgedOn} · {fmtDate(purgedAt(ev)!)}</span>
                          ) : isExpiredEvent(ev) ? (
                            <button onClick={() => openPurge([ev.id])} disabled={busy !== null} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:text-red-900 disabled:opacity-40">
                              <Trash2 size={12} /> {t.purge}
                            </button>
                          ) : noticeAt(ev) ? (
                            <span className="text-[10px] text-gray-400">{t.notifiedOn} · {fmtDate(noticeAt(ev)!)}</span>
                          ) : (
                            <button onClick={() => sendNotice([ev.id])} disabled={busy !== null || !ev.user_email} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand hover:text-ink disabled:opacity-40">
                              {busy === `notify:${ev.id}` ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />} {t.notify}
                            </button>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onOpen(ev.slug)}
                          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand hover:gap-3 transition-all"
                        >
                          {t.open} <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {purgeModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.purgeTitle}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={() => !purgeModal.running && setPurgeModal(null)} aria-label={t.cancel} className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-ink">
              <X size={18} />
            </button>
            <h2 className="font-serif text-2xl text-ink mb-4 flex items-center gap-2"><Trash2 size={20} className="text-red-700" /> {t.purgeTitle}</h2>

            {purgeModal.done ? (
              <>
                <ul className="space-y-2 mb-6 text-sm">
                  {purgeModal.done.map(r => (
                    <li key={r.id} className={r.ok ? "text-green-700" : "text-red-700"}>
                      {r.name}: {r.ok ? `${t.done} (${r.files} ${t.files}, ${r.guests} ${t.guestsShort}, ${r.messages} ${t.messagesShort})` : (r.error || r.skipped)}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setPurgeModal(null)} className="w-full py-3 rounded-full bg-ink text-white text-[10px] font-bold uppercase tracking-widest">OK</button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">{t.purgeIntro}</p>
                <p className="text-sm text-ink mb-3">{t.purgeWhat}</p>
                <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-5">{t.purgeKeep}</p>

                {!purgeModal.plan ? (
                  <p className="text-sm text-gray-400 flex items-center gap-2 mb-5"><Loader2 size={14} className="animate-spin" /> {t.counting}</p>
                ) : (
                  <ul className="space-y-1.5 mb-5 text-sm max-h-48 overflow-y-auto">
                    {purgeModal.plan.map(r => (
                      <li key={r.id} className={r.ok ? "text-ink" : "text-gray-400"}>
                        <span className="font-semibold">{r.name}</span>{" "}
                        {r.ok ? `· ${r.files} ${t.files} · ${r.guests} ${t.guestsShort} · ${r.messages} ${t.messagesShort}` : `· ${r.error || r.skipped}`}
                      </li>
                    ))}
                  </ul>
                )}
                {purgeModal.error && <p className="text-sm text-red-700 mb-4">{purgeModal.error}</p>}

                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{t.purgeType}</label>
                <input
                  value={purgeModal.typed}
                  onChange={e => setPurgeModal(m => (m ? { ...m, typed: e.target.value } : m))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5 outline-none focus:border-red-400"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => setPurgeModal(null)} disabled={purgeModal.running} className="flex-1 py-3 rounded-full border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.cancel}</button>
                  <button
                    onClick={runPurge}
                    disabled={purgeModal.running || purgeModal.typed.trim().toUpperCase() !== t.purgeWord || !purgeModal.plan?.some(r => r.ok)}
                    className="flex-1 py-3 rounded-full bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 inline-flex items-center justify-center gap-2"
                  >
                    {purgeModal.running && <Loader2 size={13} className="animate-spin" />} {t.purgeGo}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
