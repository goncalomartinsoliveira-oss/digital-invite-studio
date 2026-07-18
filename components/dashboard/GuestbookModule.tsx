"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Play, Pause, FileArchive, Copy, Loader2, Globe, Trash2, MessageSquareHeart
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { isModuleUnlocked } from '@/lib/modules';
import { downloadQRAsPng, downloadQRAsSvg } from '@/lib/qrDownload';
import { MODULE_PRICES_CENTS } from '@/lib/pricing';
import { startModuleCheckout, formatPriceCents } from '@/lib/checkout';
import LockedModuleNotice from './LockedModuleNotice';
import { useBrand } from '@/components/site/BrandProvider';

interface GuestbookModuleDict {
  card: { title: string; subtitle: string; linkCopied: string };
  openDirect: string;
  copyLink: string;
  profile: { title: string; subtitle: string; messages: string };
  tabs: { textTab: string; audioTab: string; videoTab: string; zipTabBtn: string };
  anonymousAuthor: string;
  guestAuthor: string;
  audioPrivate: string;
  deleteConfirm: string;
  alerts: {
    noMessagesZip: string; guestbookZipError: string;
    deleteGuestbookConfirm: string; deleteGuestbookError: string;
  };
  zipContent: { guestbookHeader: string; messagePrefix: string; authorPrefix: string; datePrefix: string };
  locked: { title: string; message: string; contactBtn: string; buyBtn: string; couponToggleLabel?: string; couponPlaceholder?: string };
}

interface GuestbookModuleProps {
  invitationId: string;
  slug: string;
  canEdit: boolean;
  unlockedModules?: string[];
  isSuperAdmin?: boolean;
  dict: GuestbookModuleDict;
}

