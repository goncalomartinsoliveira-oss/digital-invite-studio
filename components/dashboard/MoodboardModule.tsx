"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import SaveStatusBadge from "@/components/dashboard/SaveStatusBadge";
import { useSaveStatus } from "@/lib/useSaveStatus";
import { Upload, Link2, Trash2, Loader2, X, ExternalLink, Image as ImageIcon, Plus, Pencil, Share2, ChevronRight } from "lucide-react";
import { moodboardItemDomain, DEFAULT_MOODBOARD_SECTIONS, type MoodboardItem, type MoodboardSection } from "@/lib/moodboard";

// Moodboard do evento — área de gestão, exclusiva de contas de agência.
// Mural partilhado entre agência e casal, organizado em secções (Identidade
// Visual, Vestido & Fato, ...) semeadas sozinhas na primeira vez que o
// evento abre esta área — a agência/casal pode acrescentar secções próprias
// além dessas. Sem distinção agency/shared, ao contrário de Orçamento/
// Tarefas: não há aqui nada sensível a esconder.
//
// Duas formas de adicionar a uma secção: carregar imagem, ou colar um link
// (Pinterest/Instagram) — a miniatura desse link é extraída do servidor
// (ver app/api/moodboard/unfurl), porque o browser não pode ir buscar HTML
// de outro domínio diretamente (CORS).

interface Props {
  invitationId: string;
  canEdit: boolean;
  locale: string;
  /** Leva à página Partilha, onde vive o link deste moodboard. */
  onOpenSharing?: () => void;
}

