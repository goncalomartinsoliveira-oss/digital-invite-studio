"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BRANDS } from "@/lib/brands";
import { Plus, Trash2, Loader2, ImagePlus, Building2 } from "lucide-react";

interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  domain: string | null;
}

export default function BrandsManagementView({ locale }: { locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Partner brands" : "Marcas de parceiros",
    subtitle: en ? "Onboard a partner: name + logo. No domain needed." : "Registe um parceiro: nome + logótipo. Sem domínio necessário.",
    createTitle: en ? "New partner" : "Novo parceiro",
    nameLbl: en ? "Name" : "Nome",
    namePh: en ? "e.g. Flores & Aliança" : "Ex.: Flores & Aliança",
    slugLbl: en ? "Identifier (slug)" : "Identificador (slug)",
    logoLbl: en ? "Logo (PNG)" : "Logótipo (PNG)",
    upload: en ? "Upload logo" : "Carregar logótipo",
    uploading: en ? "Uploading..." : "A carregar...",
    create: en ? "Create partner" : "Criar parceiro",
    existing: en ? "Partners" : "Parceiros",
    none: en ? "No partners yet." : "Ainda não há parceiros.",
    remove: en ? "Remove" : "Remover",
    codeManaged: en ? "domain brand" : "marca com domínio",
    slugTaken: en ? "That identifier is already in use." : "Esse identificador já está em uso.",
    needLogo: en ? "Please upload a logo first." : "Carregue primeiro um logótipo.",
    changeLogo: en ? "Change logo" : "Trocar logótipo",
    removeConfirm: en ? "Remove this partner? Existing events keep their brand tag." : "Remover este parceiro? Os eventos existentes mantêm a marca.",
  };

  const [rows, setRows] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  const slugify = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("brands").select("id, name, logo_url, domain").order("created_at", { ascending: true });
    setRows((data as BrandRow[]) || []);
    setLoading(false);
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
    if (!logoUrl) { setMsg(t.needLogo); return; }
    if (BRANDS[slug]) { setMsg(t.slugTaken); return; }
    setCreating(true);
    const { error } = await supabase.from("brands").insert([{ id: slug, name: name.trim(), logo_url: logoUrl }]);
    if (error) {
      setMsg(error.code === "23505" ? t.slugTaken : error.message);
    } else {
      setName(""); setSlug(""); setSlugTouched(false); setLogoUrl("");
      await load();
    }
    setCreating(false);
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

      {/* Criar parceiro */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
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
            <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading ? t.uploading : t.upload}
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploading} />
            </label>
          </div>
        </div>

        {msg && <p className="text-[11px] text-red-500 mt-4">{msg}</p>}

        <button onClick={createBrand} disabled={creating || !name.trim() || !slug} className="mt-6 inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t.create}
        </button>
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
              <li key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {r.logo_url ? <img src={r.logo_url} className="max-w-full max-h-full object-contain" alt="" /> : <Building2 size={16} className="text-gray-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-semibold truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.id}{r.domain ? ` · ${r.domain}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand cursor-pointer transition-colors">
                    {t.changeLogo}
                    <input type="file" accept="image/*" className="hidden" onChange={e => changeLogo(r.id, e)} />
                  </label>
                  <button onClick={() => removeBrand(r.id)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
