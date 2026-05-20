"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Camera, Heart, Loader2, MessageSquare, Plus, X, 
  PlayCircle, ChevronDown, Mic, Video, Send, StopCircle,
  ShieldCheck, ChevronLeft, ChevronRight, Download, Globe, CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. IMPORTAR OS DICIONÁRIOS (4 Níveis de recuo)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

const premiumGradient = "bg-gradient-to-tr from-[#630100] via-[#8B0000] to-[#330100]";

export default function GuestMomentsPage() {
  const { slug, locale } = useParams();
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const currentLocale = (locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[currentLocale]?.GuestMomentsPage || dictionaries.pt.GuestMomentsPage;

  const [invitation, setInvitation] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meusLikes, setMeusLikes] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [modalType, setModalType] = useState<'text' | 'voice' | 'video' | null>(null);
  const [autor, setAutor] = useState("");
  const [textoMensagem, setTextoMensagem] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchInitialData();
    const savedLikes = localStorage.getItem(`likes_${slug}`);
    if (savedLikes) setMeusLikes(JSON.parse(savedLikes));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, selectedIndex, fotos.length]);

  useEffect(() => {
    if (fotos.length > 0) {
      const slideTimer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(fotos.length, 5));
      }, 5000);
      return () => clearInterval(slideTimer);
    }
  }, [fotos]);

  async function fetchInitialData() {
    try {
      const { data: inv, error } = await supabase.from('invitations').select('id, bride_name, groom_name, profile_image_url').eq('slug', slug).single();
      if (error) throw error;
      setInvitation(inv);
      await fetchFotos(inv.id);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function fetchFotos(invId: string) {
    const { data: stData } = await supabase.storage.from('fotos_evento').list(invId, { sortBy: { column: 'created_at', order: 'desc' } });
    if (stData) {
      const { data: likesData } = await supabase.from('fotos_likes').select('*');
      const likesMap = new Map(likesData?.map(l => [l.foto_name, l.likes_count]) || []);
      const urls = stData
        .filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('private_'))
        .map(f => {
          const { data: { publicUrl } } = supabase.storage.from('fotos_evento').getPublicUrl(`${invId}/${f.name}`);
          const isVideo = f.name.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
          return { name: f.name, url: publicUrl, isVideo: !!isVideo, likesCount: likesMap.get(f.name) || 0 };
        });
      setFotos(urls);
    }
  }

  const downloadMedia = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
    } catch (error) { alert(dict.alerts.downloadError); }
  };

  const compressImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('video/')) return resolve(file); 
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1600;
          let width = img.width; let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleUploadProcess = async (files: FileList | null, isPrivate: boolean, type: string = 'media') => {
    if (!files || files.length === 0 || !invitation) return;
    setUploading(true);
    setUploadProgress(5);
    let completed = 0;
    for (const file of Array.from(files)) {
      const processed = await compressImage(file);
      const prefix = isPrivate ? 'private_gb_' : '';
      const fileName = `${prefix}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const path = `${invitation.id}/${fileName}`;
      const { error } = await supabase.storage.from('fotos_evento').upload(path, processed);
      if (!error) {
        if (isPrivate) {
          const { data: { publicUrl } } = supabase.storage.from('fotos_evento').getPublicUrl(path);
          await supabase.from('guestbook').insert([{ invitation_id: invitation.id, tipo: type, conteudo: publicUrl, autor: autor || 'Anónimo' }]);
        }
        completed++;
        setUploadProgress(Math.round((completed / files.length) * 100));
      }
    }
    if (!isPrivate) await fetchFotos(invitation.id);
    else { alert(dict.alerts.uploadingPrivate); setModalType(null); setAutor(""); }
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  };

  const startRecording = async (type: 'voice' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' ? { facingMode: "user" } : false });
      if (type === 'video' && videoRef.current) videoRef.current.srcObject = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: type === 'video' ? 'video/mp4' : 'audio/webm' });
        const file = new File([blob], `capture.${type === 'video' ? 'mp4' : 'webm'}`, { type: blob.type });
        const dataTransfer = new DataTransfer(); dataTransfer.items.add(file);
        await handleUploadProcess(dataTransfer.files, true, type);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start(); setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => { setRecordingTime(prev => { if (prev >= 29) { stopRecording(); return 30; } return prev + 1; }); }, 1000);
    } catch (err) { alert(dict.alerts.permissionDenied); }
  };

  const stopRecording = () => { mediaRecorder.current?.stop(); setIsRecording(false); clearInterval(timerRef.current); };

  const handleLike = async (fotoName: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (meusLikes.includes(fotoName)) return;
    const { data: existing } = await supabase.from('fotos_likes').select('likes_count').eq('foto_name', fotoName).single();
    const novoTotal = (existing?.likes_count || 0) + 1;
    await supabase.from('fotos_likes').upsert({ foto_name: fotoName, likes_count: novoTotal });
    const novosLikes = [...meusLikes, fotoName]; setMeusLikes(novosLikes);
    localStorage.setItem(`likes_${slug}`, JSON.stringify(novosLikes));
    setFotos(prev => prev.map(f => f.name === fotoName ? { ...f, likesCount: novoTotal } : f));
  };

  const goNext = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % fotos.length); };
  const goPrev = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + fotos.length) % fotos.length); };

  if (loading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#630100]" size={32} /></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto font-montserrat">
      <AnimatePresence>{uploading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-[#630100]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="relative mb-8"><div className="w-32 h-32 border-4 border-white/10 border-t-white rounded-full animate-spin"></div><CloudUpload className="absolute inset-0 m-auto text-[#EFDFBB] animate-bounce" size={40} /></div>
          <h2 className="font-serif text-3xl mb-2 italic">{dict.uploadOverlay.title}</h2>
          <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden mt-6"><motion.div className="h-full bg-[#EFDFBB]" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} /></div>
          <span className="text-[#EFDFBB] font-black mt-4 text-2xl">{uploadProgress}%</span>
        </motion.div>
      )}</AnimatePresence>

      <div className="relative h-[65vh] w-full overflow-hidden shrink-0">
        {fotos.length > 0 ? fotos.slice(0, 5).map((foto, index) => (
          <motion.div key={foto.name} initial={{ opacity: 0 }} animate={{ opacity: index === currentSlide ? 1 : 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
            {foto.isVideo ? <video src={`${foto.url}#t=0.1,10`} className="w-full h-full object-cover scale-110" muted autoPlay playsInline loop /> : <img src={foto.url} className="w-full h-full object-cover scale-110" alt="bg" />}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          </motion.div>
        )) : <div className="absolute inset-0 bg-[#330100]" />}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-1 rounded-full bg-gradient-to-tr from-[#EFDFBB] to-[#630100] mb-6 shadow-2xl">
            <div className="bg-white p-1 rounded-full"><img src={invitation?.profile_image_url || "/placeholder.png"} className="w-24 h-24 rounded-full object-cover border-2 border-white" alt="Perfil" /></div>
          </motion.div>
          <h1 className="text-3xl font-serif italic mb-2">{invitation?.bride_name} & {invitation?.groom_name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-90">{fotos.length} {dict.sharedMoments}</p>
          <label className={`mt-10 flex flex-col items-center gap-3 px-10 py-5 ${premiumGradient} rounded-2xl shadow-2xl cursor-pointer active:scale-95 transition-all border border-white/20`}>
              <div className="flex items-center gap-3"><Camera size={20} className="text-[#EFDFBB]" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#EFDFBB]">{dict.sharePublic}</span></div>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleUploadProcess(e.target.files, false)} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-t-[40px] -mt-10 relative z-10 p-1 min-h-[50vh] pb-32">
        <div className="grid grid-cols-3 gap-[2px] md:gap-2 rounded-t-[32px] overflow-hidden">
          {fotos.slice(0, visibleCount).map((foto, i) => (
            <div key={foto.name} onClick={() => setSelectedIndex(i)} className="aspect-square bg-gray-100 relative group overflow-hidden cursor-pointer">
              {foto.isVideo ? <div className="w-full h-full relative"><video src={foto.url} className="w-full h-full object-cover" /><PlayCircle className="absolute inset-0 m-auto text-white/70" size={30} /></div> : <img src={foto.url} className="w-full h-full object-cover" alt="Momento" />}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] text-white">
                 <Heart size={8} className={meusLikes.includes(foto.name) ? "fill-red-500 text-red-500" : ""} /><span>{foto.likesCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
        {fotos.length > visibleCount && <div className="flex justify-center mt-8"><button onClick={() => setVisibleCount(v => v + 12)} className="flex items-center gap-2 px-8 py-3 bg-[#FDFBF7] border border-[#EFDFBB] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#630100]"><ChevronDown size={14}/> {dict.loadMore}</button></div>}
        <footer className="mt-20 flex flex-col items-center justify-center border-t border-gray-50 pt-10 pb-20"><Link href={`/${locale}`} className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-all"><span className="text-[8px] font-bold uppercase tracking-[0.4em] text-gray-400">{dict.developedBy}</span><img src="/logo-dis.svg" alt="Digital Invite Studio" className="h-6 w-auto grayscale group-hover:grayscale-0 transition-all" /></Link></footer>
      </div>

      {/* --- MENU EXPANSÍVEL GUESTBOOK PRIVADO --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>{menuOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex flex-col items-end gap-3 mb-2">
            <div className="bg-[#630100] text-[#EFDFBB] p-4 rounded-3xl mb-2 shadow-2xl flex flex-col items-center gap-2 border border-white/10">
              <div className="flex items-center gap-2 text-[#EFDFBB]"><ShieldCheck size={16} /><span className="text-[9px] font-black uppercase tracking-widest italic">{dict.privateGuestbook.title}</span></div>
              <p className="text-[8px] text-center opacity-80 leading-tight uppercase font-medium">{dict.privateGuestbook.desc1}<br/>{dict.privateGuestbook.desc2}</p>
            </div>
            <button onClick={() => { setModalType('text'); setMenuOpen(false); }} className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 flex items-center justify-between w-56 hover:bg-gray-50 transition-all"><span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{dict.menu.writeWishes}</span><div className="bg-orange-50 p-2 rounded-xl text-orange-500"><MessageSquare size={22}/></div></button>
            <button onClick={() => { setModalType('voice'); setMenuOpen(false); }} className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 flex items-center justify-between w-56 hover:bg-gray-50 transition-all"><span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{dict.menu.voiceMessage}</span><div className="bg-[#630100]/5 p-2 rounded-xl text-[#630100]"><Mic size={22}/></div></button>
            <button onClick={() => { setModalType('video'); setMenuOpen(false); }} className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 flex items-center justify-between w-56 hover:bg-gray-50 transition-all"><span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{dict.menu.videoDedication}</span><div className="bg-purple-50 p-2 rounded-xl text-purple-500"><Video size={22}/></div></button>
          </motion.div>
        )}</AnimatePresence>
        <button onClick={() => setMenuOpen(!menuOpen)} className={`${premiumGradient} w-16 h-16 text-[#EFDFBB] rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 border border-white/20`}>{menuOpen ? <X size={32} /> : <Plus size={35} />}</button>
      </div>

      <AnimatePresence>{modalType && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center text-[#332E2B]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-400"></div>
            <button className="absolute top-6 right-6 text-gray-400" onClick={() => { stopRecording(); setModalType(null); }}><X size={24}/></button>
            <h3 className="font-serif text-2xl text-[#630100] mb-8 uppercase italic tracking-tighter">{modalType === 'text' ? dict.modal.titleText : modalType === 'voice' ? dict.modal.titleVoice : dict.modal.titleVideo}</h3>
            <div className="space-y-6">
              <input type="text" placeholder={dict.modal.namePlaceholder} className="w-full bg-gray-50 p-4 rounded-2xl border-none outline-none font-bold text-sm" value={autor} onChange={e => setAutor(e.target.value)} />
              {modalType === 'text' && (<><textarea placeholder={dict.modal.textPlaceholder} className="w-full bg-gray-50 p-4 rounded-2xl h-40 border-none outline-none font-medium text-sm resize-none" value={textoMensagem} onChange={e => setTextoMensagem(e.target.value)} /><button onClick={async () => {
                if(!textoMensagem) return; setUploading(true);
                await supabase.from('guestbook').insert([{ invitation_id: invitation.id, tipo: 'texto', conteudo: textoMensagem, autor: autor || 'Anónimo' }]);
                setUploading(false); setModalType(null); setTextoMensagem(""); alert(dict.alerts.textSent);
              }} className={`w-full py-5 ${premiumGradient} text-[#EFDFBB] rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-2`}><Send size={16}/> {dict.modal.submitBtn}</button></>)}
              {(modalType === 'voice' || modalType === 'video') && (<div className="flex flex-col items-center gap-6">{modalType === 'video' && <div className="w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden border-2 border-[#EFDFBB]"><video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /></div>}<div className="flex flex-col items-center gap-2"><div className={`text-2xl font-black ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime} <span className="text-xs">/ 30s</span></div>{!isRecording ? <button onClick={() => startRecording(modalType as 'voice' | 'video')} className="bg-[#630100] text-white p-6 rounded-full shadow-xl"><Mic size={32}/></button> : <button onClick={stopRecording} className="bg-red-50 text-white p-6 rounded-full shadow-xl animate-bounce"><StopCircle size={32}/></button>}</div></div>)}
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{selectedIndex !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-xl flex flex-col items-center justify-center" onClick={() => setSelectedIndex(null)}>
          <div className="absolute top-6 left-0 w-full px-6 flex items-center justify-between text-white/70 z-[160]"><span className="text-[10px] font-black uppercase tracking-widest">{selectedIndex + 1} / {fotos.length}</span><div className="flex items-center gap-4"><button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2" onClick={(e) => { e.stopPropagation(); downloadMedia(fotos[selectedIndex].url, fotos[selectedIndex].name); }}><Download size={20} /><span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{dict.lightbox.save}</span></button><button className="p-2 hover:text-white transition-colors" onClick={() => setSelectedIndex(null)}><X size={32} /></button></div></div>
          <button className="hidden md:flex absolute left-8 p-4 text-white/20 hover:text-white transition-all z-[160]" onClick={(e) => { e.stopPropagation(); goPrev(); }}><ChevronLeft size={64} /></button>
          <button className="hidden md:flex absolute right-8 p-4 text-white/20 hover:text-white transition-all z-[160]" onClick={(e) => { e.stopPropagation(); goNext(); }}><ChevronRight size={64} /></button>
          <motion.div key={fotos[selectedIndex].name} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x > 50) goPrev(); else if (info.offset.x < -50) goNext(); }} className="w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}><div className="max-h-[75vh] w-full flex items-center justify-center relative">{fotos[selectedIndex].isVideo ? <video src={fotos[selectedIndex].url} controls autoPlay className="max-h-full max-w-full rounded-2xl shadow-2xl" /> : <img src={fotos[selectedIndex].url} className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" />}</div><button onClick={(e) => handleLike(fotos[selectedIndex].name, e)} className={`mt-10 p-5 rounded-full backdrop-blur-md border transition-all ${meusLikes.includes(fotos[selectedIndex].name) ? 'bg-red-500 border-red-500 scale-110 shadow-xl' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}><Heart size={32} className="text-white" fill={meusLikes.includes(fotos[selectedIndex].name) ? "white" : "none"} /></button></motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}