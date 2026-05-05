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

  const handleCardVisibility = (eventType: 'ceremony' | 'reception') => {
    const dbContent = formData.content || {};
    const currentTexts = dbContent.content || {};
    const currentEventSection = currentTexts.event || {};
    const specificEvent = currentEventSection[eventType] || {};
    
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
              active: !isCurrentlyActive
            }
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-32 text-left">
      
      {/* HEADER INFORMATIVO */}
      <div className="px-4">
        <h2 className="font-serif text-3xl text-[#722F37]">Locais & Horários</h2>
        <p className="text-gray-400 text-sm mt-1">Configure onde e quando a magia vai acontecer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- BLOCO: A CERIMÓNIA --- */}
        <section className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 transition-all duration-500 ${ceremony.active === false ? 'opacity-50 grayscale-[0.8]' : ''}`}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#722F37]/60">Parte I</span>
              <h3 className="font-serif text-2xl text-[#722F37] mt-1">A Cerimónia</h3>
            </div>
            
            {/* TOGGLE MODERNO */}
            <button 
              onClick={() => handleCardVisibility('ceremony')}
              className={`w-12 h-6 rounded-full relative transition-colors ${ceremony.active !== false ? 'bg-[#722F37]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${ceremony.active !== false ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Título</label>
                <input 
                  className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-lg disabled:cursor-not-allowed" 
                  value={ceremony.title || ""} 
                  onChange={(e) => handleEventChange('ceremony', 'title', e.target.value)}
                  placeholder="A Cerimónia"
                  disabled={ceremony.active === false}
                />
              </div>
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Hora</label>
                <input 
                  className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-lg disabled:cursor-not-allowed" 
                  value={ceremony.time || ""} 
                  onChange={(e) => handleEventChange('ceremony', 'time', e.target.value)}
                  placeholder="13:30"
                  disabled={ceremony.active === false}
                />
              </div>
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Local / Morada Curta</label>
              <input 
                className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 disabled:cursor-not-allowed" 
                value={ceremony.location || ""} 
                onChange={(e) => handleEventChange('ceremony', 'location', e.target.value)}
                placeholder="Igreja de São Martinho, Sintra"
                disabled={ceremony.active === false}
              />
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Link do Google Maps</label>
              <input 
                className="w-full bg-transparent border-none text-gray-500 text-xs focus:ring-0 p-0 mt-1 truncate disabled:cursor-not-allowed" 
                value={ceremony.google_maps_url || ""} 
                onChange={(e) => handleEventChange('ceremony', 'google_maps_url', e.target.value)}
                placeholder="https://goo.gl/maps/..."
                disabled={ceremony.active === false}
              />
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Descrição Breve</label>
              <textarea 
                className="w-full bg-transparent border-none text-gray-700 text-sm focus:ring-0 p-0 mt-1 resize-none disabled:cursor-not-allowed" 
                rows={3}
                value={ceremony.description || ""} 
                onChange={(e) => handleEventChange('ceremony', 'description', e.target.value)}
                placeholder="Testemunhem a nossa troca de votos..."
                disabled={ceremony.active === false}
              />
            </div>
          </div>
        </section>

        {/* --- BLOCO: A RECEÇÃO --- */}
        <section className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 transition-all duration-500 ${reception.active === false ? 'opacity-50 grayscale-[0.8]' : ''}`}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#722F37]/60">Parte II</span>
              <h3 className="font-serif text-2xl text-[#722F37] mt-1">A Receção</h3>
            </div>

            <button 
              onClick={() => handleCardVisibility('reception')}
              className={`w-12 h-6 rounded-full relative transition-colors ${reception.active !== false ? 'bg-[#722F37]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${reception.active !== false ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Título</label>
                <input 
                  className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-lg disabled:cursor-not-allowed" 
                  value={reception.title || ""} 
                  onChange={(e) => handleEventChange('reception', 'title', e.target.value)}
                  placeholder="A Receção"
                  disabled={reception.active === false}
                />
              </div>
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Hora</label>
                <input 
                  className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 text-lg disabled:cursor-not-allowed" 
                  value={reception.time || ""} 
                  onChange={(e) => handleEventChange('reception', 'time', e.target.value)}
                  placeholder="15:00"
                  disabled={reception.active === false}
                />
              </div>
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Local / Quinta</label>
              <input 
                className="w-full bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 disabled:cursor-not-allowed" 
                value={reception.location || ""} 
                onChange={(e) => handleEventChange('reception', 'location', e.target.value)}
                placeholder="Quinta do Vale, Sintra"
                disabled={reception.active === false}
              />
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Link do Google Maps</label>
              <input 
                className="w-full bg-transparent border-none text-gray-500 text-xs focus:ring-0 p-0 mt-1 truncate disabled:cursor-not-allowed" 
                value={reception.google_maps_url || ""} 
                onChange={(e) => handleEventChange('reception', 'google_maps_url', e.target.value)}
                placeholder="https://goo.gl/maps/..."
                disabled={reception.active === false}
              />
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Descrição Breve</label>
              <textarea 
                className="w-full bg-transparent border-none text-gray-700 text-sm focus:ring-0 p-0 mt-1 resize-none disabled:cursor-not-allowed" 
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

      {/* BOTÃO FLUTUANTE DE SALVAR (Desktop/Mobile) */}
      <div className="fixed bottom-24 md:bottom-10 right-6 z-[60]">
         <button 
            onClick={handleSaveDesign} 
            disabled={saving} 
            className="bg-[#722F37] text-white h-14 md:h-16 px-8 md:px-12 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border-4 border-white/20"
         >
            {saving ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Publicar Detalhes"
            )}
         </button>
      </div>

    </div>
  );
}