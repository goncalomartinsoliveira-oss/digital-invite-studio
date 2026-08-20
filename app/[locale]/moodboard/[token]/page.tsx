"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Upload, Link2, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import { moodboardItemDomain, type MoodboardItem, type MoodboardSection } from "@/lib/moodboard";
import type { WorkingBrand } from "@/lib/brands";

// Página pública do link de partilha do Moodboard — sem sessão, sem conta
// DIS. O token é o próprio controlo de acesso (ver 0007_moodboard_share.sql
// + lib/moodboardShare.ts); esta página só lê/escreve através das rotas em
// app/api/moodboard/public, nunca diretamente no Supabase. Quem recebe este
// link pode ver e acrescentar imagens — mas não apagar nem gerir secções,
// isso fica só para quem tem conta, dentro do painel.

type ShareData = {
  groomName: string;
  brideName: string;
  brand: WorkingBrand | null;
  sections: MoodboardSection[];
  items: MoodboardItem[];
};

export default function MoodboardSharePage() {
  const params = useParams();
  const locale = (params?.locale as "en" | "pt") || "pt";
  const token = params?.token as string;
  const en = locale === "en";

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [addingLinkSection, setAddingLinkSection] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/moodboard/public/${token}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const addLink = async (sectionId: string) => {
    const url = (linkInputs[sectionId] || "").trim();
    if (!url) return;
    setAddingLinkSection(sectionId);
    const res = await fetch(`/api/moodboard/public/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, sectionId }),
    });
    setAddingLinkSection(null);
    setLinkInputs(prev => ({ ...prev, [sectionId]: "" }));
    if (res.status === 429) { setLimitReached(true); return; }
    if (!res.ok) return;
    const { item } = await res.json();
    setData(prev => (prev ? { ...prev, items: [item as MoodboardItem, ...prev.items] } : prev));
  };

  const uploadImage = async (file: File, sectionId: string) => {
    setUploadingSection(sectionId);
    const form = new FormData();
    form.append("file", file);
    form.append("sectionId", sectionId);
    const res = await fetch(`/api/moodboard/public/${token}/upload`, { method: "POST", body: form });
    setUploadingSection(null);
    if (res.status === 429) { setLimitReached(true); return; }
    if (!res.ok) return;
    const { item } = await res.json();
    setData(prev => (prev ? { ...prev, items: [item as MoodboardItem, ...prev.items] } : prev));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center flex-col text-center p-6">
        <h1 className="font-serif text-3xl text-brand mb-2">{en ? "Link unavailable" : "Link indisponível"}</h1>
        <p className="text-gray-500 font-montserrat text-sm max-w-xs">
          {en ? "This link has expired or was revoked." : "Este link expirou ou foi revogado."}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-cream overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <header className="text-center mb-10">
          {data.brand?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.brand.logo} alt={data.brand.name} className="h-12 mx-auto mb-4 object-contain" />
          ) : (
            <p className="font-serif text-2xl text-brand mb-4">{data.brand?.name || "Digital Invite Studio"}</p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {en ? "Moodboard" : "Moodboard"}
          </p>
          <h1 className="font-serif text-3xl text-ink mt-2">{data.groomName} &amp; {data.brideName}</h1>
          <p className="text-xs text-gray-400 mt-2 font-montserrat max-w-sm mx-auto">
            {en ? "Add photos or Pinterest / Instagram links to help build the vision." : "Acrescente fotos ou links do Pinterest / Instagram para ajudar a construir a inspiração."}
          </p>
        </header>

        {limitReached && (
          <p className="text-center text-xs text-red-500 font-bold uppercase tracking-widest mb-6">
            {en ? "This moodboard is full — ask the couple to make room." : "Este moodboard está cheio — peça ao casal para abrir espaço."}
          </p>
        )}

        <div className="space-y-8 font-montserrat">
          {data.sections.map(section => {
            const sectionItems = data.items.filter(i => i.section_id === section.id);
            return (
              <section key={section.id} className="bg-white p-6 rounded-[2rem] shadow-md border border-gray-100">
                <h2 className="font-serif text-xl text-ink mb-4">{section.name}</h2>

                <div className="flex flex-col sm:flex-row gap-2 mb-5">
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => { fileInputRefs.current[section.id] = el; }}
                    className="hidden"
                    disabled={uploadingSection === section.id}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, section.id); e.target.value = ""; }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[section.id]?.click()}
                    disabled={uploadingSection === section.id}
                    className="inline-flex items-center justify-center gap-1.5 bg-brand/5 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-50 shrink-0"
                  >
                    {uploadingSection === section.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {en ? "Upload" : "Carregar"}
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input
                      className="flex-1 bg-cream/50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors"
                      placeholder={en ? "Paste a link…" : "Cole um link…"}
                      value={linkInputs[section.id] || ""}
                      onChange={e => setLinkInputs(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") addLink(section.id); }}
                    />
                    <button
                      onClick={() => addLink(section.id)}
                      disabled={addingLinkSection === section.id || !(linkInputs[section.id] || "").trim()}
                      className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-40 shrink-0"
                    >
                      {addingLinkSection === section.id ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                    </button>
                  </div>
                </div>

                {sectionItems.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">{en ? "Nothing here yet." : "Ainda sem nada aqui."}</p>
                ) : (
                  <div className="columns-2 sm:columns-3 gap-3">
                    {sectionItems.map(item => {
                      const domain = moodboardItemDomain(item);
                      return (
                        <div key={item.id} className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-cream border border-gray-100">
                          {item.image_url ? (
                            item.kind === "image" ? (
                              <button onClick={() => setLightbox(item.image_url)} className="block w-full">
                                <img src={item.image_url} alt="" className="w-full h-auto block" />
                              </button>
                            ) : (
                              <a href={item.source_url || "#"} target="_blank" rel="noopener noreferrer" className="block w-full relative">
                                <img src={item.image_url} alt="" className="w-full h-auto block" />
                                <span className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1"><ExternalLink size={10} /></span>
                              </a>
                            )
                          ) : (
                            <a href={item.source_url || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 h-24 text-gray-400">
                              <Link2 size={15} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">{domain}</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-gray-300 uppercase tracking-widest mt-10">
          {en ? "Generated with Digital Invite Studio" : "Gerado com Digital Invite Studio"}
        </p>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" aria-label={en ? "Close" : "Fechar"}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
