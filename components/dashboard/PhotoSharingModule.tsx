"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Download, ImageIcon, Play, Camera,
  FileArchive, Copy, X, Loader2, Globe,
  Monitor, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { isModuleUnlocked } from '@/lib/modules';
import { downloadQRAsPng, downloadQRAsSvg } from '@/lib/qrDownload';
import { effectiveModulePriceCents, EMPTY_PRICING_OVERRIDES, type PricingOverrides } from '@/lib/pricing';
import { startModuleCheckout, formatPriceCents } from '@/lib/checkout';
import LockedModuleNotice from './LockedModuleNotice';
import { useBrand } from '@/components/site/BrandProvider';

interface PhotoSharingModuleDict {
  gallery: { title: string; subtitle: string; linkCopied: string };
  liveWall: { title: string; subtitle: string; linkCopied: string };
  openDirect: string;
  copyLink: string;
  profile: { title: string; subtitle: string; publicShares: string };
  media: { gridLabel: string; zipBtn: string };
  lightbox: { saveBtn: string };
  alerts: {
    zipError: string; downloadError: string;
    deleteMediaConfirm: string; deleteServerError: string;
  };
  locked: { title: string; message: string; contactBtn: string; buyBtn: string; couponToggleLabel?: string; couponPlaceholder?: string };
}

interface PhotoSharingModuleProps {
  invitationId: string;
  slug: string;
  canEdit: boolean;
  unlockedModules?: string[];
  isSuperAdmin?: boolean;
  overrides?: PricingOverrides;
  dict: PhotoSharingModuleDict;
}

export default function PhotoSharingModule({ invitationId, slug, canEdit, unlockedModules, isSuperAdmin, overrides, dict }: PhotoSharingModuleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'pt';
  const brand = useBrand();
  const contactUrl = brand.contactUrl ?? `/${locale}/contact`;
  const locked = !isSuperAdmin && !isModuleUnlocked(unlockedModules, 'photo_sharing');
  const [buying, setBuying] = useState(false);

  const handleBuy = async (couponCode?: string) => {
    setBuying(true);
    try {
      await startModuleCheckout({ invitationId, slug, locale, moduleId: 'photo_sharing', couponCode });
    } catch (err: any) {
      alert(err.message || dict.locked.message);
      setBuying(false);
    }
  };

  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urlPublica = `${origin}/${locale}/moments/${slug}`;
  const urlLiveWall = `${origin}/${locale}/live-wall/${slug}`;

  useEffect(() => { if (!locked) fetchTudo(); else setLoading(false); }, [invitationId, locked]);

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

  const baixarTudoZip = async () => {
    if (fotos.length === 0) return;
    setDownloadingZip(true);
    const zip = new JSZip();
    try {
      await Promise.all(fotos.map(async (f) => {
        const response = await fetch(f.url);
        const blob = await response.blob();
        zip.file(f.name, blob);
      }));
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; link.download = `galeria-${slug}.zip`; link.click();
    } catch { alert(dict.alerts.zipError); } finally { setDownloadingZip(false); }
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
    } catch { alert(dict.alerts.downloadError); }
  };

  const apagarMedia = async (name: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!canEdit || !confirm(dict.alerts.deleteMediaConfirm)) return;
    setFotos(prev => prev.filter(f => f.name !== name));
    setSelectedIndex(null);
    const { error } = await supabase.storage.from('fotos_evento').remove([`${invitationId}/${name}`]);
    if (error) alert(`${dict.alerts.deleteServerError}${error.message}`);
    fetchTudo();
  };

  const goNext = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % fotos.length); };
  const goPrev = () => { if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + fotos.length) % fotos.length); };

  if (locked) {
    return (
      <LockedModuleNotice
        title={dict.locked.title}
        message={dict.locked.message}
        contactUrl={contactUrl}
        contactLabel={dict.locked.contactBtn}
        buyLabel={dict.locked.buyBtn}
        priceLabel={formatPriceCents(effectiveModulePriceCents('photo_sharing', overrides ?? EMPTY_PRICING_OVERRIDES), locale)}
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

      {/* QUICK ACCESS CARDS: GALERIA + LIVE WALL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-cream p-4 rounded-3xl border border-gold-soft/50 mb-4">
            <QRCodeSVG id="qr-gallery" value={urlPublica} size={110} />
          </div>
          <h4 className="font-bold text-brand text-xs uppercase tracking-widest mb-1">{dict.gallery.title}</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">{dict.gallery.subtitle}</p>
          <div className="w-full flex gap-2 mb-2 mt-auto">
            <button onClick={() => downloadQRAsSvg('qr-gallery', `QR-Galeria-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">SVG</button>
            <button onClick={() => downloadQRAsPng('qr-gallery', `QR-Galeria-${slug}`)} className="flex-1 py-2 bg-gray-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">PNG</button>
          </div>
          <div className="w-full flex gap-2">
            <button onClick={() => window.open(urlPublica, '_blank')} className="flex-1 bg-ink text-gold-soft py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Globe size={14} /> {dict.openDirect}</button>
            <button onClick={() => { navigator.clipboard.writeText(urlPublica); alert(dict.gallery.linkCopied); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14} /> {dict.copyLink}</button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-brand/5 p-6 rounded-3xl border border-brand/10 mb-4 flex items-center justify-center aspect-square w-[142px]">
            <Monitor size={64} className="text-brand" />
          </div>
          <h4 className="font-bold text-brand text-xs uppercase tracking-widest mb-1">{dict.liveWall.title}</h4>
          <p className="text-[9px] text-gray-400 uppercase font-bold mb-6">{dict.liveWall.subtitle}</p>
          <div className="w-full flex gap-2 mt-auto pt-11">
            <button onClick={() => window.open(urlLiveWall, '_blank')} className="flex-1 bg-ink text-gold-soft py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-black transition-all shadow-sm"><Play size={14} /> {dict.openDirect}</button>
            <button onClick={() => { navigator.clipboard.writeText(urlLiveWall); alert(dict.liveWall.linkCopied); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-50 transition-all"><Copy size={14} /> {dict.copyLink}</button>
          </div>
        </section>

      </div>

      {/* PROFILE & STATS */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
        <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-cream shadow-xl bg-gray-50">
            {profileUrl ? <img src={profileUrl} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={30} /></div>}
          </div>
          {canEdit && (
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all">
              {savingProfile ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
            </button>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-serif text-2xl text-brand">{dict.profile.title}</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 mb-4">{dict.profile.subtitle}</p>
          <div className="flex gap-4 justify-center md:justify-start">
            <div className="bg-gray-50 px-5 py-2 rounded-full border border-gray-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">{fotos.length} {dict.profile.publicShares}</span>
            </div>
          </div>
        </div>
      </section>

      {/* GRELHA */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{dict.media.gridLabel}</span>
          <button onClick={baixarTudoZip} disabled={downloadingZip || fotos.length === 0} className="bg-ink text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black disabled:opacity-30 transition-all">
            {downloadingZip ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />} {dict.media.zipBtn}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {fotos.map((f, i) => (
            <div key={i} onClick={() => setSelectedIndex(i)} className="group relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
              {f.isVideo ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <video src={f.url} className="w-full h-full object-cover opacity-60 pointer-events-none" />
                  <Play className="absolute text-white" size={32} fill="white" />
                </div>
              ) : (
                <img src={f.url} className="w-full h-full object-cover" alt="media" />
              )}
              {canEdit && (
                <button onClick={(e) => apagarMedia(f.name, e)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 hover:bg-red-500 hover:text-white">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX */}
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
                  <Download size={20} /><span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{dict.lightbox.saveBtn}</span>
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
