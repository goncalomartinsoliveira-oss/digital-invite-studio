"use client";

interface EventModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

export default function EventModule({ formData, setFormData, handleSaveDesign, saving }: EventModuleProps) {
  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in duration-700 text-left">
      <header className="border-b border-[#AD9D8D]/20 pb-6">
        <h2 className="font-serif text-3xl text-[#332E2B]">O Nosso Evento</h2>
        <p className="font-sans text-xs uppercase tracking-widest text-[#AD9D8D] mt-2">
          Configure os detalhes que os convidados vão ver
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-10">
        {/* SECÇÃO: DATA E LOCAL */}
        <div className="space-y-6">
          <h3 className="font-serif text-xl italic text-[#72393F]">Onde e Quando</h3>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              Data e Hora do Evento
            </label>
            <input 
              type="datetime-local"
              className="w-full border-b border-[#AD9D8D]/30 bg-transparent py-2 outline-none focus:border-[#72393F] transition-colors text-[#332E2B]"
              // O slice garante que o formato do banco de dados (ISO) cabe no input local
              value={formData?.event_date ? formData.event_date.slice(0, 16) : ""}
              onChange={(e) => setFormData({...formData, event_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              Nome do Local (Ex: Quinta do Lago)
            </label>
            <input 
              type="text"
              placeholder="Nome do Local"
              className="w-full border-b border-[#AD9D8D]/30 bg-transparent py-2 outline-none focus:border-[#72393F] text-[#332E2B]"
              value={formData?.location_name || ""}
              onChange={(e) => setFormData({...formData, location_name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              Link Google Maps
            </label>
            <input 
              type="text"
              placeholder="URL do Mapa"
              className="w-full border-b border-[#AD9D8D]/30 bg-transparent py-2 outline-none focus:border-[#72393F] text-[#332E2B]"
              value={formData?.location_url || ""}
              onChange={(e) => setFormData({...formData, location_url: e.target.value})}
            />
          </div>
        </div>

        {/* SECÇÃO: MENSAGEM E IBAN */}
        <div className="space-y-6">
          <h3 className="font-serif text-xl italic text-[#72393F]">Informações Extra</h3>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              Título de Boas-vindas
            </label>
            <input 
              type="text"
              className="w-full border-b border-[#AD9D8D]/30 bg-transparent py-2 outline-none focus:border-[#72393F] text-[#332E2B]"
              value={formData?.welcome_title || ""}
              onChange={(e) => setFormData({...formData, welcome_title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              IBAN para Presentes
            </label>
            <input 
              type="text"
              placeholder="PT50 ...."
              className="w-full border-b border-[#AD9D8D]/30 bg-transparent py-2 outline-none focus:border-[#72393F] text-[#332E2B]"
              value={formData?.iban || ""}
              onChange={(e) => setFormData({...formData, iban: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-tighter opacity-50 text-[#332E2B]">
              Mensagem para os Convidados
            </label>
            <textarea 
              rows={4}
              className="w-full border border-[#AD9D8D]/30 bg-[#F9F8F6] p-3 text-sm outline-none focus:border-[#72393F] text-[#332E2B]"
              value={formData?.welcome_message || ""}
              onChange={(e) => setFormData({...formData, welcome_message: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="pt-10">
        <button 
          onClick={handleSaveDesign}
          disabled={saving}
          className="bg-[#72393F] text-[#F0E9E3] px-12 py-4 text-[10px] uppercase tracking-[0.3em] font-bold shadow-xl hover:bg-[#332E2B] transition-all disabled:opacity-50"
        >
          {saving ? "A Sincronizar..." : "Publicar Detalhes"}
        </button>
      </div>
    </div>
  );
}