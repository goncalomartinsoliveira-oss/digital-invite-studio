"use client";

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
  { id: 'collage-01', name: 'Editorial Collage', preview: '/collage-01/envelope-closed.png' },
];

export default function DesignModule({ formData, setFormData, handleSaveDesign, saving }: DesignModuleProps) {
  return (
    <div className="space-y-8 pb-12 text-left animate-in fade-in duration-500">
      
      {/* 01. TEMPLATES DO CONVITE */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="font-serif text-2xl text-[#722F37]">Templates do Convite</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Selecione o design base para o seu convite</p>
          </div>

          <button 
            onClick={handleSaveDesign} 
            disabled={saving} 
            className="bg-[#722F37] text-white h-12 px-8 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            )}
            <span className="text-xs uppercase tracking-wider">Aplicar Template</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_TEMPLATES.map(t => (
            <div 
              key={t.id} 
              onClick={() => setFormData({...formData, template_id: t.id})} 
              className={`group cursor-pointer p-2 rounded-2xl border-2 transition-all duration-300 ${
                formData.template_id === t.id 
                ? 'border-[#722F37] bg-[#722F37]/5 shadow-inner' 
                : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
              }`}
            >
              <div className="relative overflow-hidden rounded-xl mb-3 shadow-sm aspect-[4/3]">
                <img 
                  src={t.preview} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${formData.template_id === t.id ? 'scale-110' : 'group-hover:scale-105'}`} 
                  alt={t.name} 
                />
                {formData.template_id === t.id && (
                  <div className="absolute inset-0 bg-[#722F37]/20 flex items-center justify-center">
                    <div className="bg-white text-[#722F37] p-2 rounded-full shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-[11px] font-bold text-center uppercase tracking-widest ${formData.template_id === t.id ? 'text-[#722F37]' : 'text-gray-500'}`}>
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 02. IDENTIDADE & DATA */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="mb-8">
          <h3 className="font-serif text-2xl text-[#722F37]">Identidade do Casamento</h3>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Defina os nomes dos protagonistas e a data do evento</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200 focus-within:border-[#722F37]/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Pessoa 1</label>
              <input 
                className="w-full bg-transparent border-none text-gray-900 font-bold focus:ring-0 p-0 text-xl placeholder:text-gray-300" 
                placeholder="Ex: Gonçalo" 
                value={formData.groom_name || ''} 
                onChange={e => setFormData({...formData, groom_name: e.target.value})} 
              />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200 focus-within:border-[#722F37]/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Pessoa 2</label>
              <input 
                className="w-full bg-transparent border-none text-gray-900 font-bold focus:ring-0 p-0 text-xl placeholder:text-gray-300" 
                placeholder="Ex: Marcia" 
                value={formData.bride_name || ''} 
                onChange={e => setFormData({...formData, bride_name: e.target.value})} 
              />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200 focus-within:border-[#722F37]/30 transition-colors">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Data do Grande Dia</label>
              <input 
                type="date"
                className="w-full bg-transparent border-none text-[#722F37] font-bold focus:ring-0 p-0 text-xl cursor-pointer" 
                value={formData.event_date ? formData.event_date.split('T')[0] : ''} 
                onChange={e => setFormData({...formData, event_date: e.target.value})} 
              />
           </div>
        </div>
      </section>

    </div>
  );
}