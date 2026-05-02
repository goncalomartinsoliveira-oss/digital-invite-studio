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
];

export default function DesignModule({ formData, setFormData, handleImageUpload, handleSaveDesign, saving }: DesignModuleProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500 text-left">
      <div className="space-y-8">
        <section className="bg-white p-8 border shadow-sm space-y-6">
          <h3 className="font-serif text-xl border-b pb-4 uppercase tracking-widest">01. Template</h3>
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setFormData({...formData, template_id: t.id})} 
                className={`cursor-pointer p-1 border-2 transition-all ${formData.template_id === t.id ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                <img src={t.preview} className="w-full h-24 object-cover" />
                <p className="text-[9px] uppercase text-center mt-2 tracking-widest font-bold">{t.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 border shadow-sm space-y-6">
          <h3 className="font-serif text-xl border-b pb-4 uppercase tracking-widest">02. Nomes do Casal</h3>
          <div className="grid gap-6">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Noivo</label>
              <input className="w-full border-b py-2 outline-none focus:border-black transition-colors" value={formData.groom_name} onChange={e => setFormData({...formData, groom_name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Noiva</label>
              <input className="w-full border-b py-2 outline-none focus:border-black transition-colors" value={formData.bride_name} onChange={e => setFormData({...formData, bride_name: e.target.value})} />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section className="bg-white p-8 border shadow-sm space-y-6">
          <h3 className="font-serif text-xl border-b pb-4 uppercase tracking-widest">03. Foto de Capa</h3>
          <div className="aspect-video bg-neutral-100 relative group overflow-hidden border">
            {formData.main_image_url ? (
              <img src={formData.main_image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] uppercase opacity-30">Sem Foto Selecionada</div>
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[9px] uppercase font-bold transition-all">
              Alterar Foto de Capa
              <input type="file" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </section>
        <button onClick={handleSaveDesign} disabled={saving} className="w-full bg-black text-white py-5 text-[10px] uppercase tracking-[0.4em] font-bold shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
          {saving ? "A Sincronizar..." : "Publicar Alterações"}
        </button>
      </div>
    </div>
  );
}