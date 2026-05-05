"use client";

interface DesignModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>; // Propriedade adicionada para corrigir o erro
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

const AVAILABLE_TEMPLATES = [
  { id: 'luxury-01', name: 'Classic Luxury', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: 'minimal-01', name: 'Modern Minimal', preview: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
];

export default function DesignModule({ formData, setFormData, handleSaveDesign, saving }: DesignModuleProps) {
  return (
    <div className="space-y-8 pb-32 text-left animate-in fade-in duration-500">
      
      {/* 01. TEMPLATES */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6">Escolha o seu Estilo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_TEMPLATES.map(t => (
            <div key={t.id} onClick={() => setFormData({...formData, template_id: t.id})} 
              className={`cursor-pointer p-2 rounded-2xl border-2 transition-all ${formData.template_id === t.id ? 'border-[#722F37] bg-[#722F37]/5' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={t.preview} className="w-full h-28 object-cover rounded-xl mb-3 shadow-sm" alt={t.name} />
              <p className="text-[11px] font-bold text-center uppercase tracking-widest text-gray-800">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 02. IDENTIDADE & DATA */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <h3 className="font-serif text-2xl text-[#722F37] mb-6 border-b border-gray-50 pb-4">Identidade do Casamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Noivo</label>
              <input className="w-full bg-transparent border-none text-gray-900 font-bold focus:ring-0 p-0 text-xl" value={formData.groom_name || ''} onChange={e => setFormData({...formData, groom_name: e.target.value})} />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Noiva</label>
              <input className="w-full bg-transparent border-none text-gray-900 font-bold focus:ring-0 p-0 text-xl" value={formData.bride_name || ''} onChange={e => setFormData({...formData, bride_name: e.target.value})} />
           </div>
           <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
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

      {/* BOTÃO SALVAR */}
      <div className="fixed bottom-24 md:bottom-10 right-6 z-[200]">
         <button onClick={handleSaveDesign} disabled={saving} className="bg-[#722F37] text-white h-16 px-10 rounded-full font-bold shadow-[0_10px_30px_rgba(114,47,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border-2 border-white/20">
            {saving ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "Publicar Estilo"}
         </button>
      </div>

    </div>
  );
}