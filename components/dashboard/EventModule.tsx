"use client";

interface EventModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
}

export default function EventModule({ formData, setFormData, handleSaveDesign, saving }: EventModuleProps) {
  
  const contentData = formData?.content?.content || {};
  const eventContent = contentData.event || {};
  
  const ceremony = eventContent.ceremony || {};
  const reception = eventContent.reception || {};

  const handleEventChange = (eventType: 'ceremony' | 'reception', field: string, value: string) => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {};
    const currentEventSection = currentTexts.event || {};
    const specificEvent = currentEventSection[eventType] || {};

    setFormData({
      ...formData,
      content: {
        ...dbContent,
        content: {
          ...currentTexts,
          event: {
            ...currentEventSection,
            [eventType]: {
              ...specificEvent,
              [field]: value
            }
          }
        }
      }
    });
  };

  // Função dedicada para ligar/desligar um cartão específico
  const handleCardVisibility = (eventType: 'ceremony' | 'reception') => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {};
    const currentEventSection = currentTexts.event || {};
    const specificEvent = currentEventSection[eventType] || {};
    
    // Se não existir o campo 'active', assumimos que está true por defeito
    const isCurrentlyActive = specificEvent.active !== false;

    setFormData({
      ...formData,
      content: {
        ...dbContent,
        content: {
          ...currentTexts,
          event: {
            ...currentEventSection,
            [eventType]: {
              ...specificEvent,
              active: !isCurrentlyActive // Inverte o estado
            }
          }
        }
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500 text-left pb-24">
      
      {/* --- COLUNA ESQUERDA: A CERIMÓNIA --- */}
      <div className="space-y-8">
        <section className={`bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm transition-opacity ${ceremony.active === false ? 'opacity-50 grayscale' : ''}`}>
          <div className="border-b border-[#3e3226]/10 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">1. A Cerimónia</h3>
              <p className="text-[11px] opacity-60 mt-1">Onde irão trocar as alianças.</p>
            </div>
            
            {/* TOGGLE DA CERIMÓNIA */}
            <button 
              onClick={() => handleCardVisibility('ceremony')}
              className={`w-10 h-5 rounded-full relative transition-colors ${ceremony.active !== false ? 'bg-[#72393F]' : 'bg-neutral-200'}`}
              title={ceremony.active !== false ? "Ocultar Cartão" : "Mostrar Cartão"}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${ceremony.active !== false ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>
          
          <div className="space-y-6 pointer-events-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Título</label>
                <input 
                  className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                  value={ceremony.title || ""} 
                  onChange={(e) => handleEventChange('ceremony', 'title', e.target.value)}
                  placeholder="A Cerimónia"
                  disabled={ceremony.active === false}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Hora</label>
                <input 
                  className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                  value={ceremony.time || ""} 
                  onChange={(e) => handleEventChange('ceremony', 'time', e.target.value)}
                  placeholder="13:30"
                  disabled={ceremony.active === false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Local / Morada Curta</label>
              <input 
                className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                value={ceremony.location || ""} 
                onChange={(e) => handleEventChange('ceremony', 'location', e.target.value)}
                placeholder="Igreja de São Martinho, Sintra"
                disabled={ceremony.active === false}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Link do Google Maps</label>
              <input 
                className="w-full border-b py-2 text-[12px] opacity-80 outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                value={ceremony.google_maps_url || ""} 
                onChange={(e) => handleEventChange('ceremony', 'google_maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
                disabled={ceremony.active === false}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Descrição Breve</label>
              <textarea 
                className="w-full border p-3 text-[12px] leading-relaxed outline-none focus:border-[#72393F] bg-[#FDFBF7] rounded-sm" 
                rows={3}
                value={ceremony.description || ""} 
                onChange={(e) => handleEventChange('ceremony', 'description', e.target.value)}
                placeholder="Testemunhem a nossa troca de votos..."
                disabled={ceremony.active === false}
              />
            </div>
          </div>
        </section>
      </div>

      {/* --- COLUNA DIREITA: A RECEÇÃO --- */}
      <div className="space-y-8">
        <section className={`bg-white p-8 border border-[#3e3226]/10 shadow-sm space-y-6 rounded-sm transition-opacity ${reception.active === false ? 'opacity-50 grayscale' : ''}`}>
          <div className="border-b border-[#3e3226]/10 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl uppercase tracking-widest text-[#3e3226]">2. A Receção / Festa</h3>
              <p className="text-[11px] opacity-60 mt-1">Onde irão celebrar com os convidados.</p>
            </div>

            {/* TOGGLE DA RECEÇÃO */}
            <button 
              onClick={() => handleCardVisibility('reception')}
              className={`w-10 h-5 rounded-full relative transition-colors ${reception.active !== false ? 'bg-[#72393F]' : 'bg-neutral-200'}`}
              title={reception.active !== false ? "Ocultar Cartão" : "Mostrar Cartão"}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${reception.active !== false ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>
          
          <div className="space-y-6 pointer-events-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Título</label>
                <input 
                  className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                  value={reception.title || ""} 
                  onChange={(e) => handleEventChange('reception', 'title', e.target.value)}
                  placeholder="A Receção"
                  disabled={reception.active === false}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Hora</label>
                <input 
                  className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                  value={reception.time || ""} 
                  onChange={(e) => handleEventChange('reception', 'time', e.target.value)}
                  placeholder="15:00"
                  disabled={reception.active === false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Local / Morada Curta</label>
              <input 
                className="w-full border-b py-2 text-[13px] outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                value={reception.location || ""} 
                onChange={(e) => handleEventChange('reception', 'location', e.target.value)}
                placeholder="Quinta do Vale, Sintra"
                disabled={reception.active === false}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Link do Google Maps</label>
              <input 
                className="w-full border-b py-2 text-[12px] opacity-80 outline-none focus:border-[#72393F] transition-colors bg-transparent" 
                value={reception.google_maps_url || ""} 
                onChange={(e) => handleEventChange('reception', 'google_maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
                disabled={reception.active === false}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Descrição Breve</label>
              <textarea 
                className="w-full border p-3 text-[12px] leading-relaxed outline-none focus:border-[#72393F] bg-[#FDFBF7] rounded-sm" 
                rows={3}
                value={reception.description || ""} 
                onChange={(e) => handleEventChange('reception', 'description', e.target.value)}
                placeholder="Juntem-se a nós para um final de tarde..."
                disabled={reception.active === false}
              />
            </div>
          </div>
        </section>
      </div>

      {/* BOTÃO SALVAR GLOBAL FIXO NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#3e3226]/10 p-4 z-40 flex justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button 
            onClick={handleSaveDesign} 
            disabled={saving} 
            className="w-full max-w-lg bg-black text-[#FDFBF7] py-4 text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl hover:bg-[#3e3226] active:scale-[0.98] transition-all disabled:opacity-50 rounded-sm"
        >
          {saving ? "A Sincronizar..." : "Guardar Detalhes do Evento"}
        </button>
      </div>

    </div>
  );
}