"use client";
import { Fragment, useEffect, useState } from "react";
import { Activity, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isPlannerPlan, PLANNER_PLANS } from "@/lib/planner";

// "Piloto Wedding Planner" (Administração › Gestão, só super-admin no DIS):
// responde com dados à pergunta do piloto — "as agências estão mesmo a usar o
// Planeamento?" — em vez de depender só do que dizem. Por agência com plano:
// eventos, eventos com Planeamento em uso, última atividade e quantos itens
// foram criados ou alterados nos últimos 7 e 30 dias. Um item editado várias
// vezes conta uma vez por janela (é atividade, não um registo de cliques).

const TABLES = ["event_tasks", "event_costs", "event_cost_payments", "event_cost_notes", "event_documents", "event_timeline", "event_moodboard_items"];
const DAY = 86400000;

type EventStat = { id: string; slug: string; name: string; items: number; last: number | null; d7: number; d30: number };
type AgencyStat = { id: string; name: string; plan: string; events: EventStat[]; withPlanning: number; last: number | null; d7: number; d30: number; vendors: number };

async function rowsIn(table: string, ids: string[]): Promise<any[]> {
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += 80) {
    const { data } = await supabase.from(table).select("*").in("invitation_id", ids.slice(i, i + 80));
    if (data) out.push(...data);
  }
  return out;
}

const touched = (r: any) => Math.max(r.created_at ? Date.parse(r.created_at) : 0, r.updated_at ? Date.parse(r.updated_at) : 0) || null;

