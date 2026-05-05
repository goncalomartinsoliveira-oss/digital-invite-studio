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
  const [uploading, setUploading] = useState<string | null>(null);

  const dbContent = formData?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

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

  const SectionHeader = ({ id, title, description }: { id: string, title: string, description: string }) => (
    <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
      <div>
        <h3 className="font-serif text-3xl text-[#722F37]">{title}</h3>
        <p className="text-gray-500 font-medium text-sm mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${visibility[id] !== false ? 'text-[#722F37]' : 'text-gray-400'}`}>
           {visibility[id] !== false ? 'Ativa' : 'Oculta'}
        </span>
        <button onClick={() => toggleVisibility(id)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${visibility[id] !== false ? 'bg-[#722F37]' : 'bg-gray-300'}`}>
          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${visibility[id] !== false ? 'left-8' : 'left-1 shadow-sm'}`}></div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-40 text-left animate-in fade-in duration-700">

      {/* 01. CAPA (HERO) */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.hero === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="hero" title="Capa (Hero)" description="O impacto inicial do convite." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200 self-start">
            <label className="text-[11px] font-bold uppercase text-gray-500 block mb-3 tracking-widest">Frase Superior</label>
            <input className="w-full bg-white border border-gray-100 rounded-xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#722F37] shadow-sm" value={content.hero?.text_above_names ?? ''} onChange={e => handleTextChange('hero', 'text_above_names', e.target.value)} placeholder="Ex: THE WEDDING OF" />
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-inner group">
            {content.hero?.main_image_url ? (
              <>
                <img src={content.hero.main_image_url} className="w-full h-full object-cover" />
                <button onClick={() => handleTextChange('hero', 'main_image_url', '')} className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 z-10">✕</button>
              </>
            ) : <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">Sem foto de capa</div>}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[12px] font-bold transition-all backdrop-blur-sm">
              {uploading === 'hero' ? 'A carregar...' : 'Alterar Foto'}
              <input type="file" className="hidden" onChange={e => handleUpload(e, 'hero', 'main_image_url')} />
            </label>
          </div>
        </div>
      </section>

      {/* 02. CONTADOR REGRESSIVO */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.countdown === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="countdown" title="Contador Regressivo" description="Título do cronómetro." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título do Contador</label>
           <input className="w-full bg-white border border-gray-100 p-4 rounded-xl text-gray-900 font-bold shadow-sm" value={content.countdown?.title ?? ''} onChange={e => handleTextChange('countdown', 'title', e.target.value)} placeholder='Ex: O dia do "Sim" aproxima-se...' />
        </div>
      </section>

      {/* 03. HISTÓRIA */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.story === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="story" title="A Nossa História" description="Relate os vossos momentos e personalize a foto." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título 1 (Curto)</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.story?.title_our ?? ''} onChange={e => handleTextChange('story', 'title_our', e.target.value)} placeholder="Ex: A Nossa" />
          </div>
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título 2 (Grande)</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.story?.title_history ?? ''} onChange={e => handleTextChange('story', 'title_history', e.target.value)} placeholder="Ex: História" />
          </div>
          <div className="flex flex-col items-center relative group">
            <div className="relative w-24 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-[#FDFBF7] shadow-lg">
              {content.story?.story_image_url ? <img src={content.story.story_image_url} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-300">FOTO</div>}
              <label className="absolute inset-0 bg-[#722F37]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold transition-all">
                <input type="file" className="hidden" onChange={e => handleUpload(e, 'story', 'story_image_url')} /> {uploading === 'story' ? '...' : 'Subir'}
              </label>
            </div>
            {content.story?.story_image_url && (
              <button onClick={() => handleTextChange('story', 'story_image_url', '')} className="absolute top-0 right-10 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(idx => (
            <div key={idx} className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-[#722F37] uppercase tracking-widest mb-3 block">Parágrafo {idx + 1}</label>
              <textarea className="w-full bg-white border border-gray-100 rounded-xl p-4 text-gray-700 text-sm shadow-sm leading-relaxed" rows={6} value={content.story?.paragraphs?.[idx] ?? ''} 
                onChange={e => {
                  const newP = [...(content.story?.paragraphs || ["", "", ""])];
                  newP[idx] = e.target.value;
                  handleTextChange('story', 'paragraphs', newP);
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 04. GALERIA */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.gallery === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="gallery" title="Galeria Editorial" description="Personalize os títulos e selecione até 5 fotografias." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título Menor (Caligrafia)</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.gallery?.title_our ?? ''} onChange={e => handleTextChange('gallery', 'title_our', e.target.value)} placeholder="Ex: A Nossa" />
          </div>
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título Principal</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.gallery?.title_gallery ?? ''} onChange={e => handleTextChange('gallery', 'title_gallery', e.target.value)} placeholder="Ex: Galeria" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[0,1,2,3,4].map(idx => (
            <div key={idx} className="relative aspect-[3/4] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden group shadow-inner">
              {content.gallery?.images_urls?.[idx] ? (
                <>
                  <img src={content.gallery.images_urls[idx]} className="w-full h-full object-cover" />
                  <button onClick={(e) => {
                    e.preventDefault();
                    const newUrls = [...(content.gallery?.images_urls || ["", "", "", "", ""])];
                    newUrls[idx] = '';
                    handleTextChange('gallery', 'images_urls', newUrls);
                  }} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">✕</button>
                </>
              ) : <div className="h-full flex flex-col items-center justify-center text-gray-300"><span className="text-2xl font-light">+</span></div>}
              <label className="absolute inset-0 bg-[#722F37]/90 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white transition-all z-10">
                <span className="text-[10px] font-bold uppercase">{uploading === `gallery-${idx}` ? '...' : 'Adicionar'}</span>
                <input type="file" className="hidden" onChange={e => handleUpload(e, 'gallery', 'images_urls', idx)} />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* 05. CRONOGRAMA */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.program === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="program" title="Cronograma" description="Horários e nomes dos eventos do dia." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título Menor (Caligrafia)</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.program?.title_our ?? ''} onChange={e => handleTextChange('program', 'title_our', e.target.value)} placeholder="Ex: O Nosso" />
          </div>
          <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Título Principal</label>
            <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-gray-900 font-bold shadow-sm" value={content.program?.title_program ?? ''} onChange={e => handleTextChange('program', 'title_program', e.target.value)} placeholder="Ex: Programa" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Eventos</span>
           <button onClick={() => {
               const newEvs = [...(content.program?.events || []), { time: "00:00", title: "Novo Evento" }];
               handleTextChange('program', 'events', newEvs);
             }} className="bg-[#722F37] text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm hover:scale-105 transition-all">
               + Adicionar Evento
           </button>
        </div>
        
        <div className={`space-y-4 max-w-3xl ${visibility.program === false ? 'pointer-events-none' : ''}`}>
          {(content.program?.events || []).map((ev: any, idx: number) => (
            <div key={idx} className="flex gap-4 bg-[#F8F9FA] p-4 rounded-2xl border border-gray-200 items-center shadow-sm">
              <input className="w-24 bg-white border border-gray-200 px-4 py-3 rounded-xl font-bold text-[#722F37] text-center" value={ev.time} onChange={e => {
                const newEvs = [...content.program.events]; newEvs[idx].time = e.target.value; handleTextChange('program', 'events', newEvs);
              }} />
              <input className="flex-grow bg-white border border-gray-200 px-5 py-3 rounded-xl font-bold text-gray-800" value={ev.title} onChange={e => {
                const newEvs = [...content.program.events]; newEvs[idx].title = e.target.value; handleTextChange('program', 'events', newEvs);
              }} />
              <button onClick={() => {
                const newEvs = content.program.events.filter((_: any, i: number) => i !== idx); handleTextChange('program', 'events', newEvs);
              }} className="text-red-400 hover:text-red-600 font-bold px-3">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* 06. TÍTULO DOS LOCAIS */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.event_header === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="event_header" title="Locais (Título Principal)" description="Personalize o título da secção dos locais." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Título (ex: O Nosso Casamento)</label>
            <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm" value={content.event?.title_main ?? ''} onChange={e => handleTextChange('event', 'title_main', e.target.value)} placeholder="Ex: O Nosso Casamento"/>
        </div>
      </section>

      {/* 07. CABEÇALHO DOS DETALHES */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.details_header === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="details_header" title="Cabeçalho dos Detalhes" description="Altere o título geral da área de informações." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Título Menor (Caligrafia)</label>
                <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm" value={content.details?.title_the ?? ''} onChange={e => handleTextChange('details', 'title_the', e.target.value)} placeholder="Ex: Os"/>
            </div>
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Título Principal</label>
                <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm" value={content.details?.title_details ?? ''} onChange={e => handleTextChange('details', 'title_details', e.target.value)} placeholder="Ex: Detalhes"/>
            </div>
        </div>
      </section>

      {/* 08. INFORMAÇÕES ÚTEIS */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.useful_info === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="useful_info" title="Informações Úteis" description="Detalhes de logística e estacionamento." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Sub-Título Logística</label>
            <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm mb-6" value={content.details?.parking_title ?? ''} onChange={e => handleTextChange('details', 'parking_title', e.target.value)} placeholder="Ex: Localização e Estacionamento"/>
            
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Texto Informativo</label>
            <textarea className="w-full bg-white border border-gray-200 rounded-xl p-5 text-gray-800 text-sm leading-relaxed" rows={4} value={content.details?.parking_text ?? ''} onChange={e => handleTextChange('details', 'parking_text', e.target.value)} />
        </div>
      </section>

      {/* 09. ALOJAMENTO */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.accommodation === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="accommodation" title="Alojamento" description="Sugestões de estadia e links." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Título Alojamento</label>
                <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm" value={content.details?.accommodation_title ?? ''} onChange={e => handleTextChange('details', 'accommodation_title', e.target.value)} placeholder="Ex: Onde Ficar"/>
                <label className="text-[10px] font-bold uppercase text-gray-500 mt-6 mb-3 block">Texto Alojamento</label>
                <textarea className="w-full bg-white border border-gray-200 rounded-xl p-5 text-gray-800 text-sm leading-relaxed" rows={3} value={content.details?.accommodation_text ?? ''} onChange={e => handleTextChange('details', 'accommodation_text', e.target.value)} />
            </div>
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Botões de Hotéis / Links</label>
                    <button onClick={() => {
                        const newBtns = [...(content.details?.accommodation_buttons || []), { text: "Ver Hotel", url: "" }];
                        handleTextChange('details', 'accommodation_buttons', newBtns);
                    }} className="text-[#722F37] font-bold text-[10px] uppercase bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">+ Novo</button>
                </div>
                <div className="space-y-3">
                    {(content.details?.accommodation_buttons || []).map((btn: any, i: number) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input className="w-1/3 bg-white border border-gray-100 p-2 rounded-lg text-xs font-bold shadow-sm" value={btn.text} onChange={e => {
                                const newB = [...content.details.accommodation_buttons]; newB[i].text = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                            }} placeholder="Nome" />
                            <input className="flex-1 bg-white border border-gray-100 p-2 rounded-lg text-xs shadow-sm" value={btn.url} onChange={e => {
                                const newB = [...content.details.accommodation_buttons]; newB[i].url = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                            }} placeholder="Link" />
                            <button onClick={() => {
                                const newB = content.details.accommodation_buttons.filter((_:any, idx:number) => idx !== i);
                                handleTextChange('details', 'accommodation_buttons', newB);
                            }} className="text-red-400 font-bold px-2">✕</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* 10. DRESS CODE */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.dress_code === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="dress_code" title="Dress Code & Paleta" description="Traje e cores sugeridas." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200 mb-8">
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Título da Secção</label>
            <input className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-bold shadow-sm" value={content.dress_code?.title ?? ''} onChange={e => handleTextChange('dress_code', 'title', e.target.value)} placeholder="Ex: Dress Code" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Mensagem aos Convidados</label>
                <textarea className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-gray-800 text-sm leading-relaxed" rows={5} value={content.dress_code?.text?.[0] ?? ''} 
                    onChange={e => handleTextChange('dress_code', 'text', [e.target.value])}
                />
            </div>
            <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Apresentar Cores?</label>
                    <button onClick={() => handleTextChange('dress_code', 'show_palette', !(content.dress_code?.show_palette !== false))} className={`w-8 h-4 rounded-full relative transition-colors ${content.dress_code?.show_palette !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${content.dress_code?.show_palette !== false ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                </div>
                <div className={`grid grid-cols-3 gap-3 ${content.dress_code?.show_palette === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    {(content.dress_code?.colors || []).map((color: string, idx: number) => (
                        <div key={idx} className="relative group">
                            <input type="color" className="w-full h-12 rounded-xl cursor-pointer border-none shadow-sm" value={color} onChange={e => {
                                const newC = [...content.dress_code.colors]; newC[idx] = e.target.value; handleTextChange('dress_code', 'colors', newC);
                            }} />
                            <button onClick={() => {
                                const newC = content.dress_code.colors.filter((_:any, i:number) => i !== idx); handleTextChange('dress_code', 'colors', newC);
                            }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    ))}
                    <button onClick={() => {
                        const newC = [...(content.dress_code?.colors || []), "#000000"]; handleTextChange('dress_code', 'colors', newC);
                    }} className="border-2 border-dashed border-gray-300 rounded-xl h-12 flex items-center justify-center text-gray-400 hover:text-[#722F37]">+</button>
                </div>
            </div>
        </div>
      </section>

      {/* 11. PRESENTES */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.gifts === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="gifts" title="Presentes & IBAN" description="Agradecimento e dados bancários." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200 mb-8">
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Título (ex: Presentes / Lua de Mel)</label>
            <input className="w-full bg-white border border-gray-100 rounded-xl p-4 text-gray-900 font-bold mb-6 shadow-sm" value={content.gifts?.title ?? ''} onChange={e => handleTextChange('gifts', 'title', e.target.value)} placeholder="Ex: Presentes" />
            <label className="text-[10px] font-bold uppercase text-gray-500 mb-3 block">Mensagem</label>
            <textarea className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-gray-800 text-sm shadow-sm" rows={3} value={content.gifts?.text ?? ''} onChange={e => handleTextChange('gifts', 'text', e.target.value)} />
        </div>
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <label className="text-[11px] font-bold uppercase text-gray-700 tracking-widest">Ativar Botão de IBAN?</label>
                <button onClick={() => handleTextChange('gifts', 'show_iban', !(content.gifts?.show_iban !== false))} className={`w-12 h-6 rounded-full relative transition-colors ${content.gifts?.show_iban !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${content.gifts?.show_iban !== false ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>
            <div className={`space-y-6 ${content.gifts?.show_iban === false ? 'hidden' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Titular da Conta</label>
                        <input className="w-full bg-transparent border-none text-gray-900 font-bold p-0 focus:ring-0" value={content.gifts?.iban_holders_name ?? ''} onChange={e => handleTextChange('gifts', 'iban_holders_name', e.target.value)} placeholder="Nomes" />
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">IBAN</label>
                        <input className="w-full bg-transparent border-none text-[#722F37] font-mono font-bold p-0 focus:ring-0" value={content.gifts?.iban_value ?? ''} onChange={e => handleTextChange('gifts', 'iban_value', e.target.value)} placeholder="PT50..." />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 12. CONFIRMAÇÕES (RSVP) */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.rsvp === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="rsvp" title="Confirmação de Presença" description="Títulos do formulário RSVP." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Título 1 (Caligrafia)</label>
              <input className="w-full bg-white border border-gray-100 p-3 rounded-xl font-bold shadow-sm" value={content.rsvp?.title_please ?? ''} onChange={e => handleTextChange('rsvp', 'title_please', e.target.value)} placeholder="Por favor" />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Título 2 (Principal)</label>
              <input className="w-full bg-white border border-gray-100 p-3 rounded-xl font-bold shadow-sm" value={content.rsvp?.title_confirm ?? ''} onChange={e => handleTextChange('rsvp', 'title_confirm', e.target.value)} placeholder="Confirmar Presença" />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-[#722F37] uppercase block mb-2">Data Limite (Texto)</label>
              <input className="w-full bg-white border border-gray-100 p-3 rounded-xl font-bold shadow-sm" value={content.rsvp?.text_limit_date_fixed ?? ''} onChange={e => handleTextChange('rsvp', 'text_limit_date_fixed', e.target.value)} placeholder="Ex: 15 | 10 | 2026" />
           </div>
        </div>
      </section>

      {/* 13. RODAPÉ DE DESPEDIDA & CONTACTOS */}
      <section className={`bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all ${visibility.footer === false ? 'opacity-40 grayscale' : ''}`}>
        <SectionHeader id="footer" title="Rodapé & Contactos" description="Despedida final e números de telefone." />
        <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-gray-200 mb-8">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-serif text-2xl text-gray-800">Mostrar Contactos no Site?</h4>
              <button onClick={() => handleTextChange('footer', 'show_contacts', !(content.footer?.show_contacts !== false))} className={`w-12 h-6 rounded-full relative transition-colors ${content.footer?.show_contacts !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${content.footer?.show_contacts !== false ? 'left-7' : 'left-1'}`}></div>
              </button>
           </div>
           <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${content.footer?.show_contacts === false ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                 <label className="text-[10px] font-bold text-gray-500 uppercase block border-b border-gray-50 pb-2">Contacto 1</label>
                 <input className="w-full bg-transparent border-none font-bold text-sm p-0 focus:ring-0" placeholder="Nome" value={content.footer?.contact_1_name ?? ''} onChange={e => handleTextChange('footer', 'contact_1_name', e.target.value)} />
                 <input className="w-full bg-transparent border-none text-sm p-0 focus:ring-0" placeholder="Telefone" value={content.footer?.contact_1_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_1_phone', e.target.value)} />
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                 <label className="text-[10px] font-bold text-gray-500 uppercase block border-b border-gray-50 pb-2">Contacto 2</label>
                 <input className="w-full bg-transparent border-none font-bold text-sm p-0 focus:ring-0" placeholder="Nome" value={content.footer?.contact_2_name ?? ''} onChange={e => handleTextChange('footer', 'contact_2_name', e.target.value)} />
                 <input className="w-full bg-transparent border-none text-sm p-0 focus:ring-0" placeholder="Telefone" value={content.footer?.contact_2_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_2_phone', e.target.value)} />
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Frase Suave</label>
              <input className="w-full bg-white border border-gray-100 rounded-xl p-4 font-bold" value={content.footer?.title_main ?? ''} onChange={e => handleTextChange('footer', 'title_main', e.target.value)} />
            </div>
            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Frase de Impacto</label>
              <input className="w-full bg-white border border-gray-100 rounded-xl p-4 font-bold text-[#722F37]" value={content.footer?.title_celebrate ?? ''} onChange={e => handleTextChange('footer', 'title_celebrate', e.target.value)} />
            </div>
            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Localização Inferior</label>
              <input className="w-full bg-white border border-gray-100 rounded-xl p-4 font-bold text-sm uppercase tracking-widest" value={content.footer?.location_text ?? ''} onChange={e => handleTextChange('footer', 'location_text', e.target.value)} />
            </div>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-lg group">
            {content.footer?.footer_image_url ? (
               <>
                 <img src={content.footer.footer_image_url} className="w-full h-full object-cover" />
                 <button onClick={() => handleTextChange('footer', 'footer_image_url', '')} className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10">✕</button>
               </>
            ) : <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest italic">Imagem de Fecho</div>}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white font-bold transition-all">
              {uploading === 'footer' ? '...' : 'Trocar Foto'}
              <input type="file" className="hidden" onChange={e => handleUpload(e, 'footer', 'footer_image_url')} />
            </label>
          </div>
        </div>
      </section>

      <div className="fixed bottom-24 md:bottom-10 right-6 z-[200]">
         <button onClick={handleSaveDesign} disabled={saving} className="bg-[#722F37] text-white h-16 px-12 rounded-full font-bold shadow-[0_10px_40px_rgba(114,47,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border-4 border-white/20">
            {saving ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Publicar Conteúdo"}
         </button>
      </div>

    </div>
  );
}