export default function MoodboardModule({ invitationId, canEdit, locale, onOpenSharing }: Props) {
  const en = locale === "en";
  const [sections, setSections] = useState<MoodboardSection[]>([]);
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { status: saveStatus, track } = useSaveStatus("MoodboardModule");
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [addingLinkSection, setAddingLinkSection] = useState<string | null>(null);
  const [unfurlingIds, setUnfurlingIds] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const [{ data: sectionRows }, { data: itemRows }] = await Promise.all([
      supabase.from("event_moodboard_sections").select("*").eq("invitation_id", invitationId).order("sort_order"),
      supabase.from("event_moodboard_items").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false }),
    ]);
    let loadedSections = (sectionRows as MoodboardSection[]) || [];
    // Primeira vez que este evento abre a área — semear as secções por omissão.
    if (loadedSections.length === 0) {
      const { data: seeded } = await supabase
        .from("event_moodboard_sections")
        .insert(DEFAULT_MOODBOARD_SECTIONS.map((name, i) => ({ invitation_id: invitationId, name, sort_order: i })))
        .select("*");
      loadedSections = (seeded as MoodboardSection[]) || [];
    }
    setSections(loadedSections);
    setItems((itemRows as MoodboardItem[]) || []);
    setLoading(false);
  }, [invitationId]);

  useEffect(() => { load(); }, [load]);

  const addSection = async () => {
    const name = newSectionName.trim();
    if (!canEdit || !name) return;
    setAddingSection(true);
    const { data } = await supabase
      .from("event_moodboard_sections")
      .insert([{ invitation_id: invitationId, name, sort_order: sections.length }])
      .select("*")
      .single();
    if (data) setSections(prev => [...prev, data as MoodboardSection]);
    setNewSectionName("");
    setAddingSection(false);
  };

  const renameSection = async (id: string, name: string) => {
    setEditingSection(null);
    if (!name.trim()) return;
    setSections(prev => prev.map(s => (s.id === id ? { ...s, name: name.trim() } : s)));
    await track(supabase.from("event_moodboard_sections").update({ name: name.trim() }).eq("id", id));
  };

  const removeSection = async (section: MoodboardSection) => {
    if (!canEdit) return;
    const msg = en
      ? `Remove section "${section.name}"? Its photos stay, just unsorted.`
      : `Remover a secção "${section.name}"? As fotos ficam, só passam a "Sem secção".`;
    if (!confirm(msg)) return;
    setSections(prev => prev.filter(s => s.id !== section.id));
    setItems(prev => prev.map(i => (i.section_id === section.id ? { ...i, section_id: null } : i)));
    await track(supabase.from("event_moodboard_sections").delete().eq("id", section.id));
  };

  const uploadImage = async (file: File, sectionId: string | null) => {
    if (!canEdit) return;
    setUploadingSection(sectionId || "unsectioned");
    const ext = file.name.split(".").pop();
    const path = `moodboard/${invitationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("invites").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(path);
      const { data } = await supabase
        .from("event_moodboard_items")
        .insert([{ invitation_id: invitationId, section_id: sectionId, kind: "image", image_url: publicUrl }])
        .select("*")
        .single();
      if (data) setItems(prev => [data as MoodboardItem, ...prev]);
    }
    setUploadingSection(null);
  };

  const addLink = async (sectionId: string) => {
    const url = (linkInputs[sectionId] || "").trim();
    if (!canEdit || !url) return;
    setAddingLinkSection(sectionId);
    const { data, error } = await supabase
      .from("event_moodboard_items")
      .insert([{ invitation_id: invitationId, section_id: sectionId, kind: "link", source_url: url }])
      .select("*")
      .single();
    setAddingLinkSection(null);
    setLinkInputs(prev => ({ ...prev, [sectionId]: "" }));
    if (error || !data) return;
    const item = data as MoodboardItem;
    setItems(prev => [item, ...prev]);

    // Miniatura vem depois, em segundo plano — o cartão já aparece com o
    // estado de fallback (domínio + ícone) e atualiza-se sozinho se resolver.
    setUnfurlingIds(prev => new Set(prev).add(item.id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/moodboard/unfurl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (json.imageUrl) {
        await supabase.from("event_moodboard_items").update({ image_url: json.imageUrl }).eq("id", item.id);
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, image_url: json.imageUrl } : i)));
      }
    } catch {
      // Sem miniatura, fica o cartão de fallback — não é um erro fatal.
    } finally {
      setUnfurlingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    }
  };

  const removeItem = async (id: string) => {
    if (!canEdit) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await track(supabase.from("event_moodboard_items").delete().eq("id", id));
  };

  const saveCaption = async (id: string, caption: string) => {
    setEditingCaption(null);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, caption } : i)));
    await track(supabase.from("event_moodboard_items").update({ caption: caption || null }).eq("id", id));
  };

  const handleDrop = (e: React.DragEvent, sectionId: string | null) => {
    e.preventDefault();
    setDragOverSection(null);
    if (!canEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadImage(file, sectionId);
  };

  const renderGrid = (sectionItems: MoodboardItem[]) => (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
      {sectionItems.map(item => {
        const domain = moodboardItemDomain(item);
        const isUnfurling = unfurlingIds.has(item.id);
        return (
          <div key={item.id} className="break-inside-avoid mb-4 group relative">
            <div className="rounded-2xl overflow-hidden bg-cream border border-gray-100">
              {item.image_url ? (
                item.kind === "image" ? (
                  <button onClick={() => setLightbox(item.image_url)} className="block w-full">
                    <img src={item.image_url} alt={item.caption || ""} className="w-full h-auto block" />
                  </button>
                ) : (
                  <a href={item.source_url || "#"} target="_blank" rel="noopener noreferrer" className="block w-full relative">
                    <img src={item.image_url} alt={item.caption || ""} className="w-full h-auto block" />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5">
                      <ExternalLink size={11} />
                    </span>
                  </a>
                )
              ) : (
                <a
                  href={item.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 h-32 text-gray-400 hover:text-brand transition-colors"
                >
                  {isUnfurling ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{domain}</span>
                </a>
              )}
              {canEdit && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  aria-label={en ? "Remove" : "Remover"}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            {canEdit ? (
              editingCaption === item.id ? (
                <input
                  autoFocus
                  className="w-full text-xs text-gray-500 mt-1.5 px-1 bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                  defaultValue={item.caption || ""}
                  placeholder={en ? "Add a note…" : "Adicionar nota…"}
                  onBlur={e => saveCaption(item.id, e.target.value.trim())}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                />
              ) : (
                <button
                  onClick={() => setEditingCaption(item.id)}
                  className="w-full text-left text-xs text-gray-500 mt-1.5 px-1 truncate hover:text-brand transition-colors"
                >
                  {item.caption || <span className="text-gray-300">{en ? "+ Add a note" : "+ Adicionar nota"}</span>}
                </button>
              )
            ) : (
              item.caption && <p className="text-xs text-gray-500 mt-1.5 px-1 truncate">{item.caption}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  const unsectioned = items.filter(i => !i.section_id);

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <SaveStatusBadge status={saveStatus} locale={locale} />

      <div className="mb-2">
        <h3 className="font-serif text-3xl text-brand mb-2">{en ? "Inspiration" : "Inspiração"}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          {en ? "A shared moodboard for the event, organized by section" : "Um mural de inspiração partilhado para o evento, organizado por secções"}
        </p>
      </div>

      {/* O link de partilha do moodboard vive na página Partilha, com os
          restantes links do evento — aqui fica só o atalho, para quem o
          procurar neste ecrã não ficar sem saber para onde foi. */}
      {onOpenSharing && (
        <button
          onClick={onOpenSharing}
          className="w-full flex items-center gap-2.5 bg-cream/50 border border-gray-100 rounded-2xl px-5 py-3.5 text-left hover:border-gold-soft transition-colors group"
        >
          <Share2 size={14} className="text-brand shrink-0" />
          <span className="flex-1 text-xs text-gray-500">
            {en
              ? "Share this moodboard so others can add photos — the link lives in Sharing."
              : "Partilhe este moodboard para outros acrescentarem fotos — o link está em Partilha."}
          </span>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-brand transition-colors shrink-0" />
        </button>
      )}

      {sections.map(section => {
        const sectionItems = items.filter(i => i.section_id === section.id);
        return (
          <section
            key={section.id}
            className={`bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border transition-colors ${dragOverSection === section.id ? "border-brand" : "border-gray-100"}`}
            onDragOver={e => { e.preventDefault(); if (canEdit) setDragOverSection(section.id); }}
            onDragLeave={() => setDragOverSection(null)}
            onDrop={e => handleDrop(e, section.id)}
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              {editingSection === section.id ? (
                <input
                  autoFocus
                  className="font-serif text-2xl text-ink bg-transparent border-b border-gray-200 outline-none focus:border-brand"
                  defaultValue={section.name}
                  onBlur={e => renameSection(section.id, e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                />
              ) : (
                <h4 className="font-serif text-2xl text-ink flex items-center gap-2">
                  {section.name}
                  {canEdit && (
                    <button onClick={() => setEditingSection(section.id)} className="text-gray-300 hover:text-brand transition-colors" aria-label={en ? "Rename" : "Renomear"}>
                      <Pencil size={13} />
                    </button>
                  )}
                </h4>
              )}
              {canEdit && (
                <button onClick={() => removeSection(section)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label={en ? "Remove section" : "Remover secção"}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                  className="inline-flex items-center justify-center gap-1.5 bg-brand/5 text-brand px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-50 shrink-0"
                >
                  {uploadingSection === section.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {en ? "Upload image" : "Carregar imagem"}
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    className="flex-1 bg-cream/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                    placeholder={en ? "Paste a Pinterest / Instagram link…" : "Cole um link do Pinterest / Instagram…"}
                    value={linkInputs[section.id] || ""}
                    onChange={e => setLinkInputs(prev => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") addLink(section.id); }}
                  />
                  <button
                    onClick={() => addLink(section.id)}
                    disabled={addingLinkSection === section.id || !(linkInputs[section.id] || "").trim()}
                    className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-40 shrink-0"
                  >
                    {addingLinkSection === section.id ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                    {en ? "Add" : "Adicionar"}
                  </button>
                </div>
              </div>
            )}

            {sectionItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                {en ? "No images in this section yet." : "Ainda sem imagens nesta secção."}
              </p>
            ) : renderGrid(sectionItems)}
          </section>
        );
      })}

      {unsectioned.length > 0 && (
        <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
          <h4 className="font-serif text-2xl text-ink mb-6">{en ? "Unsorted" : "Sem secção"}</h4>
          {renderGrid(unsectioned)}
        </section>
      )}

      {items.length === 0 && sections.length === 0 && (
        <div className="py-16 text-center bg-white rounded-[2.5rem] shadow-md border border-gray-100">
          <ImageIcon size={28} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            {en ? "Setting up the moodboard…" : "A preparar o moodboard…"}
          </p>
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
            placeholder={en ? "New section name…" : "Nome da nova secção…"}
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addSection(); }}
          />
          <button
            onClick={addSection}
            disabled={addingSection || !newSectionName.trim()}
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-40 shrink-0"
          >
            {addingSection ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {en ? "New section" : "Nova secção"}
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" aria-label={en ? "Close" : "Fechar"}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
