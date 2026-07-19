"use client";
import { BRANDS } from "@/lib/brands";
import { ExternalLink, Users, CheckCircle2 } from "lucide-react";

interface AdminManagementViewProps {
  events: any[];                                   // eventos no âmbito (marca ou todas)
  guestCounts: Record<string, { total: number; confirmed: number }>;
  showBrand: boolean;                              // mostrar coluna de marca (super-admin)
  brands?: { id: string; name: string }[];          // marcas conhecidas (código + BD), para resolver o nome
  locale: string;
  onOpen: (slug: string) => void;
}

export default function AdminManagementView({ events, guestCounts, showBrand, brands, locale, onOpen }: AdminManagementViewProps) {
  const en = locale === "en";
  const t = {
    title: en ? "Event management" : "Gestão de eventos",
    subtitle: en ? "Overview of all active events." : "Visão geral de todos os eventos ativos.",
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
  };

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

  // Ordenar: com data mais próxima primeiro; sem data no fim.
  const sorted = [...events].sort((a, b) => {
    const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
    const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
    return da - db;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle} · <span className="font-semibold">{events.length}</span> {t.total}</p>
      </div>

      {events.length === 0 ? (
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
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.status}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.guests}</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{t.confirmed}</th>
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
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700"><Users size={13} className="text-gray-300" />{gc.total}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={13} className="text-green-400" />{gc.confirmed}</span>
                      </td>
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
    </div>
  );
}
