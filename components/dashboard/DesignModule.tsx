"use client";

interface DesignModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
  canEdit: boolean;
  dict: {
    templates: { title: string; subtitle: string; applyBtn: string };
    identity: { title: string; subtitle: string; person1Label: string; person2Label: string; dateLabel: string; person1Placeholder: string; person2Placeholder: string };
  };
}

const AVAILABLE_TEMPLATES = [
  { id: 'luxury-01', name: 'Classic Luxury', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: 'minimal-01', name: 'Modern Minimal', preview: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
  { id: 'collage-01', name: 'Editorial Collage', preview: '/collage-01/envelope-closed.png' },
];

export default function DesignModule({ formData, setFormData, handleSaveDesign, saving, canEdit, dict }: DesignModuleProps) {
  
  if (!formData) return null;

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
                disabled={!canEdit}
                className="w-full bg-transparent border-none text-brand font-bold focus:ring-0 p-0 text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.event_date ? formData.event_date.split('T')[0] : ''}
                onChange={e => setFormData({...formData, event_date: e.target.value})}
              />
           </div>
        </div>
      </section>

    </div>
  );
}