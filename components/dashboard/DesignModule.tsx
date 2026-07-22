"use client";
import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface DesignModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
  canEdit: boolean;
  dict: {
    templates: { title: string; subtitle: string; applyBtn: string };
    identity: { title: string; subtitle: string; person1Label: string; person2Label: string; dateLabel: string; person1Placeholder: string; person2Placeholder: string; dateLockedNote: string };
    theme: { title: string; subtitle: string; customLabel: string };
  };
}

const AVAILABLE_TEMPLATES = [
  { id: 'luxury-01', name: 'Classic Luxury', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: 'minimal-01', name: 'Modern Minimal', preview: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
  { id: 'collage-01', name: 'Editorial Collage', preview: '/collage-01/envelope-closed.png' },
  { id: 'classic-01', name: 'Clássico', preview: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400', supportsTheme: true },
  { id: 'noir-01', name: 'Editorial Noir', preview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&sat=-100', supportsTheme: true },
  { id: 'arch-01', name: 'Romântico', preview: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400', supportsTheme: true },
];

// Cor de destaque: só os modelos com `supportsTheme` usam um único token de
// cor em todos os detalhes (títulos, linhas, botões) — por isso só nesses
// faz sentido dar a escolher. Os restantes têm cores fixas espalhadas pelo
// desenho e trocar uma única variável não teria efeito visível em todos.
const ACCENT_PRESETS = [
  { hex: "#B8945A", name: "Dourado" },
  { hex: "#630100", name: "Bordô" },
  { hex: "#6B7B5E", name: "Verde Sálvia" },
  { hex: "#6B85A3", name: "Azul Poeira" },
  { hex: "#C9A0A0", name: "Rosa Antigo" },
  { hex: "#BF6E4E", name: "Terracota" },
  { hex: "#5C6B78", name: "Cinza-Azulado" },
  { hex: "#1A1A1A", name: "Preto" },
];

export default function DesignModule({ formData, setFormData, handleSaveDesign, saving, canEdit, dict }: DesignModuleProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Autosave (mesmo padrão dos outros módulos) — este era o único módulo que só
  // gravava ao clicar "Aplicar Template", o que confundia quem editava aqui.
  useEffect(() => {
    if (!isMounted || !canEdit) return;
    const timer = setTimeout(() => { handleSaveDesign(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  if (!formData) return null;

  const dateLocked = !!formData.date_locked_at;
  const dbContent = formData.content || {};
  const activeTemplate = AVAILABLE_TEMPLATES.find(t => t.id === formData.template_id);
  const accent = dbContent.theme?.accent || "";

  const setAccent = (hex: string) => {
    if (!canEdit) return;
    setFormData({ ...formData, content: { ...dbContent, theme: { ...dbContent.theme, accent: hex } } });
  };

  return (
    <div className="space-y-8 pb-12 text-left animate-in fade-in duration-500 font-montserrat">

      {/* 01. TEMPLATES DO CONVITE */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="font-serif text-3xl text-brand">{dict.templates.title}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">{dict.templates.subtitle}</p>
          </div>

          <button
            onClick={handleSaveDesign}
            disabled={saving || !canEdit}
            className={`h-12 px-8 rounded-full font-bold shadow-lg transition-all flex items-center gap-3
              ${!canEdit ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-brand text-gold-soft hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100'}`}
          >
            {saving ? (
              <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${!canEdit ? 'border-gray-400' : 'border-gold-soft'}`}></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            )}
            <span className="text-[11px] uppercase tracking-widest">{dict.templates.applyBtn}</span>
          </button>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${!canEdit ? 'pointer-events-none opacity-80' : ''}`}>
          {AVAILABLE_TEMPLATES.map(t => (
            <div 
              key={t.id} 
              onClick={() => { if(canEdit) setFormData({...formData, template_id: t.id}) }} 
              className={`group cursor-pointer p-3 rounded-3xl border-2 transition-all duration-300 ${
                formData.template_id === t.id 
                ? 'border-brand bg-brand/5 shadow-inner' 
                : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
              }`}
            >
              <div className="relative overflow-hidden rounded-2xl mb-4 shadow-sm aspect-[4/3]">
                <img 
                  src={t.preview} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${formData.template_id === t.id ? 'scale-110' : 'group-hover:scale-105'}`} 
                  alt={t.name} 
                />
                {formData.template_id === t.id && (
                  <div className="absolute inset-0 bg-brand/20 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-cream text-brand p-3 rounded-full shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-[11px] font-bold text-center uppercase tracking-widest ${formData.template_id === t.id ? 'text-brand' : 'text-gray-400'}`}>
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 01b. COR DE DESTAQUE — só nos modelos que suportam personalização de cor */}
      {activeTemplate?.supportsTheme && (
        <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
          <div className="mb-8">
            <h3 className="font-serif text-3xl text-brand">{dict.theme.title}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">{dict.theme.subtitle}</p>
          </div>

          <div className={`flex flex-wrap items-center gap-4 ${!canEdit ? 'pointer-events-none opacity-80' : ''}`}>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.hex}
                type="button"
                title={p.name}
                onClick={() => setAccent(p.hex)}
                className={`w-12 h-12 rounded-full shadow-sm border-2 transition-all hover:scale-110 ${
                  accent.toLowerCase() === p.hex.toLowerCase() ? 'border-brand ring-2 ring-brand/30' : 'border-white ring-1 ring-gray-200'
                }`}
                style={{ background: p.hex }}
              />
            ))}

            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border-2 border-white ring-1 ring-gray-200 hover:scale-110 transition-all flex items-center justify-center bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]">
              <input
                type="color"
                value={accent || "#B8945A"}
                onChange={e => setAccent(e.target.value)}
                title={dict.theme.customLabel}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 cursor-pointer border-none p-0 outline-none opacity-0"
              />
            </div>
          </div>
        </section>
      )}

      {/* 02. IDENTIDADE & DATA */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="mb-8">
          <h3 className="font-serif text-3xl text-brand">{dict.identity.title}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">{dict.identity.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-cream p-6 rounded-3xl border border-gray-200 focus-within:border-brand/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{dict.identity.person1Label}</label>
              <input
                disabled={!canEdit}
                className="w-full bg-transparent border-none text-ink font-bold focus:ring-0 p-0 text-2xl placeholder:text-gray-300 placeholder:font-normal disabled:opacity-50"
                placeholder={dict.identity.person1Placeholder}
                value={formData.groom_name || ''}
                onChange={e => setFormData({...formData, groom_name: e.target.value})}
              />
           </div>
           <div className="bg-cream p-6 rounded-3xl border border-gray-200 focus-within:border-brand/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{dict.identity.person2Label}</label>
              <input
                disabled={!canEdit}
                className="w-full bg-transparent border-none text-ink font-bold focus:ring-0 p-0 text-2xl placeholder:text-gray-300 placeholder:font-normal disabled:opacity-50"
                placeholder={dict.identity.person2Placeholder}
                value={formData.bride_name || ''}
                onChange={e => setFormData({...formData, bride_name: e.target.value})}
              />
           </div>
           <div className="bg-cream p-6 rounded-3xl border border-gray-200 focus-within:border-brand/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{dict.identity.dateLabel}</label>
              <input
                type="date"
                disabled={!canEdit || dateLocked}
                className="w-full bg-transparent border-none text-brand font-bold focus:ring-0 p-0 text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.event_date ? formData.event_date.split('T')[0] : ''}
                onChange={e => setFormData({...formData, event_date: e.target.value})}
              />
              {dateLocked && (
                <p className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                  <Lock size={10} /> {dict.identity.dateLockedNote}
                </p>
              )}
           </div>
        </div>
      </section>

    </div>
  );
}