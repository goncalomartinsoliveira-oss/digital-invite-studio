"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Link2, Trash2, Loader2, X, ExternalLink, Image as ImageIcon } from "lucide-react";
import { moodboardItemDomain, type MoodboardItem } from "@/lib/moodboard";

// Moodboard do evento — área de gestão, exclusiva de contas de agência.
// Mural partilhado entre agência e casal: sem distinção agency/shared, ao
// contrário de Orçamento/Tarefas — não há aqui nada sensível a esconder.
// Duas formas de adicionar: carregar imagem, ou colar um link (Pinterest/
// Instagram) — a miniatura desse link é extraída do servidor (ver
// app/api/moodboard/unfurl), porque o browser não pode ir buscar HTML de
// outro domínio diretamente (CORS).

interface Props {
  invitationId: string;
  canEdit: boolean;
  locale: string;
}

export default function MoodboardModule({ invitationId, canEdit, locale }: Props) {
  const en = locale === "en";
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [unfurlingIds, setUnfurlingIds] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("event_moodboard_items")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false });
    setItems((data as MoodboardItem[]) || []);
    setLoading(false);
  }, [invitationId]);

  useEffect(() => { load(); }, [load]);

  const uploadImage = async (file: File) => {
    if (!canEdit) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `moodboard/${invitationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("invites").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(path);
      const { data } = await supabase
        .from("event_moodboard_items")
        .insert([{ invitation_id: invitationId, kind: "image", image_url: publicUrl }])
        .select("*")
        .single();
      if (data) setItems(prev => [data as MoodboardItem, ...prev]);
    }
    setUploading(false);
  };

  const addLink = async () => {
    const url = linkInput.trim();
    if (!canEdit || !url) return;
    setAddingLink(true);
    const { data, error } = await supabase
      .from("event_moodboard_items")
      .insert([{ invitation_id: invitationId, kind: "link", source_url: url }])
      .select("*")
      .single();
    setAddingLink(false);
    setLinkInput("");
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
    await supabase.from("event_moodboard_items").delete().eq("id", id);
  };

  const saveCaption = async (id: string, caption: string) => {
    setEditingCaption(null);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, caption } : i)));
    await supabase.from("event_moodboard_items").update({ caption: caption || null }).eq("id", id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadImage(file);
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <section
        className={`bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border transition-colors ${dragOver ? "border-brand" : "border-gray-100"}`}
        onDragOver={e => { e.preventDefault(); if (canEdit) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="mb-8">
          <h3 className="font-serif text-3xl text-brand mb-2">{en ? "Inspiration" : "Inspiração"}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            {en ? "A shared moodboard for the event" : "Um mural de inspiração partilhado para o evento"}
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-1.5 bg-brand/5 text-brand px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-50 shrink-0"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {en ? "Upload image" : "Carregar imagem"}
            </button>
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 bg-cream/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                placeholder={en ? "Paste a Pinterest / Instagram link…" : "Cole um link do Pinterest / Instagram…"}
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addLink(); }}
              />
              <button
                onClick={addLink}
                disabled={addingLink || !linkInput.trim()}
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-40 shrink-0"
              >
                {addingLink ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                {en ? "Add" : "Adicionar"}
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {en
                ? "Drag images here, or paste a Pinterest / Instagram link to start the moodboard."
                : "Arraste imagens para aqui, ou cole um link do Pinterest / Instagram para começar o moodboard."}
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {items.map(item => {
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
        )}
      </section>

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
