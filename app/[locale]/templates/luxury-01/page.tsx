"use client";
import { motion, Variants } from "framer-motion";
import { Pinyon_Script, Cormorant_Garamond } from "next/font/google";

const pinyon = Pinyon_Script({ 
  weight: "400", 
  subsets: ["latin"],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({ 
  weight: ["300", "400"], 
  subsets: ["latin"],
  display: 'swap',
});

const DEFAULT_BG_IMAGE = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop";

export default function LuxuryTemplate({ data }: { data: any }) {
  
  const groomName = data?.groom_name || "Noivo";
  const brideName = data?.bride_name || "Noiva";
  const eventDate = data?.event_date || new Date().toISOString();
  
  const backgroundImageUrl = (data?.main_image_url && data.main_image_url.trim() !== "") 
    ? data.main_image_url 
    : DEFAULT_BG_IMAGE;

  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.6, delayChildren: 0.3 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="w-full bg-[#FDFBF7]">
      
      <motion.section 
        className="relative w-full h-[100vh] min-h-[600px] overflow-hidden flex flex-col items-center justify-center bg-[#F9F8F6] text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* --- Fundo com Efeito Cinematográfico (como na maquete) --- */}
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImageUrl} 
            alt="Paisagem do Casamento"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradiente: Mais escuro no topo e na base para o texto ler bem, claro no meio */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60"></div>
          <div className="absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.3)]"></div>
        </div>

        {/* --- Conteúdo Principal Otimizado para Mobile --- */}
        <div className="relative z-20 w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center">
          
          {/* 1. The Wedding Of */}
          <motion.p 
            variants={itemVariants}
            className={`${cormorant.className} text-[#F0E9E3] text-[10px] sm:text-[12px] uppercase tracking-[0.4em] mb-6 drop-shadow-md`}
          >
            THE WEDDING OF
          </motion.p>

          {/* 2. Nomes MASSIVOS em "Escada" */}
          <motion.div 
            variants={itemVariants}
            className={`${pinyon.className} text-white flex flex-col items-center w-full relative my-2`}
          >
            {/* Nome da Noiva */}
            {/* Usamos leading-[0.6] para cortar o espaço vazio acima e abaixo das letras, permitindo que se juntem */}
            <div className="text-[130px] sm:text-[160px] md:text-[220px] lg:text-[260px] leading-[0.6] transform -translate-x-6 sm:-translate-x-12 z-20 drop-shadow-lg pr-4">
              {brideName.toLowerCase()}
            </div>
            
            {/* Símbolo & - Em Script novamente, colocado estrategicamente no meio */}
            <div className="text-[70px] sm:text-[90px] md:text-[120px] leading-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-90 z-10 drop-shadow-md">
              &
            </div>

            {/* Nome do Noivo */}
            <div className="text-[130px] sm:text-[160px] md:text-[220px] lg:text-[260px] leading-[0.6] transform translate-x-10 sm:translate-x-16 z-20 drop-shadow-lg pl-4 mt-2">
              {groomName.toLowerCase()}
            </div>
          </motion.div>

          {/* 3. Data */}
          <motion.time 
            dateTime={eventDate}
            variants={itemVariants}
            className={`${cormorant.className} text-[#F0E9E3]/90 text-[10px] sm:text-[12px] uppercase tracking-[0.5em] mt-10 drop-shadow-md block`}
          >
            {formattedDate}
          </motion.time>

        </div>
      </motion.section>

    </div>
  );
}