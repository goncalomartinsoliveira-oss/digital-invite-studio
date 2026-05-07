"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollageTemplate({ data }: { data: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Dados dinâmicos do esquema V2
  const bride = data?.bride_name || "Noiva";
  const groom = data?.groom_name || "Noivo";
  
  // Formatação da data: "24 de Maio de 2025"
  const eventDate = data?.event_date 
    ? new Date(data.event_date).toLocaleDateString('pt-PT', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }) 
    : "";

  const coverImage = 
    data?.content?.hero?.main_image_url || 
    data?.content?.content?.hero?.main_image_url || 
    data?.main_image_url || 
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800";

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] flex flex-col items-center p-4 pt-10 pb-40 overflow-x-hidden">
      
      {/* Importação da fonte Lavishly Yours diretamente do Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lavishly+Yours&display=swap');
        .font-lavishly {
          font-family: 'Lavishly Yours', cursive;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div 
            key="envelope-closed-state"
            exit={{ opacity: 0, scale: 0.95 }}
            className="cursor-pointer mt-20"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-72 h-auto">
              <img 
                src="/collage-01/envelope-closed.png" 
                alt="Envelope Fechado" 
                className="w-full h-auto object-contain" 
              />
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-lg relative">
            
            {/* 1. CONTAINER DO ENVELOPE ABERTO + FOTO + PAPEL */}
            <motion.div
              key="invite-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full z-20"
            >
              {/* O FORRO (FOTO) */}
              <div 
                className="absolute top-0 left-0 w-full h-full z-10"
                style={{
                  clipPath: "polygon(50% 18%, 90% 46%, 85% 65%, 15% 65%, 10% 46%)"
                }}
              >
                <img 
                  src={coverImage} 
                  alt="Forro" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* MOLDURA ENVELOPE ABERTO */}
              <img 
                src="/collage-01/envelope-open.png" 
                className="relative z-20 w-full h-auto block pointer-events-none drop-shadow-2xl" 
                alt="Envelope Aberto"
              />

              {/* O PAPEL RASGADO COM TEXTO EM LAVISHLY YOURS */}
              <div className="absolute -bottom-2 -right-4 w-64 h-auto z-40 transform rotate-6">
                <img 
                  src="/collage-01/torn-paper-note.png" 
                  alt="Nota em papel rasgado" 
                  className="w-full h-auto object-contain drop-shadow-xl"
                />
                
                {/* CAMADA DE TEXTO PERSONALIZADO */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  {/* Nomes dos Noivos */}
                  <p className="font-lavishly text-gray-800 text-3xl md:text-4xl leading-none">
                    {bride} & {groom}
                  </p>
                  
                  {/* Data do Evento */}
                  <p className="font-lavishly text-gray-700 text-xl md:text-2xl mt-1">
                    {eventDate}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 2. ENVELOPE FECHADO (DE FUNDO) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-[350px] md:w-[420px] h-auto z-30 self-start -mt-56 ml-0 sm:ml-2 pointer-events-none" 
            >
              <img 
                src="/collage-01/envelope-closed.png" 
                alt="Envelope Posterior" 
                className="w-full h-auto object-contain drop-shadow-lg transform -rotate-3"
              />
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}