export default function GuestbookModule({ invitationId, slug, canEdit, unlockedModules, isSuperAdmin, dict }: GuestbookModuleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'pt';
  const brand = useBrand();
  const contactUrl = brand.contactUrl ?? `/${locale}/contact`;
  const locked = !isSuperAdmin && !isModuleUnlocked(unlockedModules, 'guestbook');
  const [buying, setBuying] = useState(false);

  const handleBuy = async (couponCode?: string) => {
    setBuying(true);
    try {
      await startModuleCheckout({ invitationId, slug, locale, moduleId: 'guestbook', couponCode });
    } catch (err: any) {
      alert(err.message || dict.locked.message);
      setBuying(false);
    }
  };

  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'texto' | 'audio' | 'video'>('texto');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urlGuestbook = `${origin}/${locale}/guestbook/${slug}`;

  useEffect(() => { if (!locked) fetchMensagens(); else setLoading(false); }, [invitationId, locked]);

  async function fetchMensagens() {
    try {
      setLoading(true);
      const { data: msgs } = await supabase.from('guestbook').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false });
      setMensagens(msgs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const baixarGuestbookZip = async (tipo: 'texto' | 'audio' | 'video') => {
    const msgs = mensagens.filter(m =>
      tipo === 'texto' ? m.tipo === 'texto' :
      tipo === 'audio' ? (m.tipo === 'audio' || m.tipo === 'voice') :
      m.tipo === 'video'
    );

    if (msgs.length === 0) { alert(dict.alerts.noMessagesZip); return; }

    setDownloadingZip(true);
    const zip = new JSZip();
    const zc = dict.zipContent;

    try {
      if (tipo === 'texto') {
        let textoCompleto = `${zc.guestbookHeader}\n\n`;
        msgs.forEach((m, i) => {
          textoCompleto += `${zc.messagePrefix} ${i + 1}\n${zc.authorPrefix}: ${m.autor || dict.anonymousAuthor}\n${zc.datePrefix}: ${new Date(m.created_at).toLocaleDateString()}\n\n"${m.conteudo}"\n\n---------------------------\n\n`;
        });
        zip.file(`votos_escritos_${slug}.txt`, textoCompleto);
      } else {
        await Promise.all(msgs.map(async (m, i) => {
          try {
            const response = await fetch(m.conteudo);
            const blob = await response.blob();
            const ext = tipo === 'video' ? 'mp4' : 'webm';
            const autorName = (m.autor || `convidado`).replace(/[^a-zA-Z0-9]/g, '_');
            zip.file(`${autorName}_${i + 1}.${ext}`, blob);
          } catch { console.error("Erro ao baixar ficheiro:", m.conteudo); }
        }));
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; link.download = `guestbook_${tipo}_${slug}.zip`; link.click();
      window.URL.revokeObjectURL(url);
    } catch { alert(dict.alerts.guestbookZipError); } finally { setDownloadingZip(false); }
  };

  const apagarMensagemTexto = async (id: string) => {
    if (!canEdit || !confirm(dict.deleteConfirm)) return;
    await supabase.from('guestbook').delete().eq('id', id);
    fetchMensagens();
  };

  const apagarGuestbookMedia = async (idBD: string, urlConteudo: string) => {
    if (!canEdit || !confirm(dict.alerts.deleteGuestbookConfirm)) return;
    try {
      const urlParts = urlConteudo.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) await supabase.storage.from('fotos_evento').remove([`${invitationId}/${fileName}`]);
      await supabase.from('guestbook').delete().eq('id', idBD);
      fetchMensagens();
    } catch { alert(dict.alerts.deleteGuestbookError); }
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) { audioRef.current?.pause(); setPlayingAudio(null); }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingAudio(url); } }
  };

  if (locked) {
    return (
      <LockedModuleNotice
        title={dict.locked.title}
        message={dict.locked.message}
        contactUrl={contactUrl}
        contactLabel={dict.locked.contactBtn}
        buyLabel={dict.locked.buyBtn}
        priceLabel={formatPriceCents(MODULE_PRICES_CENTS.guestbook, locale)}
        onBuy={handleBuy}
        buying={buying}
        couponToggleLabel={dict.locked.couponToggleLabel}
        couponPlaceholder={dict.locked.couponPlaceholder}
      />
    );
  }

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-montserrat pb-20">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />

      {/* CARTÃO DE ACESSO RÁPIDO */}
      <div className="max-w-md">
        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-cream p-4 rounded-3xl border border-gold-soft/50 mb-4">
            <QRCodeSVG id="qr-guestbook" value={urlGuestbook} size={110} />
          </div>
          <h4 className="font-bold text-brand text-xs uppercase tracking-widest mb-1">{dict.card.title}</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">{dict.card.subtitle}</p>
          <div className="w-full flex gap-2 mb-2">
            <button onClick={() => downloadQRAsSvg('qr-guestbook', `QR-Guestbook-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">SVG</button>
            <button onClick={() => downloadQRAsPng('qr-guestbook', `QR-Guestbook-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">PNG</button>
          </div>
          <div className="w-full flex gap-2">
            <button onClick={() => window.open(urlGuestbook, '_blank')} className="flex-1 bg-ink text-gold-soft py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Globe size={14} /> {dict.openDirect}</button>
            <button onClick={() => { navigator.clipboard.writeText(urlGuestbook); alert(dict.card.linkCopied); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14} /> {dict.copyLink}</button>
          </div>
        </section>
      </div>

      {/* PERFIL & ESTATÍSTICAS */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-16 h-16 rounded-2xl bg-brand/5 flex items-center justify-center text-brand shrink-0">
          <MessageSquareHeart size={28} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-serif text-2xl text-brand">{dict.profile.title}</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 mb-4">{dict.profile.subtitle}</p>
          <div className="flex gap-4 justify-center md:justify-start">
            <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">{mensagens.length} {dict.profile.messages}</span>
            </div>
          </div>
        </div>
      </section>

      {/* MENSAGENS */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm gap-2">
          <div className="flex gap-2">
            <button onClick={() => setSubTab('texto')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTab === 'texto' ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>{dict.tabs.textTab}</button>
            <button onClick={() => setSubTab('audio')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTab === 'audio' ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>{dict.tabs.audioTab}</button>
            <button onClick={() => setSubTab('video')} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${subTab === 'video' ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>{dict.tabs.videoTab}</button>
          </div>
          <button onClick={() => baixarGuestbookZip(subTab)} disabled={downloadingZip} className="bg-ink text-white px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-30 transition-all">
            {downloadingZip ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />} {dict.tabs.zipTabBtn}
          </button>
        </div>

        {subTab === 'texto' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mensagens.filter(m => m.tipo === 'texto').map((msg) => (
              <div key={msg.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-brand text-sm uppercase">{msg.autor || dict.anonymousAuthor}</h4>
                    <p className="text-[8px] text-gray-300 font-bold uppercase">{new Date(msg.created_at).toLocaleDateString()}</p>
                  </div>
                  {canEdit && (
                    <button onClick={() => apagarMensagemTexto(msg.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                  )}
                </div>
                <p className="text-gray-600 font-serif italic text-lg leading-relaxed">"{msg.conteudo}"</p>
              </div>
            ))}
          </div>
        )}

        {subTab === 'audio' && (
          <div className="space-y-4 max-w-2xl mx-auto md:mx-0">
            {mensagens.filter(m => m.tipo === 'voice' || m.tipo === 'audio').map((msg) => (
              <div key={msg.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 group">
                <button onClick={() => toggleAudio(msg.conteudo)} className="w-14 h-14 rounded-2xl bg-brand text-gold-soft flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                  {playingAudio === msg.conteudo ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm uppercase">{msg.autor || dict.guestAuthor}</h4>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">{dict.audioPrivate} • {new Date(msg.created_at).toLocaleDateString()}</p>
                </div>
                {canEdit && <button onClick={() => apagarGuestbookMedia(msg.id, msg.conteudo)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>}
              </div>
            ))}
          </div>
        )}

        {subTab === 'video' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mensagens.filter(m => m.tipo === 'video').map((msg) => (
              <div key={msg.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 relative group">
                <div className="aspect-[3/4] bg-black rounded-2xl overflow-hidden relative"><video src={msg.conteudo} className="w-full h-full object-cover" controls /></div>
                <div className="px-2">
                  <h4 className="font-bold text-gray-800 text-[10px] uppercase truncate">{msg.autor || dict.guestAuthor}</h4>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(msg.created_at).toLocaleDateString()}</p>
                </div>
                {canEdit && <button onClick={() => apagarGuestbookMedia(msg.id, msg.conteudo)} className="absolute top-6 right-6 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
