"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BRANDS } from "@/lib/brands";
import { Plus, Trash2, Loader2, ImagePlus, Building2, Save, Mail, ClipboardList, Megaphone, Tag, ChevronDown, Globe } from "lucide-react";
import { type PlannerPlan } from "@/lib/planner";
import PartnerTermsCard from "./PartnerTermsCard";
import BrandMembersPanel from "./BrandMembersPanel";
import { formatPriceCents } from "@/lib/checkout";

interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  domain: string | null;
  contact_url: string | null;
  planner_plan: PlannerPlan | null;
  code?: boolean; // marca de código (lib/brands.ts, com domínio próprio): logótipo e contacto vivem no código
}
type Stats = { events: number; revenueCents: number; toPayCents: number; pendingCents: number };

export default function BrandsManagementView({ locale }: { locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Partners" : "Parceiros",
    subtitle: en ? "Each partner is an organisation with features switched on: referrals, partner price, Planning and own brand. Open a partner to edit its terms." : "Cada parceiro é uma organização com funcionalidades ligadas: recomendação, preço de parceiro, Planeamento e marca própria. Abram um parceiro para editar as condições.",
    createTitle: en ? "New partner" : "Novo parceiro",
    nameLbl: en ? "Name" : "Nome",
    namePh: en ? "e.g. Flores & Aliança" : "Ex.: Flores & Aliança",
    slugLbl: en ? "Identifier (slug)" : "Identificador (slug)",
    logoLbl: en ? "Logo (PNG, optional)" : "Logótipo (PNG, opcional)",
    logoHint: en ? "No logo? Their events show the Digital Invite Studio logo." : "Sem logótipo, os eventos mostram o logótipo da Digital Invite Studio.",
    upload: en ? "Upload logo" : "Carregar logótipo",
    uploading: en ? "Uploading..." : "A carregar...",
    contactLbl: en ? "Contact (email or link, optional)" : "Contacto (email ou link, opcional)",
    contactPh: en ? "e.g. mailto:ola@parceiro.pt or https://wa.me/..." : "Ex.: mailto:ola@parceiro.pt ou https://wa.me/...",
    contactHint: en ? "Shown to this partner's couples when the partner is the one paying for the invitation." : "Mostrado aos casais deste parceiro quando é o parceiro a pagar o convite.",
    create: en ? "Create partner" : "Criar parceiro",
    existing: en ? "Partners" : "Parceiros",
    none: en ? "No partners yet." : "Ainda não há parceiros.",
    remove: en ? "Remove" : "Remover",
    codeManaged: en ? "domain brand" : "marca com domínio",
    slugTaken: en ? "That identifier is already in use." : "Esse identificador já está em uso.",
    changeLogo: en ? "Change logo" : "Trocar logótipo",
    removeConfirm: en ? "Remove this partner? Existing events keep their brand tag." : "Remover este parceiro? Os eventos existentes mantêm a marca.",
    saveContact: en ? "Save" : "Guardar",
    noContact: en ? "no contact set" : "sem contacto definido",
    plannerLbl: en ? "Wedding planner account" : "Conta wedding planner",
    plannerOff: en ? "Off" : "Desligada",
    statsLine: en ? "{e} · {r} revenue" : "{e} · {r} de receita",
    events: (n: number) => en ? `${n} event${n === 1 ? "" : "s"}` : `${n} evento${n === 1 ? "" : "s"}`,
    toPay: en ? "Commissions to pay: {v}" : "Comissões por pagar: {v}",
    pendingC: en ? "pending: {v}" : "pendentes: {v}",
    plannerHint: en
      ? "Unlocks the management area (budget and tasks) on this partner's events."
      : "Desbloqueia a área de gestão (orçamento e tarefas) nos eventos deste parceiro.",
  };

  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>({});
  const [savingContactId, setSavingContactId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [terms, setTerms] = useState<Record<string, { referral: boolean; price: boolean }>>({});
  const [stats, setStats] = useState<Record<string, Stats>>({});

  const slugify = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("brands").select("id, name, logo_url, domain, contact_url, planner_plan").order("created_at", { ascending: true });
    const fromDb = (data as BrandRow[]) || [];
    // Marcas de código (ex.: Amazing Moon) não estão na tabela brands, mas são parceiros.
    const codeRows: BrandRow[] = Object.values(BRANDS)
      .filter(b => b.id !== "dis" && !fromDb.some(r => r.id === b.id))
      .map(b => ({ id: b.id, name: b.name, logo_url: b.logo, domain: b.domains[0] ?? null, contact_url: b.contactUrl ?? null, planner_plan: null, code: true }));
    const loaded = [...codeRows, ...fromDb];
    setRows(loaded);
    setContactDrafts(Object.fromEntries(loaded.map(r => [r.id, r.contact_url || ""])));
    const { data: pa } = await supabase.from("partner_accounts").select("brand_id, referral_enabled, partner_price_enabled");
    setTerms(Object.fromEntries(((pa as any[]) || []).map(a => [a.brand_id, { referral: !!a.referral_enabled, price: !!a.partner_price_enabled }])));
    setLoading(false);
    // Resumo por parceiro: eventos, receita e comissões (APIs do super admin).
    const { data: sess } = await supabase.auth.getSession();
    const headers = { authorization: `Bearer ${sess.session?.access_token ?? ""}` };
    const [biz, com] = await Promise.all([
      fetch("/api/admin/business-overview", { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/commissions", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const next: Record<string, Stats> = {};
    const get = (id: string) => (next[id] ||= { events: 0, revenueCents: 0, toPayCents: 0, pendingCents: 0 });
    (biz?.partners || []).forEach((p: any) => { const s = get(p.id); s.events = p.events; s.revenueCents = p.revenueCents; });
    (com?.partners || []).forEach((p: any) => { const s = get(p.brandId); s.toPayCents = p.approved; s.pendingCents = p.pending; });
    setStats(next);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `brand-logos/${slug || "brand"}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("invites").upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(fileName);
      setLogoUrl(publicUrl);
    }
    setUploading(false);
  };

  const createBrand = async () => {
    setMsg("");
    if (!name.trim() || !slug) return;
    if (BRANDS[slug]) { setMsg(t.slugTaken); return; }
    setCreating(true);
    const { error } = await supabase.from("brands").insert([{ id: slug, name: name.trim(), logo_url: logoUrl || null, contact_url: contactUrl.trim() || null }]);
    if (error) {
      setMsg(error.code === "23505" ? t.slugTaken : error.message);
    } else {
      setName(""); setSlug(""); setSlugTouched(false); setLogoUrl(""); setContactUrl("");
      await load();
    }
    setCreating(false);
  };

  // Planeamento (módulo wedding planner): ligado/desligado por parceiro, sem
  // mensalidade. Fica na conta de parceiro, e não num papel da pessoa, porque o
  // que desbloqueia pertence à agência. Qualquer valor = ligado ("piloto").
  const setPlannerPlan = async (id: string, plan: PlannerPlan | null) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, planner_plan: plan } : r)));
    await supabase.from("brands").update({ planner_plan: plan }).eq("id", id);
  };

  const saveContact = async (id: string) => {
    setSavingContactId(id);
    await supabase.from("brands").update({ contact_url: (contactDrafts[id] || "").trim() || null }).eq("id", id);
    await load();
    setSavingContactId(null);
  };

  const changeLogo = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = `brand-logos/${id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("invites").upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(fileName);
      await supabase.from("brands").update({ logo_url: publicUrl }).eq("id", id);
      await load();
    }
  };

  const removeBrand = async (id: string) => {
    if (!confirm(t.removeConfirm)) return;
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from("brands").delete().eq("id", id);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink focus:ring-0 focus:border-brand outline-none";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Lista de parceiros */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.existing}</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">{t.none}</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map(r => (
              <li key={r.id} className="px-6 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {r.logo_url ? <img src={r.logo_url} className="max-w-full max-h-full object-contain" alt="" /> : <Building2 size={16} className="text-gray-300" />}
                  </div>
                  <div className="min-w-0">
                    <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="text-left flex items-center gap-2 group">
                      <span className="text-sm text-ink font-semibold truncate group-hover:text-brand">{r.name}</span>
                      <ChevronDown size={14} className={`text-gray-300 transition-transform ${openId === r.id ? "rotate-180" : ""}`} />
                    </button>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {terms[r.id]?.referral && <span className="inline-flex items-center gap-1 bg-brand/5 text-brand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"><Megaphone size={10} /> {en ? "Referrals" : "Recomendação"}</span>}
                      {terms[r.id]?.price && <span className="inline-flex items-center gap-1 bg-brand/5 text-brand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"><Tag size={10} /> {en ? "Partner price" : "Preço de parceiro"}</span>}
                      {r.planner_plan && <span className="inline-flex items-center gap-1 bg-brand/5 text-brand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"><ClipboardList size={10} /> {en ? "Planning" : "Planeamento"}</span>}
                      {r.domain && <span className="inline-flex items-center gap-1 bg-brand/5 text-brand text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"><Globe size={10} /> {r.domain}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400">{r.id}{r.code ? ` · ${t.codeManaged}` : ""}</p>
                    {stats[r.id] && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {t.statsLine.replace("{e}", t.events(stats[r.id].events)).replace("{r}", formatPriceCents(stats[r.id].revenueCents, locale))}
                        {stats[r.id].toPayCents > 0 && <span className="ml-2 font-semibold text-brand">{t.toPay.replace("{v}", formatPriceCents(stats[r.id].toPayCents, locale))}</span>}
                        {stats[r.id].pendingCents > 0 && <span className="ml-2 text-gray-400">({t.pendingC.replace("{v}", formatPriceCents(stats[r.id].pendingCents, locale))})</span>}
                      </p>
                    )}
                  </div>
                </div>
                {!r.code && <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      value={contactDrafts[r.id] ?? ""}
                      onChange={e => setContactDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder={t.noContact}
                      className="pl-8 pr-3 py-2 text-[11px] border border-gray-200 rounded-full outline-none focus:border-brand w-56"
                    />
                  </div>
                  <button
                    onClick={() => saveContact(r.id)}
                    disabled={savingContactId === r.id}
                    className="inline-flex items-center gap-1.5 bg-brand/5 text-brand px-3 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-50"
                  >
                    {savingContactId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t.saveContact}
                  </button>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand cursor-pointer transition-colors">
                    {t.changeLogo}
                    <input type="file" accept="image/*" className="hidden" onChange={e => changeLogo(r.id, e)} />
                  </label>
                  <button onClick={() => removeBrand(r.id)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove}>
                    <Trash2 size={16} />
                  </button>
                </div>}
                </div>
                {openId === r.id && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <PartnerTermsCard
                      brandId={r.id}
                      locale={locale}
                      plannerOn={r.code ? undefined : !!r.planner_plan}
                      onPlannerChange={r.code ? undefined : on => setPlannerPlan(r.id, on ? "piloto" : null)}
                    />
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <BrandMembersPanel brandId={r.id} locale={locale} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Criar parceiro */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mt-8">
        <h2 className="font-serif text-2xl text-ink mb-6">{t.createTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.nameLbl}</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.slugLbl}</label>
            <input className={inputCls} value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="flores-e-alianca" />
          </div>
        </div>

        <div className="mt-5">
          <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.logoLbl}</label>
          <div className="flex items-center gap-5">
            <div className="w-24 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? <img src={logoUrl} className="max-w-full max-h-full object-contain" alt="" /> : <ImagePlus size={20} className="text-gray-300" />}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {uploading ? t.uploading : t.upload}
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploading} />
              </label>
              <p className="text-[10px] text-gray-400 mt-2">{t.logoHint}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t.contactLbl}</label>
          <input className={inputCls} value={contactUrl} onChange={e => setContactUrl(e.target.value)} placeholder={t.contactPh} />
          <p className="text-[10px] text-gray-400 mt-2">{t.contactHint}</p>
        </div>

        {msg && <p className="text-[11px] text-red-500 mt-4">{msg}</p>}

        <button onClick={createBrand} disabled={creating || !name.trim() || !slug} className="mt-6 inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t.create}
        </button>
      </div>

    </div>
  );
}
