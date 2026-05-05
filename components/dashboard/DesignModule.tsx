"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DesignModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

const AVAILABLE_TEMPLATES = [
  { id: 'luxury-01', name: 'Classic Luxury', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: 'minimal-01', name: 'Modern Minimal', preview: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
];

const INVITATION_SECTIONS = [
  { key: 'hero', label: 'Capa (Hero)' },
  { key: 'countdown', label: 'Contagem Decrescente' },
  { key: 'story', label: 'A Nossa História' },
  { key: 'gallery', label: 'Galeria de Fotos' },
  { key: 'program', label: 'Programa' },
  { key: 'event', label: 'O Evento (Cerimónia e Receção)' },
  { key: 'details', label: 'Detalhes & Alojamento' },
  { key: 'dress_code', label: 'Dress Code' },
  { key: 'gifts', label: 'Presentes (Lua de Mel)' },
  { key: 'rsvp', label: 'Confirmação de Presença' },
  { key: 'footer', label: 'Rodapé (Despedida)' }
];

export default function DesignModule({ formData, setFormData, handleImageUpload, handleSaveDesign, saving }: DesignModuleProps) {
  
  const [uploadingFooter, setUploadingFooter] = useState(false);

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormData({ ...formData, main_image_url: null });
  };

  const handleFooterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFooter(true);
    const fileName = `footer-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('invites').upload(fileName, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      handleContentChange('footer', 'footer_image_url', publicUrl);
    }
    setUploadingFooter(false);
  };

  const handleRemoveFooterImage = (e: React.MouseEvent) => {
    e.preventDefault();
    handleContentChange('footer', 'footer_image_url', "");
  };

  const handleVisibilityToggle = (sectionKey: string) => {
    const dbContent = formData.content || {};
    const currentVisibility = dbContent.sections_visibility || {};
    setFormData({
      ...formData,
      content: { ...dbContent, sections_visibility: { ...currentVisibility, [sectionKey]: currentVisibility[sectionKey] === false } }
    });
  };

  const handleContentChange = (section: string, field: string, value: string) => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {}; 
    const currentSectionContent = currentTexts[section] || {};
    setFormData({
      ...formData,
      content: { ...dbContent, content: { ...currentTexts, [section]: { ...currentSectionContent, [field]: value } } }
    });
  };

  const footerUrl = formData.content?.content?.footer?.footer_image_url;

  return (
    <div className="space-y-8 pb-32 text-left">
      
      {/* 01. TEMPLATES */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6 tracking-tight">01. Estilo Visual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_TEMPLATES.map(t => (
            <div key={t.id} onClick={() => setFormData({...formData, template_id: t.id})} 
              className={`cursor-pointer p-2 rounded-2xl border-2 transition-all ${formData.template_id === t.id ? 'border-[#722F37]' : 'border-transparent opacity-40 hover:opacity-100'}`}>
              <img src={t.preview} className="w-full h-24 object-cover rounded-xl mb-2" alt={t.name} />
              <p className="text-[10px] font-bold text-center uppercase tracking-widest">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 02. NOMES */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6 tracking-tight">02. Nomes do Casal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Noivo</label>
              <input className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-xl" value={formData.groom_name || ''} onChange={e => setFormData({...formData, groom_name: e.target.value})} />
           </div>
           <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Noiva</label>
              <input className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-xl" value={formData.bride_name || ''} onChange={e => setFormData({...formData, bride_name: e.target.value})} />
           </div>
        </div>
      </section>

      {/* 03. ESTRUTURA (TOGGLES) */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6 tracking-tight">03. Estrutura do Convite</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {INVITATION_SECTIONS.map((section) => {
            const isVisible = formData.content?.sections_visibility?.[section.key] !== false;
            return (
              <button key={section.key} onClick={() => handleVisibilityToggle(section.key)}
                className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${isVisible ? 'border-[#722F37]/20 bg-[#FDFBF7]' : 'bg-white opacity-40 grayscale'}`}>
                <span className="text-[11px] font-bold uppercase tracking-tight text-gray-700">{section.label}</span>
                <div className={`w-3 h-3 rounded-full ${isVisible ? 'bg-[#722F37] shadow-[0_0_8px_#722F37]' : 'bg-gray-200'}`}></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 04. IMAGENS DE DESTAQUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-serif text-xl text-[#722F37]">Foto de Capa</h3>
               <label className="bg-[#722F37] text-white px-4 py-2 rounded-full text-[10px] font-bold cursor-pointer hover:shadow-lg transition-all">
                  Alterar <input type="file" className="hidden" onChange={handleImageUpload} />
               </label>
            </div>
            <div className="aspect-video rounded-3xl overflow-hidden bg-gray-50 border-4 border-[#FDFBF7]">
               {formData.main_image_url ? <img src={formData.main_image_url} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-300">Padrão</div>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-serif text-xl text-[#722F37]">Foto de Rodapé</h3>
               <label className="bg-[#722F37] text-white px-4 py-2 rounded-full text-[10px] font-bold cursor-pointer hover:shadow-lg transition-all">
                  {uploadingFooter ? "..." : "Alterar"} <input type="file" className="hidden" onChange={handleFooterImageUpload} />
               </label>
            </div>
            <div className="aspect-video rounded-3xl overflow-hidden bg-gray-50 border-4 border-[#FDFBF7]">
               {footerUrl ? <img src={footerUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-300">Padrão</div>}
            </div>
          </div>
      </div>

      {/* 05. TEXTOS PRINCIPAIS */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6 tracking-tight">04. Textos de Destaque</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[9px] font-bold uppercase text-gray-400">Prefixo Capa (Ex: The Wedding Of)</label>
                <input className="w-full bg-transparent border-none text-gray-700 font-medium focus:ring-0 p-0 mt-1" value={formData.content?.content?.hero?.text_above_names || ''} onChange={e => handleContentChange('hero', 'text_above_names', e.target.value)} />
              </div>
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[9px] font-bold uppercase text-gray-400">Título Contador</label>
                <input className="w-full bg-transparent border-none text-gray-700 font-medium focus:ring-0 p-0 mt-1" value={formData.content?.content?.countdown?.title || ''} onChange={e => handleContentChange('countdown', 'title', e.target.value)} />
              </div>
           </div>
           <div className="space-y-4">
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[9px] font-bold uppercase text-gray-400">História: Título 1 (Ex: A Nossa)</label>
                <input className="w-full bg-transparent border-none text-gray-700 font-medium focus:ring-0 p-0 mt-1" value={formData.content?.content?.story?.title_our || ''} onChange={e => handleContentChange('story', 'title_our', e.target.value)} />
              </div>
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[9px] font-bold uppercase text-gray-400">História: Título 2 (Ex: História)</label>
                <input className="w-full bg-transparent border-none text-gray-700 font-medium focus:ring-0 p-0 mt-1" value={formData.content?.content?.story?.title_history || ''} onChange={e => handleContentChange('story', 'title_history', e.target.value)} />
              </div>
           </div>
        </div>
      </section>

      {/* BOTÃO SALVAR GLOBAL */}
      <div className="fixed bottom-24 md:bottom-10 right-6 z-[200]">
         <button onClick={handleSaveDesign} disabled={saving} className="bg-[#722F37] text-white h-16 px-10 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border-4 border-white/20">
            {saving ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Publicar no Convite"}
         </button>
      </div>

    </div>
  );
}