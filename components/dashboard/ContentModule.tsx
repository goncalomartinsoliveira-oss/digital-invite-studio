"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; 

interface ContentModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

export default function ContentModule({ formData, setFormData, handleSaveDesign, saving }: ContentModuleProps) {
  
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingStoryImage, setUploadingStoryImage] = useState(false); // ESTADO PARA A FOTO DA HISTÓRIA

  const contentData = formData?.content?.content || {};
  const story = contentData.story || {};
  const gifts = contentData.gifts || {};
  const program = contentData.program || {};
  const dressCode = contentData.dress_code || {};
  
  const galleryUrls = contentData.gallery?.images_urls || ["", "", "", "", ""];

  const handleContentChange = (section: string, field: string, value: any) => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {}; 
    const currentSectionContent = currentTexts[section] || {};

    setFormData({
      ...formData,
      content: {
        ...dbContent,
        content: {
          ...currentTexts,
          [section]: {
            ...currentSectionContent,
            [field]: value
          }
        }
      }
    });
  };

  const handleStoryParagraphChange = (index: number, newValue: string) => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {};
    const storyContent = currentTexts.story || {};
    
    const currentParagraphs = storyContent.paragraphs || ["", "", ""];
    const updatedParagraphs = [...currentParagraphs];
    updatedParagraphs[index] = newValue;

    handleContentChange('story', 'paragraphs', updatedParagraphs);
  };

  // FUNÇÃO: UPLOAD DA FOTO DA MOLDURA DOURADA (HISTÓRIA)
  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStoryImage(true);
    const fileName = `story-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('invites').upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      handleContentChange('story', 'story_image_url', publicUrl);
    } else {
      console.error(uploadError);
      alert("Erro ao fazer upload da imagem da história.");
    }
    setUploadingStoryImage(false);
  };

  const currentEvents = program.events || [
    { time: "12:00", title: "RECEÇÃO" },
    { time: "13:30", title: "CERIMÓNIA" }
  ];

  const handleProgramEventChange = (index: number, field: 'time' | 'title', value: string) => {
    const updatedEvents = [...currentEvents];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    handleContentChange('program', 'events', updatedEvents);
  };

  const handleAddProgramEvent = () => {
    const updatedEvents = [...currentEvents, { time: "00:00", title: "NOVO EVENTO" }];
    handleContentChange('program', 'events', updatedEvents);
  };

  const handleRemoveProgramEvent = (index: number) => {
    const updatedEvents = currentEvents.filter((_: any, i: number) => i !== index);
    handleContentChange('program', 'events', updatedEvents);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('invites').upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      const newUrls = [...galleryUrls];
      newUrls[index] = publicUrl; 
      handleContentChange('gallery', 'images_urls', newUrls);
    } else {
      console.error(uploadError);
      alert("Erro ao fazer upload da imagem.");
    }
    setUploadingIndex(null);
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newUrls = [...galleryUrls];
    newUrls[index] = ""; 
    handleContentChange('gallery', 'images_urls', newUrls);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500 text-left pb-24">
      
      {/* --- COLUNA ESQUERDA --- */}
      <div className="space-y-8">
        
        {/* BLOCO: GALERIA DE FOTOS */}
        <section className="bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm">
          <div className="border-b border-[#3e3226]/10 pb-4">
            <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">Galeria de Fotos</h3>
            <p className="text-[11px] opacity-60 mt-1">Carregue entre 1 a 5 fotografias. O design do convite irá adaptar-se automaticamente ao número de imagens que escolher.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4].map((idx) => {
              const url = galleryUrls[idx];
              const isLargeSlot = idx === 0;

              return (
                <div key={idx} className={`relative bg-[#FDFBF7] border border-dashed border-[#3e3226]/30 flex flex-col items-center justify-center group overflow-hidden ${isLargeSlot ? 'col-span-3 aspect-[21/9]' : 'col-span-1 aspect-[3/4]'} rounded-sm`}>
                  {url && url.trim() !== "" ? (
                    <>
                      <img src={url} alt={`Galeria ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.preventDefault(); handleRemoveGalleryImage(idx); }} 
                          className="bg-red-500 text-white text-[9px] uppercase tracking-widest px-3 py-2 rounded-sm shadow-md hover:bg-red-600"
                        >
                          Remover
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-[9px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity hover:bg-[#3e3226]/5">
                      {uploadingIndex === idx ? (
                        <span className="animate-pulse">A carregar...</span>
                      ) : (
                        <span className="flex flex-col items-center gap-2">
                           <span className="text-xl leading-none">+</span>
                           {isLargeSlot ? "Foto Principal" : `Foto ${idx + 1}`}
                        </span>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGalleryUpload(e, idx)} disabled={uploadingIndex !== null} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BLOCO: A NOSSA HISTÓRIA */}
        <section className="bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm">
          <div className="border-b border-[#3e3226]/10 pb-4">
            <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">A Nossa História</h3>
          </div>
          
          <div className="space-y-6">
            
            {/* NOVO: UPLOAD DA FOTO DA MOLDURA DOURADA */}
            <div className="space-y-4 border-b border-[#3e3226]/10 pb-6">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Fotografia da Moldura</label>
              <div className="flex items-center gap-4">
                {story.story_image_url && story.story_image_url.trim() !== "" && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#3e3226]/20">
                    <img src={story.story_image_url} className="w-full h-full object-cover" alt="História" />
                    <button 
                      onClick={(e) => { e.preventDefault(); handleContentChange('story', 'story_image_url', ""); }}
                      className="absolute inset-0 bg-black/50 text-white text-[8px] uppercase tracking-widest flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      X
                    </button>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-[#FDFBF7] border border-[#3e3226]/20 text-[#3e3226] text-[9px] font-bold tracking-widest uppercase hover:bg-[#3e3226] hover:text-white transition-colors rounded-sm shadow-sm">
                  {uploadingStoryImage ? "A carregar..." : (story.story_image_url ? "Alterar Foto" : "Adicionar Foto à Moldura")}
                  <input type="file" className="hidden" accept="image/*" onChange={handleStoryImageUpload} disabled={uploadingStoryImage} />
                </label>
              </div>
            </div>

            {[0, 1, 2].map((idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">
                  {idx === 0 ? "1º Parágrafo (O Encontro)" : idx === 1 ? "2º Parágrafo (A Jornada)" : "3º Parágrafo (O Futuro)"}
                </label>
                <textarea 
                  className="w-full border p-4 text-[13px] leading-relaxed outline-none focus:border-[#72393F] transition-colors rounded-sm bg-[#FDFBF7]" 
                  rows={4}
                  value={(story.paragraphs && story.paragraphs[idx]) || ""} 
                  onChange={(e) => handleStoryParagraphChange(idx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* --- COLUNA DIREITA --- */}
      <div className="space-y-8">
        
        {/* BLOCO: PROGRAMA DA FESTA */}
        <section className="bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm">
          <div className="border-b border-[#3e3226]/10 pb-4 flex justify-between items-center">
            <div>
                <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">O Programa</h3>
                <p className="text-[11px] opacity-60 mt-1">Horários do grande dia.</p>
            </div>
            <button onClick={handleAddProgramEvent} className="px-4 py-2 bg-[#FDFBF7] border border-[#3e3226]/20 text-[#3e3226] text-[9px] font-bold tracking-widest uppercase hover:bg-[#3e3226] hover:text-white transition-colors shadow-sm">
              + Adicionar
            </button>
          </div>
          
          <div className="space-y-4">
            {currentEvents.map((event: any, index: number) => (
              <div key={index} className="flex gap-4 items-center bg-[#FDFBF7] p-4 border border-[#3e3226]/10 rounded-sm group">
                <input 
                  type="text"
                  className="w-20 bg-transparent border-b border-[#3e3226]/20 text-[13px] font-mono outline-none focus:border-[#72393F]"
                  value={event.time}
                  onChange={(e) => handleProgramEventChange(index, 'time', e.target.value)}
                  placeholder="12:00"
                />
                <input 
                  type="text"
                  className="flex-grow bg-transparent border-b border-[#3e3226]/20 text-[12px] tracking-widest uppercase outline-none focus:border-[#72393F]"
                  value={event.title}
                  onChange={(e) => handleProgramEventChange(index, 'title', e.target.value)}
                  placeholder="Nome do Evento"
                />
                <button onClick={() => handleRemoveProgramEvent(index)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full" title="Remover">
                   ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* BLOCO: PRESENTES & IBAN */}
        <section className="bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm">
          <div className="border-b border-[#3e3226]/10 pb-4">
            <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">Presentes / IBAN</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Texto Introdutório</label>
              <textarea 
                className="w-full border p-4 text-[13px] leading-relaxed outline-none focus:border-[#72393F] bg-[#FDFBF7] rounded-sm" 
                rows={3}
                value={gifts.text || ""} 
                onChange={(e) => handleContentChange('gifts', 'text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">IBAN</label>
               <input 
                 className="w-full border-b py-2 text-[14px] tracking-widest font-mono outline-none focus:border-[#72393F] bg-transparent" 
                 value={gifts.iban_value || ""} 
                 onChange={(e) => handleContentChange('gifts', 'iban_value', e.target.value)}
               />
             </div>
          </div>
        </section>

        {/* BLOCO: DRESS CODE */}
        <section className="bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm">
          <div className="border-b border-[#3e3226]/10 pb-4">
            <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">Dress Code</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Mensagem Principal</label>
              <textarea 
                className="w-full border p-3 text-[13px] leading-relaxed outline-none focus:border-[#72393F] rounded-sm bg-[#FDFBF7]" 
                rows={3}
                value={(dressCode.text && dressCode.text[0]) || ""} 
                onChange={(e) => {
                  const updatedTexts = [...(dressCode.text || ["", ""])];
                  updatedTexts[0] = e.target.value;
                  handleContentChange('dress_code', 'text', updatedTexts);
                }}
              />
            </div>
          </div>
        </section>

      </div>

      {/* BOTÃO SALVAR GLOBAL FIXO NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#3e3226]/10 p-4 z-40 flex justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button 
            onClick={handleSaveDesign} 
            disabled={saving} 
            className="w-full max-w-lg bg-black text-[#FDFBF7] py-4 text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl hover:bg-[#3e3226] active:scale-[0.98] transition-all disabled:opacity-50 rounded-sm"
        >
          {saving ? "A Sincronizar..." : "Guardar Textos do Convite"}
        </button>
      </div>

    </div>
  );
}