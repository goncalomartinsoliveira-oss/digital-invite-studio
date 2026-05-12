"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Download, ImageIcon, MessageSquare, Play, Pause, Camera, 
  Check, FileArchive, Copy, X, FileText, Loader2, Globe, QrCode,
  Mic, Video, Heart, Trash, Plus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlPublica = typeof window !== 'undefined' ? `${window.location.origin}/pt/moments/${slug}` : '';

  useEffect(() => {
    fetchTudo();
  }, [invitationId]);

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

  const downloadQR = () => {
    const svg = document.getElementById("qr-moments");
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
      link.download = `QR-Moments-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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

  const apagarMedia = async (name: string) => {
    if (!canEdit || !confirm("Apagar permanentemente?")) return;
    await supabase.storage.from('fotos_evento').remove([`${invitationId}/${name}`]);
    fetchTudo();
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) { audioRef.current?.pause(); setPlayingAudio(null); }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingAudio(url); } }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#630100]" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-montserrat pb-20">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
          <div className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#EFDFBB]/50">
            <QRCodeSVG id="qr-moments" value={urlPublica} size={150} />
          </div>
          <div>
            <h4 className="font-bold text-[#630100] text-sm uppercase tracking-widest">QR Code do Evento</h4>
            <p className="text-[10px] text-gray-400 mt-1">PNG para impressão disponível</p>
          </div>
          <button onClick={downloadQR} className="w-full bg-[#332E2B] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Download size={14}/> Baixar QR em PNG
          </button>
        </section>

        <section className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FDFBF7] shadow-xl bg-gray-50">
              {profileUrl ? <img src={profileUrl} className="w-full h-full object-cover" alt="Perfil" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={40}/></div>}
            </div>
            {canEdit && (
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#630100] text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-all">
                {savingProfile ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16}/>}
              </button>
            )}
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <h3 className="font-serif text-3xl text-[#630100]">Gestão de Momentos</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Gerencie fotos públicas e o Guestbook privado dos convidados.</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{fotos.length} Públicos</span>
              </div>
              <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{mensagens.length} Guestbook</span>
              </div>
            </div>
          </div>
        </section>
      </div>

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
              <div key={i} className="group relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                {f.isVideo ? <div className="w-full h-full bg-gray-900 flex items-center justify-center"><video src={f.url} className="w-full h-full object-cover opacity-60" /><Play className="absolute text-white" size={32} fill="white" /></div> : <img src={f.url} className="w-full h-full object-cover" alt="media" />}
                {canEdit && <button onClick={() => apagarMedia(f.name)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash2 size={14}/></button>}
              </div>
            ))}
          </div>
        </section>
      )}

      {tabAtiva === 'guestbook' && (
        <section className="space-y-6">
          <div className="flex bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm gap-2">
            <button onClick={() => setSubTabGuestbook('texto')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'texto' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Textos</button>
            <button onClick={() => setSubTabGuestbook('audio')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'audio' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Áudios</button>
            <button onClick={() => setSubTabGuestbook('video')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTabGuestbook === 'video' ? 'bg-[#630100] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>Vídeos</button>
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
                  <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm uppercase">{msg.autor || 'Convidado'}</h4><p className="text-[8px] text-gray-400 font-bold uppercase">Mensagem de Voz • {new Date(msg.created_at).toLocaleDateString()}</p></div>
                  {canEdit && <button onClick={async () => { if(confirm("Apagar?")) { await supabase.from('guestbook').delete().eq('id', msg.id); fetchTudo(); } }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>}
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
                  {canEdit && <button onClick={async () => { if(confirm("Apagar?")) { await supabase.from('guestbook').delete().eq('id', msg.id); fetchTudo(); } }} className="absolute top-6 right-6 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash2 size={14}/></button>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}