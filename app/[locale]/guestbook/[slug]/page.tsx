"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from "@/components/site/BrandProvider";
import { resolveBrandById } from "@/lib/brands";
import EventExpiredScreen from "@/components/site/EventExpiredScreen";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Loader2, MessageSquare, Mic, Video, Send, StopCircle,
  ShieldCheck, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. IMPORTAR OS DICIONÁRIOS (4 Níveis de recuo para app/[locale]/guestbook/[slug]/page.tsx)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

const premiumGradient = "bg-gradient-to-tr from-brand via-[#8B0000] to-[#330100]";

export default function IsolatedGuestbookPage() {
  const { slug, locale } = useParams();
  const brand = useBrand();
  const [eventBrand, setEventBrand] = useState<any>(null);
  const currentLocale = (locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[currentLocale]?.IsolatedGuestbookPage || dictionaries.pt.IsolatedGuestbookPage;

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [modalType, setModalType] = useState<'text' | 'voice' | 'video' | null>(null);
  const [autor, setAutor] = useState("");
  const [textoMensagem, setTextoMensagem] = useState("");
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // 1. CARREGAR DADOS DO CONVITE
  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  async function fetchInitialData() {
    try {
      const { data: inv, error } = await supabase.from('invitations').select('id, bride_name, groom_name, profile_image_url, brand_id, expires_at, unlocked_modules').eq('slug', slug).single();
      if (error) throw error;
      setInvitation(inv);
      setEventBrand(await resolveBrandById(supabase, (inv as any)?.brand_id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 2. ATIVAR CÂMARA/MICROFONE LOGO QUE O MODAL ABRE
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    const initMedia = async () => {
      if (modalType === 'video' || modalType === 'voice') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: modalType === 'video' ? { facingMode: "user" } : false
          });
          currentStream = stream;
          setActiveStream(stream);
        } catch (err) {
          console.error("Erro no media:", err);
          alert(dict.alerts.mediaPermission);
          setModalType(null);
        }
      } else {
        setActiveStream(null);
      }
    };

    initMedia();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modalType]);

  // Garante que o stream liga ao vídeo assim que a tag <video> é renderizada
  useEffect(() => {
    if (modalType === 'video' && videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
    }
  }, [modalType, activeStream]);


  // 3. INICIAR A GRAVAÇÃO (Corrigido o TS Error)
  const startRecording = () => {
    if (!activeStream) return;

    mediaRecorder.current = new MediaRecorder(activeStream);
    audioChunks.current = [];
    
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: modalType === 'video' ? 'video/mp4' : 'audio/webm' });
      await uploadGuestbookMedia(blob, modalType!);
    };
    
    mediaRecorder.current.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => { 
        if (prev >= 29) { stopRecording(); return 30; } 
        return prev + 1; 
      });
    }, 1000);
  };

  const stopRecording = () => { 
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop(); 
    }
    setIsRecording(false); 
    clearInterval(timerRef.current); 
  };

  const uploadGuestbookMedia = async (blob: Blob, type: string) => {
    setUploading(true);
    const fileName = `private_gb_${type}_${Date.now()}.${type === 'video' ? 'mp4' : 'webm'}`;
    const path = `${invitation.id}/${fileName}`;
    
    const { error } = await supabase.storage.from('fotos_evento').upload(path, blob);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('fotos_evento').getPublicUrl(path);
      await supabase.from('guestbook').insert([{ invitation_id: invitation.id, tipo: type, conteudo: publicUrl, autor: autor || 'Anónimo' }]);
      alert(dict.alerts.mediaSuccess);
      setModalType(null);
      setAutor("");
    } else {
      alert(dict.alerts.mediaError);
    }
    setUploading(false);
  };

  const enviarTexto = async () => {
    if (!textoMensagem || !invitation) return;
    setUploading(true);
    await supabase.from('guestbook').insert([{ invitation_id: invitation.id, tipo: 'texto', conteudo: textoMensagem, autor: autor || 'Anónimo' }]);
    setUploading(false);
    setModalType(null);
    setTextoMensagem("");
    setAutor("");
    alert(dict.alerts.textSuccess);
  };

  if (loading) return <div className="fixed inset-0 z-[9999] bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-brand" size={32} /></div>;

  if (invitation?.expires_at && new Date(invitation.expires_at) < new Date()) {
    const expiredDict = dictionaries[currentLocale]?.EventExpired || dictionaries.pt.EventExpired;
    return <EventExpiredScreen title={expiredDict.title} desc={expiredDict.desc} footerText={expiredDict.footerText} brandName={eventBrand?.name ?? brand.name} />;
  }

  if (!invitation?.unlocked_modules?.includes('guestbook')) {
    const unavailableDict = dictionaries[currentLocale]?.ModuleUnavailable || dictionaries.pt.ModuleUnavailable;
    const footerText = (dictionaries[currentLocale]?.EventExpired || dictionaries.pt.EventExpired).footerText;
    return <EventExpiredScreen title={unavailableDict.title} desc={unavailableDict.desc} footerText={footerText} brandName={eventBrand?.name ?? brand.name} />;
  }

  return (
    // 🔒 RESOLUÇÃO NAVBAR/FOOTER: z-[9999] garante que fica por cima de qualquer componente global do Next.js
    <div className="fixed inset-0 z-[9999] bg-cream font-montserrat flex flex-col items-center justify-start overflow-y-auto w-full h-full">
      
      <AnimatePresence mode="wait">
        {!modalType ? (
          <motion.div 
            key="main-menu"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md flex flex-col items-center pt-16 px-6 pb-20 relative min-h-[100dvh]"
          >
            <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-gold-soft/30 to-transparent pointer-events-none -z-10" />
            
            <div className="bg-white p-2 rounded-full shadow-2xl mb-6 border border-gold-soft/50">
              <img src={invitation?.profile_image_url || "/placeholder.png"} className="w-24 h-24 rounded-full object-cover" alt="Noivos" />
            </div>
            
            <h1 className="text-3xl font-serif text-brand italic mb-2 text-center">{invitation?.bride_name} & {invitation?.groom_name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8 text-center">{dict.subtitle}</p>

            <div className="bg-brand text-gold-soft p-4 rounded-3xl mb-8 shadow-xl flex flex-col items-center gap-2 border border-white/10 w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{dict.privateBadge}</span>
              </div>
              <p className="text-[9px] text-center opacity-80 leading-tight uppercase font-medium">
                {dict.privateText1}<br/>{dict.privateText2}
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full flex-1">
              <button onClick={() => setModalType('text')} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition-transform w-full">
                <div className="text-left">
                  <span className="block text-sm font-black uppercase tracking-widest text-brand mb-1">{dict.options.textTitle}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{dict.options.textSub}</span>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><MessageSquare size={24}/></div>
              </button>

              <button onClick={() => setModalType('voice')} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition-transform w-full">
                <div className="text-left">
                  <span className="block text-sm font-black uppercase tracking-widest text-brand mb-1">{dict.options.voiceTitle}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{dict.options.voiceSub}</span>
                </div>
                <div className="bg-brand/5 p-4 rounded-2xl text-brand"><Mic size={24}/></div>
              </button>

              <button onClick={() => setModalType('video')} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition-transform w-full">
                <div className="text-left">
                  <span className="block text-sm font-black uppercase tracking-widest text-brand mb-1">{dict.options.videoTitle}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{dict.options.videoSub}</span>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl text-purple-500"><Video size={24}/></div>
              </button>
            </div>

            <footer className="mt-16 pb-8 flex flex-col items-center w-full">
              <Link href={`/${locale}`} className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-all">
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-gray-400">{dict.footerText}</span>
                <img src={eventBrand?.logo ?? brand.logo} alt={eventBrand?.name ?? brand.logoAlt} className="h-6 w-auto grayscale group-hover:grayscale-0 transition-all" />
              </Link>
            </footer>
          </motion.div>

        ) : (
          
          <motion.div 
            key="action-modal"
            initial={{ y: '10%' }} animate={{ y: 0 }} exit={{ y: '10%' }} 
            className="w-full max-w-md flex flex-col min-h-[100dvh] pt-8 px-6 pb-12"
          >
            <div className="flex items-center justify-between mb-8 w-full">
              <button 
                className="p-3 bg-white shadow-sm rounded-full text-gray-400 hover:text-brand transition-colors" 
                onClick={() => { if(isRecording) stopRecording(); setModalType(null); }}
              >
                <ChevronLeft size={24}/>
              </button>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">
                {modalType === 'text' ? dict.modalTitles.text : modalType === 'voice' ? dict.modalTitles.voice : dict.modalTitles.video}
              </span>
              <div className="w-12"></div>
            </div>

            <div className="flex-1 w-full space-y-6 flex flex-col">
              <input 
                type="text" 
                placeholder={dict.form.namePlaceholder} 
                className="w-full bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm outline-none font-bold text-sm text-center focus:border-gold-soft transition-colors" 
                value={autor} 
                onChange={e => setAutor(e.target.value)} 
              />
              
              {modalType === 'text' && (
                <textarea 
                  placeholder={dict.form.textPlaceholder} 
                  className="w-full flex-1 min-h-[250px] bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm outline-none font-medium text-sm resize-none focus:border-gold-soft transition-colors" 
                  value={textoMensagem} 
                  onChange={e => setTextoMensagem(e.target.value)} 
                />
              )}

              {(modalType === 'voice' || modalType === 'video') && (
                <div className="flex-1 flex flex-col items-center justify-start gap-8 w-full mt-4">
                  {modalType === 'video' && (
                    <div className="w-full max-w-sm aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-white">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover transform -scale-x-100" 
                      />
                      {isRecording && <div className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>}
                    </div>
                  )}
                  
                  {modalType === 'voice' && (
                    <div className="w-full max-w-sm aspect-square bg-white rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-6 border border-gray-100">
                       <Mic size={64} className={isRecording ? 'text-brand animate-pulse' : 'text-gray-200'} />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         {isRecording ? dict.form.recording : dict.form.ready}
                       </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-6 mt-4">
                    <div className={`text-5xl font-black font-serif italic ${isRecording ? 'text-red-500' : 'text-ink'}`}>
                      00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime} <span className="text-lg not-italic font-sans text-gray-400">{dict.form.maxTime}</span>
                    </div>
                    
                    {!isRecording ? (
                      /* 🔒 RESOLUÇÃO DO ERRO TS: Retirado o argumento modalType */
                      <button onClick={startRecording} className="bg-brand text-white p-8 rounded-full shadow-2xl hover:scale-105 transition-transform">
                        {modalType === 'voice' ? <Mic size={36}/> : <Video size={36}/>}
                      </button>
                    ) : (
                      <button onClick={stopRecording} className="bg-red-500 text-white p-8 rounded-full shadow-2xl animate-bounce">
                        <StopCircle size={36}/>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 w-full mt-auto">
              {(modalType === 'text' || uploading) && (
                <button 
                  onClick={enviarTexto} 
                  disabled={uploading} 
                  className={`w-full py-5 ${premiumGradient} text-gold-soft rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all`}
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18}/>}
                  {uploading ? dict.form.uploading : dict.form.submit}
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}