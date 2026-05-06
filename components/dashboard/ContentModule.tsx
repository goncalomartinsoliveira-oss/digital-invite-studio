"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ContentModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

export default function ContentModule({ formData, setFormData, handleSaveDesign, saving }: ContentModuleProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>('hero');
  const [isMounted, setIsMounted] = useState(false);

  const dbContent = formData?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      handleSaveDesign();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const toggleVisibility = (key: string) => {
    setFormData({
      ...formData,
      content: { ...dbContent, sections_visibility: { ...visibility, [key]: visibility[key] === false } }
    });
  };

  const handleTextChange = (section: string, field: string, value: any) => {
    setFormData({
      ...formData,
      content: { ...dbContent, content: { ...content, [section]: { ...content[section], [field]: value } } }
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string, galleryIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadId = galleryIndex !== undefined ? `gallery-${galleryIndex}` : section;
    setUploading(uploadId);
    const fileName = `${uploadId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('invites').upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      if (galleryIndex !== undefined) {
        const newUrls = [...(content.gallery?.images_urls || ["", "", "", "", ""])];
        newUrls[galleryIndex] = publicUrl;
        handleTextChange('gallery', 'images_urls', newUrls);
      } else { handleTextChange(section, field, publicUrl); }
    }
    setUploading(null);
  };

  const AccordionItem = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
    const isOpen = openSection === id;
    const isVisible = visibility[id] !== false;

    return (
      <div className={`border transition-all duration-500 rounded-2xl bg-white overflow-hidden ${isOpen ? 'border-gray-200 shadow-lg my-6' : 'border-gray-100 shadow-sm hover:border-gray-200 mb-3'}`}>
        <div className="flex items-center justify-between p-5 cursor-pointer select-none" onClick={() => setOpenSection(isOpen ? null : id)}>
          <div className="flex items-center gap-4">
             <div className={`w-1.5 h-6 rounded-full transition-colors ${isVisible ? 'bg-[#722F37]' : 'bg-gray-200'}`}></div>
             <h3 className={`font-serif text-xl transition-colors ${isOpen ? 'text-[#722F37]' : 'text-gray-700'}`}>{title}</h3>
          </div>
          <div className="flex items-center gap-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase font-bold tracking-widest ${isVisible ? 'text-gray-500' : 'text-gray-300'}`}>{isVisible ? 'Visível' : 'Oculto'}</span>
                <button onClick={() => toggleVisibility(id)} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isVisible ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${isVisible ? 'left-5.5' : 'left-0.5'}`} />
                </button>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        {isOpen && (
          <div className="p-6 border-t border-gray-50 bg-[#FAFAFA] animate-in fade-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        )}
      </div>
    );
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#722F37] text-sm text-gray-800 px-0 py-2 transition-colors placeholder-gray-300";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block";

  return (
    <div className="pb-40 text-left animate-in fade-in duration-700 max-w-3xl mx-auto">
      
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md py-4 z-50 border-b border-gray-100">
         <h2 className="font-serif text-2xl text-gray-800">Conteúdo do Convite</h2>
         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-[#722F37]/30 border-t-[#722F37] rounded-full animate-spin"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">A guardar...</span>
                </>
            ) : (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Guardado</span>
                </>
            )}
         </div>
      </div>

      <div className="space-y-1">
        
        <AccordionItem id="hero" title="01. Capa (Hero)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClass}>Frase Superior</label>
              <input className={inputClass} value={content.hero?.text_above_names ?? ''} onChange={e => handleTextChange('hero', 'text_above_names', e.target.value)} placeholder="Ex: THE WEDDING OF" />
            </div>
            <div>
               <label className={labelClass}>Fotografia / Vídeo (.mp4)</label>
               <div className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm group">
                {content.hero?.main_image_url ? (
                  <>
                    {content.hero.main_image_url.includes('.mp4') ? (
                       <video src={content.hero.main_image_url} className="w-full h-full object-cover" muted loop autoPlay />
                    ) : (
                       <img src={content.hero.main_image_url} className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => handleTextChange('hero', 'main_image_url', '')} className="absolute top-2 right-2 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform z-10">✕</button>
                  </>
                ) : <div className="h-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">Sem Ficheiro</div>}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold tracking-widest uppercase transition-all backdrop-blur-sm">
                  {uploading === 'hero' ? 'A carregar...' : 'Alterar'}
                  <input type="file" className="hidden" onChange={e => handleUpload(e, 'hero', 'main_image_url')} />
                </label>
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem id="countdown" title="02. Contador Regressivo">
          <div>
            <label className={labelClass}>Título do Contador</label>
            <input className={inputClass} value={content.countdown?.title ?? ''} onChange={e => handleTextChange('countdown', 'title', e.target.value)} placeholder='Ex: O dia do "Sim" aproxima-se...' />
          </div>
        </AccordionItem>

        <AccordionItem id="story" title="03. A Nossa História">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Título Secundário</label>
                <input className={inputClass} value={content.story?.title_our ?? ''} onChange={e => handleTextChange('story', 'title_our', e.target.value)} placeholder="Ex: A Nossa" />
                
                <label className={`${labelClass} mt-6`}>Título Principal</label>
                <input className={inputClass} value={content.story?.title_history ?? ''} onChange={e => handleTextChange('story', 'title_history', e.target.value)} placeholder="Ex: História" />
              </div>
              <div className="flex flex-col items-start md:items-center">
                 <label className={labelClass}>Foto Oval (Opcional)</label>
                 <div className="relative w-24 h-32 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm group mt-2">
                  {content.story?.story_image_url ? <img src={content.story.story_image_url} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[9px] font-bold text-gray-300">FOTO</div>}
                  <label className="absolute inset-0 bg-[#722F37]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[9px] font-bold tracking-widest transition-all">
                    <input type="file" className="hidden" onChange={e => handleUpload(e, 'story', 'story_image_url')} /> {uploading === 'story' ? '...' : 'SUBIR'}
                  </label>
                </div>
                {content.story?.story_image_url && (
                  <button onClick={() => handleTextChange('story', 'story_image_url', '')} className="text-[10px] text-red-500 uppercase tracking-widest mt-2 font-bold hover:text-red-700">Remover Foto</button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
               <label className={labelClass}>Textos da História (Até 3 Parágrafos)</label>
               {[0, 1, 2].map(idx => (
                <textarea key={idx} className={`${inputClass} resize-none`} rows={2} value={content.story?.paragraphs?.[idx] ?? ''} placeholder={`Parágrafo ${idx + 1}`}
                  onChange={e => {
                    const newP = [...(content.story?.paragraphs || ["", "", ""])];
                    newP[idx] = e.target.value;
                    handleTextChange('story', 'paragraphs', newP);
                  }}
                />
              ))}
            </div>
          </div>
        </AccordionItem>

        <AccordionItem id="gallery" title="04. Galeria Editorial">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className={labelClass}>Título Menor</label>
              <input className={inputClass} value={content.gallery?.title_our ?? ''} onChange={e => handleTextChange('gallery', 'title_our', e.target.value)} placeholder="Ex: A Nossa" />
            </div>
            <div>
              <label className={labelClass}>Título Principal</label>
              <input className={inputClass} value={content.gallery?.title_gallery ?? ''} onChange={e => handleTextChange('gallery', 'title_gallery', e.target.value)} placeholder="Ex: Galeria" />
            </div>
          </div>
          <label className={labelClass}>Fotografias (Até 5)</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {[0,1,2,3,4].map(idx => (
              <div key={idx} className="relative aspect-[3/4] bg-white rounded-lg border border-dashed border-gray-300 overflow-hidden group">
                {content.gallery?.images_urls?.[idx] ? (
                  <>
                    <img src={content.gallery.images_urls[idx]} className="w-full h-full object-cover" />
                    <button onClick={(e) => {
                      e.preventDefault();
                      const newUrls = [...(content.gallery?.images_urls || ["", "", "", "", ""])];
                      newUrls[idx] = '';
                      handleTextChange('gallery', 'images_urls', newUrls);
                    }} className="absolute top-1 right-1 bg-red-500/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </>
                ) : <div className="h-full flex flex-col items-center justify-center text-gray-300"><span className="text-xl font-light">+</span></div>}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white transition-all">
                  <span className="text-[9px] font-bold uppercase tracking-widest">{uploading === `gallery-${idx}` ? '...' : 'ADD'}</span>
                  <input type="file" className="hidden" onChange={e => handleUpload(e, 'gallery', 'images_urls', idx)} />
                </label>
              </div>
            ))}
          </div>
        </AccordionItem>

        <AccordionItem id="program" title="05. Cronograma">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div>
               <label className={labelClass}>Título Menor</label>
               <input className={inputClass} value={content.program?.title_our ?? ''} onChange={e => handleTextChange('program', 'title_our', e.target.value)} placeholder="Ex: O Nosso" />
             </div>
             <div>
               <label className={labelClass}>Título Principal</label>
               <input className={inputClass} value={content.program?.title_program ?? ''} onChange={e => handleTextChange('program', 'title_program', e.target.value)} placeholder="Ex: Programa" />
             </div>
          </div>
          
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
             <label className={labelClass}>Lista de Eventos</label>
             <button onClick={() => {
                 const newEvs = [...(content.program?.events || []), { time: "00:00", title: "Novo Evento" }];
                 handleTextChange('program', 'events', newEvs);
               }} className="text-[9px] font-bold text-[#722F37] uppercase tracking-widest hover:text-[#5a242c]">
                 + Adicionar Evento
             </button>
          </div>
          
          <div className="space-y-2">
            {(content.program?.events || []).map((ev: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm group">
                <input className="w-20 bg-gray-50 border-none rounded-lg px-2 py-2 font-bold text-[#722F37] text-xs text-center focus:ring-1 focus:ring-[#722F37]" value={ev.time} onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].time = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <input className="flex-grow bg-transparent border-none px-2 py-2 text-sm text-gray-800 focus:ring-0" value={ev.title} placeholder="Nome do Evento" onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].title = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <button onClick={() => {
                  const newEvs = content.program.events.filter((_: any, i: number) => i !== idx); handleTextChange('program', 'events', newEvs);
                }} className="text-gray-300 hover:text-red-500 px-2 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </AccordionItem>

        <AccordionItem id="event" title="06. Locais do Evento">
           <div className="space-y-8">
              <div>
                 <label className={labelClass}>Título Principal da Secção</label>
                 <input className={inputClass} value={content.event?.title_main ?? ''} onChange={e => handleTextChange('event', 'title_main', e.target.value)} placeholder="Ex: O Nosso Casamento"/>
              </div>

              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">A Cerimónia</h4>
                    <button onClick={() => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, active: !(content.event?.ceremony?.active !== false) })} className={`w-8 h-4 rounded-full relative transition-colors ${content.event?.ceremony?.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${content.event?.ceremony?.active !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${content.event?.ceremony?.active === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div>
                        <label className={labelClass}>Título</label>
                        <input className={inputClass} value={content.event?.ceremony?.title ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, title: e.target.value })} placeholder="Ex: A Cerimónia" />
                    </div>
                    <div>
                        <label className={labelClass}>Hora</label>
                        <input className={inputClass} value={content.event?.ceremony?.time ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, time: e.target.value })} placeholder="Ex: 13:30" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Local / Morada</label>
                        <input className={inputClass} value={content.event?.ceremony?.location ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, location: e.target.value })} placeholder="Ex: Igreja de São Martinho, Sintra" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Descrição</label>
                        <textarea className={`${inputClass} resize-none`} rows={2} value={content.event?.ceremony?.description ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, description: e.target.value })} placeholder="O momento em que dizemos o sim..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Link do Google Maps</label>
                        <input className={inputClass} value={content.event?.ceremony?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, google_maps_url: e.target.value })} placeholder="Ex: https://maps.google.com/..." />
                    </div>
                 </div>
              </div>

              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">A Receção</h4>
                    <button onClick={() => handleTextChange('event', 'reception', { ...content.event?.reception, active: !(content.event?.reception?.active !== false) })} className={`w-8 h-4 rounded-full relative transition-colors ${content.event?.reception?.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${content.event?.reception?.active !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${content.event?.reception?.active === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div>
                        <label className={labelClass}>Título</label>
                        <input className={inputClass} value={content.event?.reception?.title ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, title: e.target.value })} placeholder="Ex: A Receção" />
                    </div>
                    <div>
                        <label className={labelClass}>Hora</label>
                        <input className={inputClass} value={content.event?.reception?.time ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, time: e.target.value })} placeholder="Ex: 15:00" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Local / Morada</label>
                        <input className={inputClass} value={content.event?.reception?.location ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, location: e.target.value })} placeholder="Ex: Quinta do Vale, Sintra" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Descrição</label>
                        <textarea className={`${inputClass} resize-none`} rows={2} value={content.event?.reception?.description ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, description: e.target.value })} placeholder="Juntem-se a nós para jantar..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Link do Google Maps</label>
                        <input className={inputClass} value={content.event?.reception?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, google_maps_url: e.target.value })} placeholder="Ex: https://maps.google.com/..." />
                    </div>
                 </div>
              </div>
           </div>
        </AccordionItem>

        <AccordionItem id="details_header" title="07. Cabeçalho dos Detalhes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Título Menor</label>
              <input className={inputClass} value={content.details?.title_the ?? ''} onChange={e => handleTextChange('details', 'title_the', e.target.value)} placeholder="Ex: Os"/>
            </div>
            <div>
              <label className={labelClass}>Título Principal</label>
              <input className={inputClass} value={content.details?.title_details ?? ''} onChange={e => handleTextChange('details', 'title_details', e.target.value)} placeholder="Ex: Detalhes"/>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem id="useful_info" title="08. Logística & Estacionamento">
           <div className="space-y-6">
             <div>
               <label className={labelClass}>Sub-Título</label>
               <input className={inputClass} value={content.details?.parking_title ?? ''} onChange={e => handleTextChange('details', 'parking_title', e.target.value)} placeholder="Ex: Localização e Estacionamento"/>
             </div>
             <div>
               <label className={labelClass}>Texto Informativo</label>
               <textarea className={`${inputClass} resize-none`} rows={4} value={content.details?.parking_text ?? ''} onChange={e => handleTextChange('details', 'parking_text', e.target.value)} />
             </div>
           </div>
        </AccordionItem>

        <AccordionItem id="accommodation" title="09. Alojamento">
           <div className="space-y-6">
             <div>
               <label className={labelClass}>Título Alojamento</label>
               <input className={inputClass} value={content.details?.accommodation_title ?? ''} onChange={e => handleTextChange('details', 'accommodation_title', e.target.value)} placeholder="Ex: Onde Ficar"/>
             </div>
             <div>
               <label className={labelClass}>Texto Informativo</label>
               <textarea className={`${inputClass} resize-none`} rows={2} value={content.details?.accommodation_text ?? ''} onChange={e => handleTextChange('details', 'accommodation_text', e.target.value)} />
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-3">
                  <label className={labelClass}>Botões / Links de Hotéis</label>
                  <button onClick={() => {
                      const newBtns = [...(content.details?.accommodation_buttons || []), { text: "Novo Hotel", url: "" }];
                      handleTextChange('details', 'accommodation_buttons', newBtns);
                  }} className="text-[9px] font-bold text-[#722F37] uppercase tracking-widest hover:text-[#5a242c]">+ Adicionar Link</button>
                </div>
                <div className="space-y-2">
                    {(content.details?.accommodation_buttons || []).map((btn: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <input className="w-1/3 bg-transparent border-none text-xs font-medium focus:ring-0 px-2" value={btn.text} onChange={e => {
                                const newB = [...content.details.accommodation_buttons]; newB[i].text = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                            }} placeholder="Nome (Ex: Hotel X)" />
                            <div className="w-[1px] h-6 bg-gray-200"></div>
                            <input className="flex-1 bg-transparent border-none text-xs text-gray-500 focus:ring-0 px-2" value={btn.url} onChange={e => {
                                const newB = [...content.details.accommodation_buttons]; newB[i].url = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                            }} placeholder="URL (Ex: https://...)" />
                            <button onClick={() => {
                                const newB = content.details.accommodation_buttons.filter((_:any, idx:number) => idx !== i);
                                handleTextChange('details', 'accommodation_buttons', newB);
                            }} className="text-gray-300 hover:text-red-500 px-2">✕</button>
                        </div>
                    ))}
                </div>
             </div>
           </div>
        </AccordionItem>

        <AccordionItem id="dress_code" title="10. Dress Code & Cores">
           <div className="space-y-8">
             <div>
                <label className={labelClass}>Título da Secção</label>
                <input className={inputClass} value={content.dress_code?.title ?? ''} onChange={e => handleTextChange('dress_code', 'title', e.target.value)} placeholder="Ex: Dress Code" />
             </div>
             <div>
                <label className={labelClass}>Mensagem</label>
                <textarea className={`${inputClass} resize-none`} rows={3} value={content.dress_code?.text?.[0] ?? ''} onChange={e => handleTextChange('dress_code', 'text', [e.target.value])} />
             </div>
             
             <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <label className={labelClass}>Apresentar Paleta de Cores?</label>
                    <button onClick={() => handleTextChange('dress_code', 'show_palette', !(content.dress_code?.show_palette !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.dress_code?.show_palette !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.dress_code?.show_palette !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                    </button>
                </div>
                
                <div className={`flex flex-wrap gap-3 ${content.dress_code?.show_palette === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    {(content.dress_code?.colors || []).map((color: string, idx: number) => (
                        <div key={idx} className="relative group w-12 h-12">
                            <input type="color" className="w-full h-full rounded-full cursor-pointer border-none shadow-sm p-0 overflow-hidden" value={color} onChange={e => {
                                const newC = [...content.dress_code.colors]; newC[idx] = e.target.value; handleTextChange('dress_code', 'colors', newC);
                            }} />
                            <button onClick={() => {
                                const newC = content.dress_code.colors.filter((_:any, i:number) => i !== idx); handleTextChange('dress_code', 'colors', newC);
                            }} className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    ))}
                    <button onClick={() => {
                        const newC = [...(content.dress_code?.colors || []), "#000000"]; handleTextChange('dress_code', 'colors', newC);
                    }} className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-[#722F37] hover:border-[#722F37] transition-colors">+</button>
                </div>
             </div>
           </div>
        </AccordionItem>

        <AccordionItem id="gifts" title="11. Presentes & IBAN">
           <div className="space-y-6">
              <div>
                <label className={labelClass}>Título</label>
                <input className={inputClass} value={content.gifts?.title ?? ''} onChange={e => handleTextChange('gifts', 'title', e.target.value)} placeholder="Ex: Presentes" />
              </div>
              <div>
                <label className={labelClass}>Mensagem</label>
                <textarea className={`${inputClass} resize-none`} rows={3} value={content.gifts?.text ?? ''} onChange={e => handleTextChange('gifts', 'text', e.target.value)} />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <label className={labelClass}>Botão Revelar IBAN?</label>
                    <button onClick={() => handleTextChange('gifts', 'show_iban', !(content.gifts?.show_iban !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.gifts?.show_iban !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.gifts?.show_iban !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                    </button>
                </div>
                <div className={`grid grid-cols-1 gap-4 ${content.gifts?.show_iban === false ? 'hidden' : ''}`}>
                    <div>
                        <label className={labelClass}>Texto do Botão</label>
                        <input className={inputClass} value={content.gifts?.iban_button_text ?? ''} onChange={e => handleTextChange('gifts', 'iban_button_text', e.target.value)} placeholder="Ex: Contribuir" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                       <div>
                           <label className={labelClass}>Nome dos Titulares</label>
                           <input className={inputClass} value={content.gifts?.iban_holders_name ?? ''} onChange={e => handleTextChange('gifts', 'iban_holders_name', e.target.value)} placeholder="Nomes" />
                       </div>
                       <div>
                           <label className={labelClass}>IBAN (sem espaços)</label>
                           <input className={inputClass} value={content.gifts?.iban_value ?? ''} onChange={e => handleTextChange('gifts', 'iban_value', e.target.value)} placeholder="PT50..." />
                       </div>
                    </div>
                </div>
              </div>
           </div>
        </AccordionItem>

        <AccordionItem id="rsvp" title="12. Confirmação (RSVP)">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                 <label className={labelClass}>Título Menor</label>
                 <input className={inputClass} value={content.rsvp?.title_please ?? ''} onChange={e => handleTextChange('rsvp', 'title_please', e.target.value)} placeholder="Por favor" />
              </div>
              <div>
                 <label className={labelClass}>Título Principal</label>
                 <input className={inputClass} value={content.rsvp?.title_confirm ?? ''} onChange={e => handleTextChange('rsvp', 'title_confirm', e.target.value)} placeholder="Confirmar Presença" />
              </div>
              <div>
                 <label className={labelClass}>Data Limite (Texto)</label>
                 <input className={inputClass} value={content.rsvp?.text_limit_date_fixed ?? ''} onChange={e => handleTextChange('rsvp', 'text_limit_date_fixed', e.target.value)} placeholder="Ex: 15.10.26" />
              </div>
           </div>
        </AccordionItem>

        <AccordionItem id="footer" title="13. Rodapé & Contactos">
           <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <label className={labelClass}>Ligar Área de Contactos?</label>
                <button onClick={() => handleTextChange('footer', 'show_contacts', !(content.footer?.show_contacts !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.footer?.show_contacts !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.footer?.show_contacts !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              <div className={`grid grid-cols-2 gap-6 pb-6 border-b border-gray-100 ${content.footer?.show_contacts === false ? 'hidden' : ''}`}>
                 <div>
                    <label className={labelClass}>Nome Contacto 1</label>
                    <input className={inputClass} value={content.footer?.contact_1_name ?? ''} onChange={e => handleTextChange('footer', 'contact_1_name', e.target.value)} />
                    <label className={`${labelClass} mt-4`}>Telefone 1</label>
                    <input className={inputClass} value={content.footer?.contact_1_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_1_phone', e.target.value)} />
                 </div>
                 <div>
                    <label className={labelClass}>Nome Contacto 2</label>
                    <input className={inputClass} value={content.footer?.contact_2_name ?? ''} onChange={e => handleTextChange('footer', 'contact_2_name', e.target.value)} />
                    <label className={`${labelClass} mt-4`}>Telefone 2</label>
                    <input className={inputClass} value={content.footer?.contact_2_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_2_phone', e.target.value)} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                 <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Frase Suave</label>
                        <input className={inputClass} value={content.footer?.title_main ?? ''} onChange={e => handleTextChange('footer', 'title_main', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Frase Impacto</label>
                        <input className={inputClass} value={content.footer?.title_celebrate ?? ''} onChange={e => handleTextChange('footer', 'title_celebrate', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Localização Inferior</label>
                        <input className={inputClass} value={content.footer?.location_text ?? ''} onChange={e => handleTextChange('footer', 'location_text', e.target.value)} />
                    </div>
                 </div>
                 <div>
                    <label className={labelClass}>Fotografia de Fecho (Opcional)</label>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm group">
                        {content.footer?.footer_image_url ? (
                        <>
                            <img src={content.footer.footer_image_url} className="w-full h-full object-cover" />
                            <button onClick={() => handleTextChange('footer', 'footer_image_url', '')} className="absolute top-2 right-2 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:scale-110 z-10">✕</button>
                        </>
                        ) : <div className="h-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">Sem Ficheiro</div>}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold tracking-widest uppercase transition-all backdrop-blur-sm">
                        {uploading === 'footer' ? 'A carregar...' : 'Alterar Foto'}
                        <input type="file" className="hidden" onChange={e => handleUpload(e, 'footer', 'footer_image_url')} />
                        </label>
                    </div>
                 </div>
              </div>
           </div>
        </AccordionItem>

      </div>
    </div>
  );
}