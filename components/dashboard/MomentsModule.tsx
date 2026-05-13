"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Download, ImageIcon, MessageSquare, Play, Pause, Camera, 
  Check, FileArchive, Copy, X, FileText, Loader2, Globe, QrCode,
  Mic, Video, Heart, Trash, Plus, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';

interface MomentsModuleProps {
  invitationId: string;
  slug: string;
  canEdit: boolean;
}

export default function MomentsModule({ invitationId, slug, canEdit }: MomentsModuleProps) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<'media' | 'guestbook'>('media');
  const [subTabGuestbook, setSubTabGuestbook] = useState<'texto' | 'audio' | 'video'>('texto');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  
  // Estado para controlar qual QR Code mostrar
  const [qrType, setQrType] = useState<'moments' | 'guestbook'>('moments');
  // Estado para o Lightbox da Galeria
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const urlPublica = typeof window !== 'undefined' ? `${window.location.origin}/pt/moments/${slug}` : '';
  const urlLiveWall = typeof window !== 'undefined' ? `${window.location.origin}/pt/live-wall/${slug}` : '';
  const urlGuestbook = typeof window !== 'undefined' ? `${window.location.origin}/pt/guestbook/${slug}` : '';

  useEffect(() => {
    fetchTudo();
  }, [invitationId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, fotos.length]);

  async function fetchTudo() {
    try {
      setLoading(true);
      const { data: inv } = await supabase.from('invitations').select('profile_image_url').eq('id', invitationId).single();
      setProfileUrl(inv?.profile_image_url || null);

      const { data: stData } = await supabase.storage.from('fotos_evento').list(invitationId, { sortBy: { column: 'created_at', order: 'desc' } });

      if (stData) {
        const urls = stData.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
          const { data: { publicUrl } } = supabase.storage.from('fotos_evento').getPublicUrl(`${invitationId}/${f.name}`);
          const isVideo = f.name.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
          const isPrivate = f.name.startsWith('private_');
          return { name: f.name, url: publicUrl, isVideo: !!isVideo, isPrivate };
        });
        setFotos(urls.filter(u => !u.isPrivate));
      }

      const { data: msgs } = await supabase.from('guestbook').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false });
      setMensagens(msgs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setSavingProfile(true);
    const fileName = `gal_profile_${invitationId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upError } = await supabase.storage.from('invites').upload(fileName, file);
    if (!upError) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      await supabase.from('invitations').update({ profile_image_url: publicUrl }).eq('id', invitationId);
      setProfileUrl(publicUrl);
    }
    setSavingProfile(false);
  };

  const downloadQR = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000; canvas.height = 1000;
      ctx!.fillStyle = "white"; ctx!.fillRect(0, 0, 1000, 1000);
      ctx?.drawImage(img, 50, 50, 900, 900);
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const downloadQRSVG = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.svg`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const baixarTudoZip = async () => {
    if (fotos.length === 0) return;
    setDownloadingZip(true);
    const zip = new JSZip();
    try {
      const downloadPromises = fotos.map(async (f) => {
        const response = await fetch(f.url);
        const blob = await response.blob();
        zip.file(f.name, blob);
      });
      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; link.download = `galeria-${slug}.zip`; link.click();
    } catch (err) { alert("Erro ZIP"); } finally { setDownloadingZip(false); }
  };

  // NOVA FUNÇÃO: Descarregar ZIP das mensagens do Guestbook
  const baixarGuestbookZip = async (tipo: 'texto' | 'audio' | 'video') => {
    const msgs = mensagens.filter(m => 
      tipo === 'texto' ? m.tipo === 'texto' : 
      tipo === 'audio' ? (m.tipo === 'audio' || m.tipo === 'voice') : 
      m.tipo === 'video'
    );
    
    if (msgs.length === 0) {
      alert("Não há mensagens para descarregar nesta aba.");
      return;
    }
    
    setDownloadingZip(true);
    const zip = new JSZip();
    
    try {
      if (tipo === 'texto') {
        let textoCompleto = "LIVRO DE HONRA - MENSAGENS ESCRITAS\n\n";
        msgs.forEach((m, i) => {
          textoCompleto += `Mensagem ${i + 1}\nAutor: ${m.autor || 'Anónimo'}\nData: ${new Date(m.created_at).toLocaleDateString()}\n\n"${m.conteudo}"\n\n---------------------------\n\n`;
        });
        zip.file(`votos_escritos_${slug}.txt`, textoCompleto);
      } else {
        const downloadPromises = msgs.map(async (m, i) => {
          try {
            const response = await fetch(m.conteudo);
            const blob = await response.blob();
            const ext = tipo === 'video' ? 'mp4' : 'webm';
            const autorName = (m.autor || `convidado`).replace(/[^a-zA-Z0-9]/g, '_');
            zip.file(`${autorName}_${i + 1}.${ext}`, blob);
          } catch (err) {
            console.error("Erro ao baixar ficheiro:", m.conteudo);
          }
        });
        await Promise.all(downloadPromises);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; 
      link.download = `guestbook_${tipo}_${slug}.zip`; 
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { 
      alert("Erro ao gerar ZIP do Guestbook"); 
    } finally { 
      setDownloadingZip(false); 
    }
  };

  const downloadMediaIndividual = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
    } catch (error) { alert("Erro ao baixar ficheiro individual."); }
  };

  // FUNÇÃO CORRIGIDA PARA APAGAR MEDIA (Atualização Imediata do UI)
  const apagarMedia = async (name: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!canEdit || !confirm("Tem a certeza que deseja apagar este ficheiro permanentemente?")) return;
    
    // Atualização Otimista: Tira imediatamente do ecrã para dar feedback visual ao utilizador
    setFotos(prev => prev.filter(f => f.name !== name));
    setSelectedIndex(null);

    const { error } = await supabase.storage.from('fotos_evento').remove([`${invitationId}/${name}`]);
    if (error) {
      alert(`Erro ao apagar no servidor: ${error.message}`);
    }
    
    // Confirmação final atualizando a lista
    fetchTudo();
  };

  const apagarGuestbookMedia = async (idBD: string, urlConteudo: string) => {
    if (!canEdit || !confirm("Apagar permanentemente esta mensagem?")) return;
    try {
      const urlParts = urlConteudo.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) await supabase.storage.from('fotos_evento').remove([`${invitationId}/${fileName}`]);
      await supabase.from('guestbook').delete().eq('id', idBD);
      fetchTudo();
    } catch (err) { alert("Erro ao apagar."); }
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) { audioRef.current?.pause(); setPlayingAudio(null); }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingAudio(url); } }
  };

  const goNext = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % fotos.length); };
  const goPrev = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + fotos.length) % fotos.length); };

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#630100]" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-montserrat pb-20">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      
      {/* 3 CARDS DE ACESSO RÁPIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: GALERIA PÚBLICA */}
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-[#FDFBF7] p-4 rounded-3xl border border-[#EFDFBB]/50 mb-4">
            <QRCodeSVG id="qr-moments" value={urlPublica} size={110} />
          </div>
          <h4 className="font-bold text-[#630100] text-xs uppercase tracking-widest mb-1">Página Pública de Photo Sharing</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">Partilha de fotos e videos entre convidados</p>
          
          <div className="w-full flex gap-2 mb-2 mt-auto">
             <button onClick={() => downloadQRSVG('qr-moments', `QR-Galeria-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">SVG</button>
             <button onClick={() => downloadQR('qr-moments', `QR-Galeria-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">PNG</button>
          </div>
          <div className="w-full flex gap-2">
             <button onClick={() => window.open(urlPublica, '_blank')} className="flex-1 bg-[#332E2B] text-[#EFDFBB] py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Globe size={14}/> Abrir Direto</button>
             <button onClick={() => { navigator.clipboard.writeText(urlPublica); alert("Link da Galeria copiado!"); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14}/> Copiar Link</button>
          </div>
        </section>

        {/* CARD 2: GUESTBOOK */}
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-[#FDFBF7] p-4 rounded-3xl border border-[#EFDFBB]/50 mb-4">
            <QRCodeSVG id="qr-guestbook" value={urlGuestbook} size={110} />
          </div>
          <h4 className="font-bold text-[#630100] text-xs uppercase tracking-widest mb-1">Página de Guestbook</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">Deixe que os seus convidados lhe enviem uma mensagem especial em texto, voz ou video</p>
          
          <div className="w-full flex gap-2 mb-2 mt-auto">
             <button onClick={() => downloadQRSVG('qr-guestbook', `QR-Guestbook-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">SVG</button>
             <button onClick={() => downloadQR('qr-guestbook', `QR-Guestbook-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">PNG</button>
          </div>
          <div className="w-full flex gap-2">
             <button onClick={() => window.open(urlGuestbook, '_blank')} className="flex-1 bg-[#332E2B] text-[#EFDFBB] py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Globe size={14}/> Abrir Direto</button>
             <button onClick={() => { navigator.clipboard.writeText(urlGuestbook); alert("Link do Guestbook copiado!"); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14}/> Copiar Link</button>
          </div>
        </section>

        {/* CARD 3: LIVE WALL */}
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-[#630100]/5 p-6 rounded-3xl border border-[#630100]/10 mb-4 flex items-center justify-center aspect-square w-[142px]">
            <Monitor size={64} className="text-[#630100]" />
          </div>
          <h4 className="font-bold text-[#630100] text-xs uppercase tracking-widest mb-1">Live Wall</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">Slide onde são partilhadas as fotos e videos carregadas pelos convidados na Página Pública de Photo Sharing</p>
          
          <div className="w-full flex gap-2 mt-auto pt-11">
             <button onClick={() => window.open(urlLiveWall, '_blank')} className="flex-1 bg-[#332E2B] text-[#EFDFBB] py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Play size={14}/> Abrir Direto</button>
             <button onClick={() => { navigator.clipboard.writeText(urlLiveWall); alert("Link do Live Wall copiado!"); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14}/> Copiar Link</button>
          </div>
        </section>

      </div>

      {/* SECÇÃO PERFIL & ESTATÍSTICAS */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
        <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FDFBF7] shadow-xl bg-gray-50">
            {profileUrl ? <img src={profileUrl} className="w-full h-full object-cover" alt="Perfil Galeria" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={30}/></div>}
          </div>
          {canEdit && (
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#630100] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all">
              {savingProfile ? <Loader2 className="animate-spin" size={14}/> : <Camera size={14}/>}
            </button>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-serif text-2xl text-[#630100]">Gestão de Conteúdos</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 mb-4">Personalize a foto de perfil das galerias e gira os ficheiros</p>
          <div className="flex gap-4 justify-center md:justify-start">
            <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">{fotos.length} Partilhas Públicas</span>
            </div>
            <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">{mensagens.length} Mensagens Guestbook</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button onClick={() => setTabAtiva('media')} className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tabAtiva === 'media' ? 'bg-white text-[#630100] shadow-sm' : 'text-gray-400'}`}>Galeria Pública</button>
        <button onClick={() => setTabAtiva('guestbook')} className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tabAtiva === 'guestbook' ? 'bg-white text-[#630100] shadow-sm' : 'text-gray-400'}`}>Guestbook Privado</button>
      </div>

      {tabAtiva === 'media' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grelha de Momentos</span>
            <button onClick={baixarTudoZip} disabled={downloadingZip || fotos.length === 0} className="bg-[#332E2B] text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-30 transition-all">
              {downloadingZip ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />} ZIP
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fotos.map((f, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedIndex(i)}
                className="group relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {f.isVideo ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <video src={f.url} className="w-full h-full object-cover opacity-60 pointer-events-none" />
                    <Play className="absolute text-white" size={32} fill="white" />
                  </div>
                ) : (
                  <img src={f.url} className="w-full h-full object-cover" alt="media" />
                )}
                {canEdit && (
                  <button 
                    onClick={(e) => apagarMedia(f.name, e)} 
                    className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tabAtiva === 'guestbook' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm gap-2">
            <div className="flex gap-2">
              <button onClick={() => setSubTabGuestbook('texto')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'texto' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Textos</button>
              <button onClick={() => setSubTabGuestbook('audio')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'audio' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Áudios</button>
              <button onClick={() => setSubTabGuestbook('video')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'video' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Vídeos</button>
            </div>
            
            {/* NOVO BOTÃO: Descarregar ZIP da aba atual */}
            <button 
              onClick={() => baixarGuestbookZip(subTabGuestbook)} 
              disabled={downloadingZip} 
              className="bg-[#332E2B] text-white px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-30 transition-all"
            >
              {downloadingZip ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />} ZIP da aba
            </button>
          </div>

          {subTabGuestbook === 'texto' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mensagens.filter(m => m.tipo === 'texto').map((msg) => (
                <div key={msg.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div><h4 className="font-bold text-[#630100] text-sm uppercase">{msg.autor || 'Anónimo'}</h4><p className="text-[8px] text-gray-300 font-bold uppercase">{new Date(msg.created_at).toLocaleDateString()}</p></div>
                    {canEdit && <button onClick={async () => { if(confirm("Apagar?")) { await supabase.from('guestbook').delete().eq('id', msg.id); fetchTudo(); } }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>}
                  </div>
                  <p className="text-gray-600 font-serif italic text-lg leading-relaxed">"{msg.conteudo}"</p>
                </div>
              ))}
            </div>
          )}

          {subTabGuestbook === 'audio' && (
            <div className="space-y-4 max-w-2xl mx-auto md:mx-0">
              {mensagens.filter(m => m.tipo === 'voice' || m.tipo === 'audio').map((msg) => (
                <div key={msg.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 group">
                  <button onClick={() => toggleAudio(msg.conteudo)} className="w-14 h-14 rounded-2xl bg-[#630100] text-[#EFDFBB] flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                    {playingAudio === msg.conteudo ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                  </button>
                  <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm uppercase">{msg.autor || 'Convidado'}</h4><p className="text-[8px] text-gray-400 font-bold uppercase">Áudio Privado • {new Date(msg.created_at).toLocaleDateString()}</p></div>
                  {canEdit && <button onClick={() => apagarGuestbookMedia(msg.id, msg.conteudo)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          )}

          {subTabGuestbook === 'video' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mensagens.filter(m => m.tipo === 'video').map((msg) => (
                <div key={msg.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 relative group">
                  <div className="aspect-[3/4] bg-black rounded-2xl overflow-hidden relative"><video src={msg.conteudo} className="w-full h-full object-cover" controls /></div>
                  <div className="px-2"><h4 className="font-bold text-gray-800 text-[10px] uppercase truncate">{msg.autor || 'Convidado'}</h4><p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(msg.created_at).toLocaleDateString()}</p></div>
                  {canEdit && <button onClick={() => apagarGuestbookMedia(msg.id, msg.conteudo)} className="absolute top-6 right-6 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash2 size={14}/></button>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- LIGHTBOX DA GALERIA (PÚBLICA) --- */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center" 
            onClick={() => setSelectedIndex(null)}
          >
            <div className="absolute top-6 left-0 w-full px-6 flex items-center justify-between text-white/70 z-[160]">
               <span className="text-[10px] font-black uppercase tracking-widest">{selectedIndex + 1} / {fotos.length}</span>
               <div className="flex items-center gap-4">
                 <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2" onClick={(e) => { e.stopPropagation(); downloadMediaIndividual(fotos[selectedIndex].url, fotos[selectedIndex].name); }}>
                   <Download size={20} /><span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Guardar</span>
                 </button>
                 {canEdit && (
                    <button className="p-3 bg-red-500/20 hover:bg-red-500 rounded-full transition-colors flex items-center gap-2 text-red-200 hover:text-white" onClick={(e) => apagarMedia(fotos[selectedIndex].name, e)}>
                      <Trash2 size={20} />
                    </button>
                 )}
                 <button className="p-2 hover:text-white transition-colors" onClick={() => setSelectedIndex(null)}><X size={32} /></button>
               </div>
            </div>
            
            <button className="hidden md:flex absolute left-8 p-4 text-white/20 hover:text-white transition-all z-[160]" onClick={(e) => { e.stopPropagation(); goPrev(); }}><ChevronLeft size={64} /></button>
            <button className="hidden md:flex absolute right-8 p-4 text-white/20 hover:text-white transition-all z-[160]" onClick={(e) => { e.stopPropagation(); goNext(); }}><ChevronRight size={64} /></button>
            
            <motion.div 
              key={fotos[selectedIndex].name} 
              drag="x" 
              dragConstraints={{ left: 0, right: 0 }} 
              onDragEnd={(_, info) => { if (info.offset.x > 50) goPrev(); else if (info.offset.x < -50) goNext(); }} 
              className="w-full h-full flex flex-col items-center justify-center p-4" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[85vh] w-full flex items-center justify-center relative">
                {fotos[selectedIndex].isVideo ? (
                  <video src={fotos[selectedIndex].url} controls autoPlay className="max-h-full max-w-full rounded-2xl shadow-2xl" />
                ) : (
                  <img src={fotos[selectedIndex].url} className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}