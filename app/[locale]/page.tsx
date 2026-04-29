"use client";
import { motion } from "framer-motion";

export default function LuxuryTemplate() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="max-w-4xl w-full text-center space-y-12"
      >
        {/* Header Tradicional */}
        <div className="space-y-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.5em] opacity-50">
            Save the Date
          </p>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-none">
            Dmitry <br /> 
            <span className="italic font-light">&</span> Maria
          </h1>
        </div>

        {/* Divisória Elegante */}
        <div className="flex items-center justify-center space-x-4 opacity-30">
          <div className="h-px w-12 bg-current"></div>
          <div className="text-xs uppercase tracking-widest font-sans">MMSXV</div>
          <div className="h-px w-12 bg-current"></div>
        </div>

        {/* Detalhes */}
        <div className="space-y-2">
          <p className="font-serif italic text-2xl md:text-3xl opacity-80">
            Três de Outubro, Dois Mil e Vinte e Seis
          </p>
          <p className="font-sans text-xs uppercase tracking-[0.3em] opacity-50">
            Lisboa, Portugal
          </p>
        </div>

        {/* Call to Action */}
        <button className="mt-8 px-8 py-3 border border-black/10 rounded-full font-sans text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-500">
          Confirmar Presença
        </button>
      </motion.div>
    </main>
  );
}