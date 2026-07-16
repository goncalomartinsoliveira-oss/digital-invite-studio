"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from "@/components/site/BrandProvider";
import { resolveBrandById } from "@/lib/brands";
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Maximize, Minimize, Camera } from 'lucide-react';

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis de recuo para app/[locale]/live-wall/[slug]/page.tsx)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function LiveWallPage() {
  const { slug, locale } = useParams();
  const brand = useBrand();
  const [eventBrand, setEventBrand] = useState<any>(null);
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const currentLocale = (locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[currentLocale]?.LiveWallPage || dictionaries.pt.LiveWallPage;

  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const urlUpload = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/moments/${slug}` : '';

  useEffect(() => {
    fetchInitialData();
    // Atualiza a lista a cada 60 segundos
    const interval = setInterval(fetchItems, 60000);
    
    // Listener para o F11 / Fullscreen nativo do browser
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  async function fetchInitialData() {
    const { data: inv } = await supabase.from('invitations').select('id, brand_id').eq('slug', slug).single();
    if (inv) {
      await fetchItems(inv.id);
      setEventBrand(await resolveBrandById(supabase, (inv as any)?.brand_id));
    }
  }

  async function fetchItems(invId?: string) {
    // Se não passarmos ID, tenta ir buscar à primeira imagem (para a atualização de 60s)
    let currentInvId = invId;
    if (!currentInvId) {
       const { data: inv } = await supabase.from('invitations').select('id, brand_id').eq('slug', slug).single();
       if (inv) currentInvId = inv.id;
    }
    if (!currentInvId) return;

    const { data: stData } = await supabase.storage.from('fotos_evento').list(currentInvId, {
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (stData) {
      const urls = stData
        .filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('private_') && !f.name.startsWith('gb_'))
        .map(f => {
          const { data: { publicUrl } } = supabase.storage.from('fotos_evento').getPublicUrl(`${currentInvId}/${f.name}`);
          const isVideo = f.name.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
          return { name: f.name, url: publicUrl, isVideo: !!isVideo };
        });
      
      if (urls.length > 0) {
        setItems(urls);
        setLoading(false);
      }
    }
  }

  // Rotação do Slide (30s Vídeo / 8s Foto)
  useEffect(() => {
    if (items.length === 0) return;
    const currentItem = items[currentIndex];
    let timeout: NodeJS.Timeout;

    if (currentItem?.isVideo) {
      timeout = setTimeout(nextSlide, 30000); // 30 segundos
    } else {
      timeout = setTimeout(nextSlide, 8000);  // 8 segundos
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, items]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-white font-montserrat">
      <Loader2 className="animate-spin mb-4 text-gold-soft" size={40} />
      <p className="font-bold uppercase tracking-widest text-[10px] opacity-50">{dict.loadingText}</p>
    </div>
  );

  const currentMedia = items[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden font-montserrat">
      
      {/* BACKGROUND BLUR (Cores imersivas baseadas na imagem atual) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentMedia?.name}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
        >
          {currentMedia?.isVideo ? (
            <video src={currentMedia.url} className="w-full h-full object-cover blur-[100px] scale-125" muted autoPlay playsInline loop />
          ) : (
            <img src={currentMedia?.url} className="w-full h-full object-cover blur-[100px] scale-125" alt="blur" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL (SLIDESHOW) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMedia?.name}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-10 p-12 flex items-center justify-center pb-32"
        >
          {currentMedia?.isVideo ? (
            <video 
              src={currentMedia.url} 
              autoPlay 
              muted 
              playsInline
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              onEnded={nextSlide}
            />
          ) : (
            <img 
              src={currentMedia?.url} 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              alt="Live Moment"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* BOTÃO FULLSCREEN (CANTO SUPERIOR DIREITO) */}
      <button 
        onClick={toggleFullScreen}
        className="absolute top-10 right-10 z-[110] p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 transition-all text-white/50 hover:text-white"
        title={dict.fullScreenTitle}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* CARTÃO QR CODE (CANTO INFERIOR ESQUERDO) */}
      <div className="absolute bottom-10 left-10 z-[110] bg-[#1a1a1a]/80 backdrop-blur-xl p-4 pr-10 rounded-[2rem] border border-white/10 flex items-center gap-6 shadow-2xl">
        <div className="bg-white p-2.5 rounded-2xl shadow-inner">
          <QRCodeSVG value={urlUpload} size={90} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-white font-black text-lg uppercase tracking-widest italic flex items-center gap-2">
            <Camera size={20} className="text-gold-soft"/> {dict.qrCodeTitle}
          </h2>
          <p className="text-white/50 text-[10px] uppercase mt-1 tracking-[0.3em] font-bold">{dict.qrCodeSubtitle}</p>
        </div>
      </div>

      {/* ASSINATURA DIS (CANTO INFERIOR DIREITO) */}
      <div className="absolute bottom-10 right-10 z-[110] flex flex-col items-end opacity-70 hover:opacity-100 transition-opacity duration-500">
        <span className="text-[8px] text-white/50 font-bold uppercase tracking-[0.4em] mb-2">{dict.poweredBy}</span>
        <img src={eventBrand?.logo ?? brand.logo} alt={eventBrand?.name ?? brand.logoAlt} className="h-6 w-auto invert" />
      </div>

    </div>
  );
}