export default function PlannerPilotCard({ locale }: { locale: string }) {
  const en = locale === "en";
  const [stats, setStats] = useState<AgencyStat[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const t = {
    title: en ? "Wedding Planner pilot" : "Piloto Wedding Planner",
    subtitle: en ? "Is each agency actually using Planning? Items created or changed, per agency." : "As agências estão mesmo a usar o Planeamento? Itens criados ou alterados, por agência.",
    agency: en ? "Agency" : "Agência",
    events: en ? "Events" : "Eventos",
    withPlanning: en ? "Using Planning" : "Com Planeamento",
    last: en ? "Last activity" : "Última atividade",
    d7: en ? "Last 7 days" : "Últimos 7 dias",
    d30: en ? "Last 30 days" : "Últimos 30 dias",
    vendors: en ? "Vendors" : "Fornecedores",
    none: en ? "No agency has a wedding planner plan yet. Turn it on under Administration › Brands." : "Ainda nenhuma agência tem plano de wedding planner. Liguem-no em Administração › Marcas.",
    never: en ? "never" : "nunca",
    today: en ? "today" : "hoje",
    ago: (n: number) => en ? `${n}d ago` : `há ${n} dias`,
    items: en ? "items" : "itens",
  };
  const rel = (ts: number | null) => {
    if (!ts) return t.never;
    const d = Math.floor((Date.now() - ts) / DAY);
    return d <= 0 ? t.today : t.ago(d);
  };

  useEffect(() => {
    (async () => {
      const { data: brands } = await supabase.from("brands").select("*");
      const agencies = ((brands as any[]) || []).filter(b => isPlannerPlan(b.planner_plan));
      if (agencies.length === 0) { setStats([]); return; }
      const ids = agencies.map(a => a.id);
      const { data: evs } = await supabase.from("invitations").select("id, slug, groom_name, bride_name, brand_id").in("brand_id", ids);
      const events = (evs as any[]) || [];
      const eventIds = events.map(e => e.id);
      const [tables, vendors] = await Promise.all([
        Promise.all(TABLES.map(tb => rowsIn(tb, eventIds))),
        supabase.from("agency_vendors").select("*").in("brand_id", ids),
      ]);
      const rows = tables.flat();
      const now = Date.now();
      const byEvent = new Map<string, any[]>();
      for (const r of rows) { const l = byEvent.get(r.invitation_id) || []; l.push(r); byEvent.set(r.invitation_id, l); }
      const vendorRows = ((vendors.data as any[]) || []);

      setStats(agencies.map(a => {
        const evStats: EventStat[] = events.filter(e => e.brand_id === a.id).map(e => {
          const rs = byEvent.get(e.id) || [];
          const times = rs.map(touched).filter(Boolean) as number[];
          return {
            id: e.id, slug: e.slug,
            name: e.groom_name && e.bride_name ? `${e.groom_name} & ${e.bride_name}` : e.slug,
            items: rs.length,
            last: times.length ? Math.max(...times) : null,
            d7: times.filter(x => now - x <= 7 * DAY).length,
            d30: times.filter(x => now - x <= 30 * DAY).length,
          };
        }).sort((x, y) => (y.last ?? 0) - (x.last ?? 0));
        const vs = vendorRows.filter(v => v.brand_id === a.id);
        const vTimes = vs.map(touched).filter(Boolean) as number[];
        const lasts = [...evStats.map(e => e.last ?? 0), ...vTimes].filter(Boolean);
        return {
          id: a.id, name: a.name || a.id,
          plan: PLANNER_PLANS[a.planner_plan as keyof typeof PLANNER_PLANS]?.name ?? a.planner_plan,
          events: evStats,
          withPlanning: evStats.filter(e => e.items > 0).length,
          last: lasts.length ? Math.max(...lasts) : null,
          d7: evStats.reduce((s, e) => s + e.d7, 0) + vTimes.filter(x => now - x <= 7 * DAY).length,
          d30: evStats.reduce((s, e) => s + e.d30, 0) + vTimes.filter(x => now - x <= 30 * DAY).length,
          vendors: vs.length,
        };
      }).sort((x, y) => (y.last ?? 0) - (x.last ?? 0)));
    })();
  }, []);

  const th = "px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400";
  const td = "px-4 py-3 text-sm text-ink tabular-nums";
  const lastCls = (ts: number | null) => !ts ? "text-gray-400" : Date.now() - ts <= 7 * DAY ? "text-emerald-700" : Date.now() - ts <= 30 * DAY ? "text-amber-700" : "text-red-600";

  return (
    <section data-pilot className="mb-10 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
        <div className="flex items-center gap-2"><Activity size={14} className="text-brand" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t.title}</span></div>
        <p className="text-[11px] text-gray-400 mt-1">{t.subtitle}</p>
      </div>
      {stats === null ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
      ) : stats.length === 0 ? (
        <p className="text-sm text-gray-400 p-8 text-center">{t.none}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead><tr>
              <th className={th}>{t.agency}</th><th className={th}>{t.events}</th><th className={th}>{t.withPlanning}</th>
              <th className={th}>{t.last}</th><th className={th}>{t.d7}</th><th className={th}>{t.d30}</th><th className={th}>{t.vendors}</th><th />
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {stats.map(a => (
                <Fragment key={a.id}>
                  <tr data-pilot-agency={a.id} className="cursor-pointer hover:bg-cream/40" onClick={() => setOpen(o => (o === a.id ? null : a.id))}>
                    <td className={td}><span className="font-semibold">{a.name}</span> <span className="text-[10px] text-gray-400 uppercase tracking-widest ml-1">{a.plan}</span></td>
                    <td className={td}>{a.events.length}</td>
                    <td className={td}>{a.withPlanning}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${lastCls(a.last)}`}>{rel(a.last)}</td>
                    <td className={td}>{a.d7}</td>
                    <td className={td}>{a.d30}</td>
                    <td className={td}>{a.vendors}</td>
                    <td className="px-4"><ChevronDown size={14} className={`text-gray-300 transition-transform ${open === a.id ? "rotate-180" : ""}`} /></td>
                  </tr>
                  {open === a.id && a.events.map(e => (
                    <tr key={`${a.id}-${e.id}`} data-pilot-event={e.slug} className="bg-cream/30">
                      <td className="px-4 py-2 pl-10 text-[13px] text-gray-600">{e.name}</td>
                      <td className="px-4 py-2 text-[12px] text-gray-400">{e.items} {t.items}</td>
                      <td />
                      <td className={`px-4 py-2 text-[12px] ${lastCls(e.last)}`}>{rel(e.last)}</td>
                      <td className="px-4 py-2 text-[12px] text-gray-500 tabular-nums">{e.d7}</td>
                      <td className="px-4 py-2 text-[12px] text-gray-500 tabular-nums">{e.d30}</td>
                      <td /><td />
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
