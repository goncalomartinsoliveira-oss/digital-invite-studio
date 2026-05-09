"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ContentModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

// 1. ACCORDION ITEM (Fora do componente principal para evitar perda de foco)
const AccordionItem = ({ id, title, children, isOpen, isVisible, onToggleOpen, onToggleVisibility }: any) => {
  return (
    <div className={`border transition-all duration-500 rounded-2xl bg-white overflow-hidden ${isOpen ? 'border-gray-200 shadow-lg my-6' : 'border-gray-100 shadow-sm hover:border-gray-200 mb-3'}`}>
      <div className="flex items-center justify-between p-5 cursor-pointer select-none" onClick={onToggleOpen}>
        <div className="flex items-center gap-4">
           <div className={`w-1.5 h-6 rounded-full transition-colors ${isVisible ? 'bg-[#722F37]' : 'bg-gray-200'}`}></div>
           <h3 className={`font-serif text-xl transition-colors ${isOpen ? 'text-[#722F37]' : 'text-gray-700'}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
              <span className={`text-[9px] uppercase font-bold tracking-widest ${isVisible ? 'text-gray-500' : 'text-gray-300'}`}>{isVisible ? 'Visível' : 'Oculto'}</span>
              <button onClick={onToggleVisibility} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isVisible ? 'bg-green-500' : 'bg-gray-200'}`}>
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

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#722F37] text-sm text-gray-800 px-0 py-2 transition-colors placeholder-gray-300";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block";

  return (
    <div className="pb-40 text-left animate-in fade-in duration-700 max-w-3xl mx-auto pt-6">
      
      <div className="space-y-1">
        
        {/* 01. HERO */}
        <AccordionItem 
            id="hero" title="01. Capa (Hero)"
            isOpen={openSection === 'hero'} isVisible={visibility['hero'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'hero' ? null : 'hero')}
            onToggleVisibility={() => toggleVisibility('hero')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClass}>Título Secundário</label>
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

        {/* 02. COUNTDOWN */}
        <AccordionItem 
            id="countdown" title="02. Contador Regressivo"
            isOpen={openSection === 'countdown'} isVisible={visibility['countdown'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'countdown' ? null : 'countdown')}
            onToggleVisibility={() => toggleVisibility('countdown')}
        >
          <div>
            <label className={labelClass}>Título Principal</label>
            <input className={inputClass} value={content.countdown?.title ?? ''} onChange={e => handleTextChange('countdown', 'title', e.target.value)} placeholder='Ex: O dia do "Sim" aproxima-se...' />
          </div>
        </AccordionItem>

        {/* 03. STORY */}
        <AccordionItem 
            id="story" title="03. A Nossa História"
            isOpen={openSection === 'story'} isVisible={visibility['story'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'story' ? null : 'story')}
            onToggleVisibility={() => toggleVisibility('story')}
        >
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
              </div>
            </div>
            <div className="space-y-4">
               <label className={labelClass}>Textos da História</label>
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

        {/* 04. GALLERY */}
        <AccordionItem 
            id="gallery" title="04. Galeria Editorial"
            isOpen={openSection === 'gallery'} isVisible={visibility['gallery'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'gallery' ? null : 'gallery')}
            onToggleVisibility={() => toggleVisibility('gallery')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div><label className={labelClass}>Título Secundário</label><input className={inputClass} value={content.gallery?.title_our ?? ''} onChange={e => handleTextChange('gallery', 'title_our', e.target.value)} /></div>
            <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.gallery?.title_gallery ?? ''} onChange={e => handleTextChange('gallery', 'title_gallery', e.target.value)} /></div>
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
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white transition-all text-[9px] font-bold">
                  <input type="file" className="hidden" onChange={e => handleUpload(e, 'gallery', 'images_urls', idx)} />
                  {uploading === `gallery-${idx}` ? '...' : 'ADD'}
                </label>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* 05. PROGRAM */}
        <AccordionItem 
            id="program" title="05. Cronograma"
            isOpen={openSection === 'program'} isVisible={visibility['program'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'program' ? null : 'program')}
            onToggleVisibility={() => toggleVisibility('program')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div><label className={labelClass}>Título Secundário</label><input className={inputClass} value={content.program?.title_our ?? ''} onChange={e => handleTextChange('program', 'title_our', e.target.value)} /></div>
             <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.program?.title_program ?? ''} onChange={e => handleTextChange('program', 'title_program', e.target.value)} /></div>
          </div>
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
             <label className={labelClass}>Lista de Eventos</label>
             <button onClick={() => {
                 const newEvs = [...(content.program?.events || []), { time: "00:00", title: "Novo Evento" }];
                 handleTextChange('program', 'events', newEvs);
               }} className="text-[9px] font-bold text-[#722F37] uppercase tracking-widest">+ Adicionar</button>
          </div>
          <div className="space-y-2">
            {(content.program?.events || []).map((ev: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm group">
                <input className="w-20 bg-gray-50 border-none rounded-lg px-2 py-2 font-bold text-[#722F37] text-xs text-center" value={ev.time} onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].time = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <input className="flex-grow bg-transparent border-none text-sm text-gray-800 focus:ring-0" value={ev.title} onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].title = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <button onClick={() => {
                  const newEvs = content.program.events.filter((_: any, i: number) => i !== idx); handleTextChange('program', 'events', newEvs);
                }} className="text-gray-300 hover:text-red-500 px-2 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* 06. LOCAIS */}
        <AccordionItem 
            id="event" title="06. Locais do Evento"
            isOpen={openSection === 'event'} isVisible={visibility['event'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'event' ? null : 'event')}
            onToggleVisibility={() => toggleVisibility('event')}
        >
           <div className="space-y-8">
              <div>
                 <label className={labelClass}>Título Principal da Secção</label>
                 <input className={inputClass} value={content.event?.title_main ?? ''} onChange={e => handleTextChange('event', 'title_main', e.target.value)} />
              </div>
              
              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">A Cerimónia</h4>
                    <button onClick={() => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, active: !(content.event?.ceremony?.active !== false) })} className={`w-8 h-4 rounded-full relative transition-colors ${content.event?.ceremony?.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${content.event?.ceremony?.active !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${content.event?.ceremony?.active === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.event?.ceremony?.title ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, title: e.target.value })} /></div>
                    <div><label className={labelClass}>Hora</label><input className={inputClass} value={content.event?.ceremony?.time ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, time: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Local / Morada</label><input className={inputClass} value={content.event?.ceremony?.location ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, location: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Link Google Maps</label><input className={inputClass} value={content.event?.ceremony?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, google_maps_url: e.target.value })} /></div>
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
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.event?.reception?.title ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, title: e.target.value })} /></div>
                    <div><label className={labelClass}>Hora</label><input className={inputClass} value={content.event?.reception?.time ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, time: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Local / Morada</label><input className={inputClass} value={content.event?.reception?.location ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, location: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Link Google Maps</label><input className={inputClass} value={content.event?.reception?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, google_maps_url: e.target.value })} /></div>
                 </div>
              </div>
           </div>
        </AccordionItem>

        {/* 07. DETALHES */}
        <AccordionItem 
            id="details_section" title="07. Detalhes do Evento"
            isOpen={openSection === 'details_section'} isVisible={visibility['details_section'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'details_section' ? null : 'details_section')}
            onToggleVisibility={() => toggleVisibility('details_section')}
        >
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div><label className={labelClass}>Título Secundário</label><input className={inputClass} value={content.details?.title_the ?? ''} onChange={e => handleTextChange('details', 'title_the', e.target.value)} /></div>
                 <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.details?.title_details ?? ''} onChange={e => handleTextChange('details', 'title_details', e.target.value)} /></div>
              </div>

              {/* LOGÍSTICA */}
              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">Logística & Estacionamento</h4>
                    <button onClick={() => toggleVisibility('useful_info')} className={`w-8 h-4 rounded-full relative transition-colors ${visibility['useful_info'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${visibility['useful_info'] !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`space-y-6 ${visibility['useful_info'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.details?.parking_title ?? ''} onChange={e => handleTextChange('details', 'parking_title', e.target.value)} /></div>
                    <div><label className={labelClass}>Texto Informativo</label><textarea className={`${inputClass} resize-none`} rows={4} value={content.details?.parking_text ?? ''} onChange={e => handleTextChange('details', 'parking_text', e.target.value)} /></div>
                 </div>
              </div>

              {/* ALOJAMENTO */}
              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">Alojamento</h4>
                    <button onClick={() => toggleVisibility('accommodation')} className={`w-8 h-4 rounded-full relative transition-colors ${visibility['accommodation'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${visibility['accommodation'] !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`space-y-6 ${visibility['accommodation'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.details?.accommodation_title ?? ''} onChange={e => handleTextChange('details', 'accommodation_title', e.target.value)} /></div>
                    <div><label className={labelClass}>Texto Informativo</label><textarea className={`${inputClass} resize-none`} rows={2} value={content.details?.accommodation_text ?? ''} onChange={e => handleTextChange('details', 'accommodation_text', e.target.value)} /></div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className={labelClass}>Links de Hotéis</label>
                        <button onClick={() => {
                            const newBtns = [...(content.details?.accommodation_buttons || []), { text: "Novo Hotel", url: "" }];
                            handleTextChange('details', 'accommodation_buttons', newBtns);
                        }} className="text-[9px] font-bold text-[#722F37] uppercase tracking-widest">+ Adicionar</button>
                      </div>
                      <div className="space-y-2">
                          {(content.details?.accommodation_buttons || []).map((btn: any, i: number) => (
                              <div key={i} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl">
                                  <input className="w-1/3 bg-transparent border-none text-xs font-medium focus:ring-0" value={btn.text} onChange={e => {
                                      const newB = [...content.details.accommodation_buttons]; newB[i].text = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                                  }} placeholder="Nome" />
                                  <input className="flex-1 bg-transparent border-none text-xs text-gray-500 focus:ring-0" value={btn.url} onChange={e => {
                                      const newB = [...content.details.accommodation_buttons]; newB[i].url = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                                  }} placeholder="https://..." />
                                  <button onClick={() => {
                                      const newB = content.details.accommodation_buttons.filter((_:any, idx:number) => idx !== i);
                                      handleTextChange('details', 'accommodation_buttons', newB);
                                  }} className="text-gray-300 hover:text-red-500 px-2">✕</button>
                              </div>
                          ))}
                      </div>
                    </div>
                 </div>
              </div>

              {/* DRESS CODE */}
              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">Dress Code & Cores</h4>
                    <button onClick={() => toggleVisibility('dress_code')} className={`w-8 h-4 rounded-full relative transition-colors ${visibility['dress_code'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${visibility['dress_code'] !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`space-y-8 ${visibility['dress_code'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                   <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.dress_code?.title ?? ''} onChange={e => handleTextChange('dress_code', 'title', e.target.value)} /></div>
                   <div><label className={labelClass}>Mensagem</label><textarea className={`${inputClass} resize-none`} rows={3} value={content.dress_code?.text?.[0] ?? ''} onChange={e => handleTextChange('dress_code', 'text', [e.target.value])} /></div>
                   <div>
                      <div className="flex justify-between items-center mb-4">
                          <label className={labelClass}>Mostrar Paleta?</label>
                          <button onClick={() => handleTextChange('dress_code', 'show_palette', !(content.dress_code?.show_palette !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.dress_code?.show_palette !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.dress_code?.show_palette !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>
                      <div className={`flex flex-wrap gap-3 ${content.dress_code?.show_palette === false ? 'opacity-30 pointer-events-none' : ''}`}>
                          {(content.dress_code?.colors || []).map((color: string, idx: number) => (
                              <div key={idx} className="relative group w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-200">
                                  <input type="color" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 cursor-pointer border-none p-0 outline-none" value={color} onChange={e => {
                                      const newC = [...content.dress_code.colors]; newC[idx] = e.target.value; handleTextChange('dress_code', 'colors', newC);
                                  }} />
                                  <button onClick={() => {
                                      const newC = content.dress_code.colors.filter((_:any, i:number) => i !== idx); handleTextChange('dress_code', 'colors', newC);
                                  }} className="absolute top-1 right-1 bg-white text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                              </div>
                          ))}
                          <button onClick={() => {
                              const newC = [...(content.dress_code?.colors || []), "#000000"]; handleTextChange('dress_code', 'colors', newC);
                          }} className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">+</button>
                      </div>
                   </div>
                 </div>
              </div>

              {/* PRESENTES */}
              <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="font-serif text-[#722F37] text-lg">Presentes & IBAN</h4>
                    <button onClick={() => toggleVisibility('gifts')} className={`w-8 h-4 rounded-full relative transition-colors ${visibility['gifts'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${visibility['gifts'] !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                 </div>
                 <div className={`space-y-6 ${visibility['gifts'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.gifts?.title ?? ''} onChange={e => handleTextChange('gifts', 'title', e.target.value)} /></div>
                    <div><label className={labelClass}>Mensagem</label><textarea className={`${inputClass} resize-none`} rows={3} value={content.gifts?.text ?? ''} onChange={e => handleTextChange('gifts', 'text', e.target.value)} /></div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                          <label className={labelClass}>Revelar IBAN?</label>
                          <button onClick={() => handleTextChange('gifts', 'show_iban', !(content.gifts?.show_iban !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.gifts?.show_iban !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.gifts?.show_iban !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>
                      <div className={`grid grid-cols-1 gap-4 ${content.gifts?.show_iban === false ? 'hidden' : ''}`}>
                          <div><label className={labelClass}>Texto do Botão</label><input className={inputClass} value={content.gifts?.iban_button_text ?? ''} onChange={e => handleTextChange('gifts', 'iban_button_text', e.target.value)} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <div><label className={labelClass}>Titulares</label><input className={inputClass} value={content.gifts?.iban_holders_name ?? ''} onChange={e => handleTextChange('gifts', 'iban_holders_name', e.target.value)} /></div>
                             <div><label className={labelClass}>IBAN</label><input className={inputClass} value={content.gifts?.iban_value ?? ''} onChange={e => handleTextChange('gifts', 'iban_value', e.target.value)} /></div>
                          </div>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </AccordionItem>

        {/* 08. RSVP */}
        <AccordionItem 
            id="rsvp" title="08. Confirmação (RSVP)"
            isOpen={openSection === 'rsvp'} isVisible={visibility['rsvp'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'rsvp' ? null : 'rsvp')}
            onToggleVisibility={() => toggleVisibility('rsvp')}
        >
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className={labelClass}>Título Secundário</label><input className={inputClass} value={content.rsvp?.title_please ?? ''} onChange={e => handleTextChange('rsvp', 'title_please', e.target.value)} /></div>
              <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.rsvp?.title_confirm ?? ''} onChange={e => handleTextChange('rsvp', 'title_confirm', e.target.value)} /></div>
              <div><label className={labelClass}>Data Limite (Texto)</label><input className={inputClass} value={content.rsvp?.text_limit_date_fixed ?? ''} onChange={e => handleTextChange('rsvp', 'text_limit_date_fixed', e.target.value)} /></div>
           </div>
        </AccordionItem>

        {/* 09. FOOTER */}
        <AccordionItem 
            id="footer" title="09. Rodapé & Contactos"
            isOpen={openSection === 'footer'} isVisible={visibility['footer'] !== false}
            onToggleOpen={() => setOpenSection(openSection === 'footer' ? null : 'footer')}
            onToggleVisibility={() => toggleVisibility('footer')}
        >
           <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <label className={labelClass}>Mostrar Contactos?</label>
                <button onClick={() => handleTextChange('footer', 'show_contacts', !(content.footer?.show_contacts !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.footer?.show_contacts !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.footer?.show_contacts !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`grid grid-cols-2 gap-6 ${content.footer?.show_contacts === false ? 'hidden' : ''}`}>
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
                    <div><label className={labelClass}>Título Secundário</label><input className={inputClass} value={content.footer?.title_main ?? ''} onChange={e => handleTextChange('footer', 'title_main', e.target.value)} /></div>
                    <div><label className={labelClass}>Título Principal</label><input className={inputClass} value={content.footer?.title_celebrate ?? ''} onChange={e => handleTextChange('footer', 'title_celebrate', e.target.value)} /></div>
                    <div><label className={labelClass}>Localização Inferior</label><input className={inputClass} value={content.footer?.location_text ?? ''} onChange={e => handleTextChange('footer', 'location_text', e.target.value)} /></div>
                 </div>
                 <div className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-200 group">
                    {content.footer?.footer_image_url ? (
                      <>
                        <img src={content.footer.footer_image_url} className="w-full h-full object-cover" />
                        <button onClick={() => handleTextChange('footer', 'footer_image_url', '')} className="absolute top-2 right-2 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">✕</button>
                      </>
                    ) : <div className="h-full flex items-center justify-center text-gray-300 text-[10px] uppercase font-bold tracking-widest">Sem Foto</div>}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold transition-all">
                        <input type="file" className="hidden" onChange={e => handleUpload(e, 'footer', 'footer_image_url')} /> {uploading === 'footer' ? '...' : 'Alterar Foto'}
                    </label>
                 </div>
              </div>
           </div>
        </AccordionItem>

      </div>
    </div>
  );
}