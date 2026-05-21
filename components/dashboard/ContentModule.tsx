"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ContentModuleDict {
  toggle: { visible: string; hidden: string };
  sections: {
    hero: { title: string; subtitleLabel: string; mediaLabel: string; noFile: string; uploading: string; changeMedia: string };
    countdown: { title: string; mainTitleLabel: string };
    story: { title: string; subtitleLabel: string; mainTitleLabel: string; photoLabel: string; photoEmpty: string; photoUpload: string; textsLabel: string; paragraphPrefix: string };
    gallery: { title: string; subtitleLabel: string; mainTitleLabel: string; photosLabel: string };
    program: { title: string; subtitleLabel: string; mainTitleLabel: string; eventsLabel: string; addBtn: string; newEventDefault: string };
    event: { title: string; sectionTitleLabel: string; ceremonyTitle: string; receptionTitle: string; titleLabel: string; timeLabel: string; locationLabel: string; mapsLabel: string; mapsPlaceholder: string };
    details: {
      title: string; subtitleLabel: string; mainTitleLabel: string;
      logistics: { title: string; titleLabel: string; infoLabel: string };
      accommodation: { title: string; titleLabel: string; infoLabel: string; hotelsLabel: string; addBtn: string; hotelNamePlaceholder: string };
      dresscode: { title: string; titleLabel: string; messageLabel: string; paletteLabel: string };
      gifts: { title: string; titleLabel: string; messageLabel: string; ibanToggleLabel: string; ibanBtnLabel: string; ibanBtnPlaceholder: string; ibanHoldersLabel: string; ibanValueLabel: string; ibanValuePlaceholder: string };
    };
    rsvp: { title: string; subtitleLabel: string; mainTitleLabel: string; deadlineLabel: string; deadlinePlaceholder: string };
    footer: { title: string; showContactsLabel: string; contact1NameLabel: string; contact1PhoneLabel: string; contact1NamePlaceholder: string; contact1PhonePlaceholder: string; contact2NameLabel: string; contact2PhoneLabel: string; contact2NamePlaceholder: string; contact2PhonePlaceholder: string; subtitleLabel: string; mainTitleLabel: string; locationLabel: string; locationPlaceholder: string; photoLabel: string; photoEmpty: string; changePhoto: string };
  };
}

interface ContentModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
  canEdit: boolean;
  dict: ContentModuleDict;
}

const AccordionItem = ({ title, children, isOpen, isVisible, onToggleOpen, onToggleVisibility, canEdit, visibleLabel, hiddenLabel }: any) => (
  <div className={`border transition-all duration-500 rounded-3xl bg-white overflow-hidden ${isOpen ? 'border-[#630100]/20 shadow-lg my-6' : 'border-gray-100 shadow-sm hover:border-[#630100]/30 mb-4'}`}>
    <div className="flex items-center justify-between p-6 cursor-pointer select-none" onClick={onToggleOpen}>
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-6 rounded-full transition-colors ${isVisible ? 'bg-[#630100]' : 'bg-gray-200'}`}></div>
        <h3 className={`font-serif text-2xl transition-colors ${isOpen ? 'text-[#630100]' : 'text-[#332E2B]'}`}>{title}</h3>
      </div>
      <div className="flex items-center gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] uppercase font-bold tracking-widest ${isVisible ? 'text-gray-500' : 'text-gray-300'}`}>{isVisible ? visibleLabel : hiddenLabel}</span>
          <button disabled={!canEdit} onClick={onToggleVisibility} className={`w-11 h-6 rounded-full relative transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isVisible ? 'bg-green-500' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${isVisible ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {isOpen && (
      <div className="p-8 border-t border-gray-50 bg-[#FDFBF7] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className={!canEdit ? 'opacity-70 pointer-events-none' : ''}>
          {children}
        </div>
      </div>
    )}
  </div>
);

export default function ContentModule({ formData, setFormData, handleSaveDesign, saving, canEdit, dict }: ContentModuleProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>('hero');
  const [isMounted, setIsMounted] = useState(false);

  const dbContent = formData?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

  const s = dict.sections;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !canEdit) return;
    const timer = setTimeout(() => { handleSaveDesign(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const toggleVisibility = (key: string) => {
    if (!canEdit) return;
    setFormData({ ...formData, content: { ...dbContent, sections_visibility: { ...visibility, [key]: visibility[key] === false } } });
  };

  const handleTextChange = (section: string, field: string, value: any) => {
    if (!canEdit) return;
    setFormData({ ...formData, content: { ...dbContent, content: { ...content, [section]: { ...content[section], [field]: value } } } });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string, galleryIndex?: number) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadId = galleryIndex !== undefined ? `gallery-${galleryIndex}` : section;
    setUploading(uploadId);
    const fileName = `${uploadId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('invites').upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      if (galleryIndex !== undefined) {
        const newUrls = [...(content.gallery?.images_urls || ["", "", "", "", ""])];
        newUrls[galleryIndex] = publicUrl;
        handleTextChange('gallery', 'images_urls', newUrls);
      } else { handleTextChange(section, field, publicUrl); }
    }
    setUploading(null);
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-[#630100] text-sm text-[#332E2B] font-semibold px-0 py-3 transition-colors placeholder-gray-300";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block";

  const accordionProps = (id: string, title: string) => ({
    title,
    isOpen: openSection === id,
    isVisible: visibility[id] !== false,
    onToggleOpen: () => setOpenSection(openSection === id ? null : id),
    onToggleVisibility: () => toggleVisibility(id),
    canEdit,
    visibleLabel: dict.toggle.visible,
    hiddenLabel: dict.toggle.hidden,
  });

  return (
    <div className="pb-40 text-left animate-in fade-in duration-700 max-w-4xl mx-auto pt-6 font-montserrat">
      <div className="space-y-2">

        {/* 01. HERO */}
        <AccordionItem {...accordionProps('hero', s.hero.title)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className={labelClass}>{s.hero.subtitleLabel}</label>
              <input className={inputClass} value={content.hero?.text_above_names ?? ''} onChange={e => handleTextChange('hero', 'text_above_names', e.target.value)} placeholder="Ex: THE WEDDING OF" />
            </div>
            <div>
              <label className={labelClass}>{s.hero.mediaLabel}</label>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm group mt-2">
                {content.hero?.main_image_url ? (
                  <>
                    {content.hero.main_image_url.includes('.mp4') ? (
                      <video src={content.hero.main_image_url} className="w-full h-full object-cover" muted loop autoPlay />
                    ) : (
                      <img src={content.hero.main_image_url} className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => handleTextChange('hero', 'main_image_url', '')} className="absolute top-3 right-3 bg-red-500/90 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg hover:scale-110 transition-transform z-10">✕</button>
                  </>
                ) : <div className="h-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest bg-gray-50">{s.hero.noFile}</div>}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold tracking-widest uppercase transition-all backdrop-blur-sm">
                  {uploading === 'hero' ? s.hero.uploading : s.hero.changeMedia}
                  <input type="file" className="hidden" onChange={e => handleUpload(e, 'hero', 'main_image_url')} />
                </label>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 02. COUNTDOWN */}
        <AccordionItem {...accordionProps('countdown', s.countdown.title)}>
          <div>
            <label className={labelClass}>{s.countdown.mainTitleLabel}</label>
            <input className={inputClass} value={content.countdown?.title ?? ''} onChange={e => handleTextChange('countdown', 'title', e.target.value)} placeholder='Ex: O dia do "Sim" aproxima-se...' />
          </div>
        </AccordionItem>

        {/* 03. STORY */}
        <AccordionItem {...accordionProps('story', s.story.title)}>
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>{s.story.subtitleLabel}</label>
                <input className={inputClass} value={content.story?.title_our ?? ''} onChange={e => handleTextChange('story', 'title_our', e.target.value)} placeholder="Ex: A Nossa" />
                <label className={`${labelClass} mt-8`}>{s.story.mainTitleLabel}</label>
                <input className={inputClass} value={content.story?.title_history ?? ''} onChange={e => handleTextChange('story', 'title_history', e.target.value)} placeholder="Ex: História" />
              </div>
              <div className="flex flex-col items-start md:items-center">
                <label className={labelClass}>{s.story.photoLabel}</label>
                <div className="relative w-32 h-44 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm group mt-3">
                  {content.story?.story_image_url ? <img src={content.story.story_image_url} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-300 tracking-widest bg-gray-50">{s.story.photoEmpty}</div>}
                  <label className="absolute inset-0 bg-[#630100]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold tracking-widest transition-all">
                    <input type="file" className="hidden" onChange={e => handleUpload(e, 'story', 'story_image_url')} /> {uploading === 'story' ? '...' : s.story.photoUpload}
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <label className={labelClass}>{s.story.textsLabel}</label>
              {[0, 1, 2].map(idx => (
                <textarea key={idx} className={`${inputClass} resize-none bg-white p-4 rounded-xl border border-gray-100 shadow-sm focus:border-[#630100]`} rows={3} value={content.story?.paragraphs?.[idx] ?? ''} placeholder={`${s.story.paragraphPrefix} ${idx + 1}`}
                  onChange={e => {
                    const newP = [...(content.story?.paragraphs || ["", "", ""])];
                    newP[idx] = e.target.value;
                    handleTextChange('story', 'paragraphs', newP);
                  }}
                />
              ))}
            </div>
          </div>
        </AccordionItem>

        {/* 04. GALLERY */}
        <AccordionItem {...accordionProps('gallery', s.gallery.title)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div><label className={labelClass}>{s.gallery.subtitleLabel}</label><input className={inputClass} value={content.gallery?.title_our ?? ''} onChange={e => handleTextChange('gallery', 'title_our', e.target.value)} /></div>
            <div><label className={labelClass}>{s.gallery.mainTitleLabel}</label><input className={inputClass} value={content.gallery?.title_gallery ?? ''} onChange={e => handleTextChange('gallery', 'title_gallery', e.target.value)} /></div>
          </div>
          <label className={labelClass}>{s.gallery.photosLabel}</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
            {[0,1,2,3,4].map(idx => (
              <div key={idx} className="relative aspect-[3/4] bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group hover:border-[#630100]/30 transition-colors">
                {content.gallery?.images_urls?.[idx] ? (
                  <>
                    <img src={content.gallery.images_urls[idx]} className="w-full h-full object-cover" />
                    <button onClick={(e) => {
                      e.preventDefault();
                      const newUrls = [...(content.gallery?.images_urls || ["", "", "", "", ""])];
                      newUrls[idx] = '';
                      handleTextChange('gallery', 'images_urls', newUrls);
                    }} className="absolute top-2 right-2 bg-red-500/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:scale-110">✕</button>
                  </>
                ) : <div className="h-full flex flex-col items-center justify-center text-gray-300"><span className="text-3xl font-light">+</span></div>}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white transition-all text-[9px] font-bold tracking-widest backdrop-blur-[2px]">
                  <input type="file" className="hidden" onChange={e => handleUpload(e, 'gallery', 'images_urls', idx)} />
                  {uploading === `gallery-${idx}` ? '...' : 'ADD'}
                </label>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* 05. PROGRAM */}
        <AccordionItem {...accordionProps('program', s.program.title)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div><label className={labelClass}>{s.program.subtitleLabel}</label><input className={inputClass} value={content.program?.title_our ?? ''} onChange={e => handleTextChange('program', 'title_our', e.target.value)} /></div>
            <div><label className={labelClass}>{s.program.mainTitleLabel}</label><input className={inputClass} value={content.program?.title_program ?? ''} onChange={e => handleTextChange('program', 'title_program', e.target.value)} /></div>
          </div>
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
            <label className={labelClass}>{s.program.eventsLabel}</label>
            <button onClick={() => {
              const newEvs = [...(content.program?.events || []), { time: "00:00", title: s.program.newEventDefault }];
              handleTextChange('program', 'events', newEvs);
            }} className="text-[10px] font-bold text-[#630100] uppercase tracking-widest flex items-center gap-1 bg-[#630100]/5 px-3 py-1.5 rounded-full hover:bg-[#630100]/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {s.program.addBtn}
            </button>
          </div>
          <div className="space-y-3">
            {(content.program?.events || []).map((ev: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-[#630100]/20 transition-colors">
                <input className="w-24 bg-[#FDFBF7] border border-gray-200 focus:border-[#630100] rounded-xl px-3 py-2.5 font-bold text-[#630100] text-sm text-center outline-none transition-colors" value={ev.time} onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].time = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <input className="flex-grow bg-transparent border-none text-[15px] font-semibold text-[#332E2B] focus:ring-0 px-2" value={ev.title} onChange={e => {
                  const newEvs = [...content.program.events]; newEvs[idx].title = e.target.value; handleTextChange('program', 'events', newEvs);
                }} />
                <button onClick={() => {
                  const newEvs = content.program.events.filter((_: any, i: number) => i !== idx); handleTextChange('program', 'events', newEvs);
                }} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* 06. LOCAIS */}
        <AccordionItem {...accordionProps('event', s.event.title)}>
          <div className="space-y-10">
            <div>
              <label className={labelClass}>{s.event.sectionTitleLabel}</label>
              <input className={inputClass} value={content.event?.title_main ?? ''} onChange={e => handleTextChange('event', 'title_main', e.target.value)} />
            </div>

            {/* Cerimónia */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.event.ceremonyTitle}</h4>
                <button onClick={() => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, active: !(content.event?.ceremony?.active !== false) })} className={`w-10 h-5 rounded-full relative transition-colors ${content.event?.ceremony?.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.event?.ceremony?.active !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${content.event?.ceremony?.active === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.event.titleLabel}</label><input className={inputClass} value={content.event?.ceremony?.title ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, title: e.target.value })} /></div>
                <div><label className={labelClass}>{s.event.timeLabel}</label><input className={inputClass} value={content.event?.ceremony?.time ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, time: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelClass}>{s.event.locationLabel}</label><input className={inputClass} value={content.event?.ceremony?.location ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, location: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <label className={labelClass}>{s.event.mapsLabel}</label>
                  <input className={inputClass} value={content.event?.ceremony?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'ceremony', { ...content.event?.ceremony, google_maps_url: e.target.value })}
                    onBlur={e => { let val = e.target.value.trim(); if (val && !/^https?:\/\//i.test(val)) handleTextChange('event', 'ceremony', { ...content.event?.ceremony, google_maps_url: `https://${val}` }); }}
                    placeholder={s.event.mapsPlaceholder} />
                </div>
              </div>
            </div>

            {/* Receção */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.event.receptionTitle}</h4>
                <button onClick={() => handleTextChange('event', 'reception', { ...content.event?.reception, active: !(content.event?.reception?.active !== false) })} className={`w-10 h-5 rounded-full relative transition-colors ${content.event?.reception?.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.event?.reception?.active !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${content.event?.reception?.active === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.event.titleLabel}</label><input className={inputClass} value={content.event?.reception?.title ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, title: e.target.value })} /></div>
                <div><label className={labelClass}>{s.event.timeLabel}</label><input className={inputClass} value={content.event?.reception?.time ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, time: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelClass}>{s.event.locationLabel}</label><input className={inputClass} value={content.event?.reception?.location ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, location: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <label className={labelClass}>{s.event.mapsLabel}</label>
                  <input className={inputClass} value={content.event?.reception?.google_maps_url ?? ''} onChange={e => handleTextChange('event', 'reception', { ...content.event?.reception, google_maps_url: e.target.value })}
                    onBlur={e => { let val = e.target.value.trim(); if (val && !/^https?:\/\//i.test(val)) handleTextChange('event', 'reception', { ...content.event?.reception, google_maps_url: `https://${val}` }); }}
                    placeholder={s.event.mapsPlaceholder} />
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 07. DETALHES */}
        <AccordionItem {...accordionProps('details_section', s.details.title)}>
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><label className={labelClass}>{s.details.subtitleLabel}</label><input className={inputClass} value={content.details?.title_the ?? ''} onChange={e => handleTextChange('details', 'title_the', e.target.value)} /></div>
              <div><label className={labelClass}>{s.details.mainTitleLabel}</label><input className={inputClass} value={content.details?.title_details ?? ''} onChange={e => handleTextChange('details', 'title_details', e.target.value)} /></div>
            </div>

            {/* Logística */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.details.logistics.title}</h4>
                <button onClick={() => toggleVisibility('useful_info')} className={`w-10 h-5 rounded-full relative transition-colors ${visibility['useful_info'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${visibility['useful_info'] !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`space-y-8 ${visibility['useful_info'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.details.logistics.titleLabel}</label><input className={inputClass} value={content.details?.parking_title ?? ''} onChange={e => handleTextChange('details', 'parking_title', e.target.value)} /></div>
                <div><label className={labelClass}>{s.details.logistics.infoLabel}</label><textarea className={`${inputClass} resize-none bg-[#FDFBF7] p-4 rounded-xl border border-gray-100 mt-2`} rows={4} value={content.details?.parking_text ?? ''} onChange={e => handleTextChange('details', 'parking_text', e.target.value)} /></div>
              </div>
            </div>

            {/* Alojamento */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.details.accommodation.title}</h4>
                <button onClick={() => toggleVisibility('accommodation')} className={`w-10 h-5 rounded-full relative transition-colors ${visibility['accommodation'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${visibility['accommodation'] !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`space-y-8 ${visibility['accommodation'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.details.accommodation.titleLabel}</label><input className={inputClass} value={content.details?.accommodation_title ?? ''} onChange={e => handleTextChange('details', 'accommodation_title', e.target.value)} /></div>
                <div><label className={labelClass}>{s.details.accommodation.infoLabel}</label><textarea className={`${inputClass} resize-none bg-[#FDFBF7] p-4 rounded-xl border border-gray-100 mt-2`} rows={2} value={content.details?.accommodation_text ?? ''} onChange={e => handleTextChange('details', 'accommodation_text', e.target.value)} /></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className={labelClass}>{s.details.accommodation.hotelsLabel}</label>
                    <button onClick={() => {
                      const newBtns = [...(content.details?.accommodation_buttons || []), { text: s.details.accommodation.hotelNamePlaceholder, url: "" }];
                      handleTextChange('details', 'accommodation_buttons', newBtns);
                    }} className="text-[10px] font-bold text-[#630100] uppercase tracking-widest flex items-center gap-1 bg-[#630100]/5 px-3 py-1.5 rounded-full hover:bg-[#630100]/10 transition-colors">
                      {s.details.accommodation.addBtn}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(content.details?.accommodation_buttons || []).map((btn: any, i: number) => (
                      <div key={i} className="flex gap-4 items-center bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 focus-within:border-[#630100]/50 transition-colors group">
                        <input className="w-1/3 bg-transparent border-none text-[13px] font-bold text-[#332E2B] focus:ring-0" value={btn.text} onChange={e => {
                          const newB = [...content.details.accommodation_buttons]; newB[i].text = e.target.value; handleTextChange('details', 'accommodation_buttons', newB);
                        }} placeholder={s.details.accommodation.hotelNamePlaceholder} />
                        <div className="w-[1px] h-6 bg-gray-300"></div>
                        <input className="flex-1 bg-transparent border-none text-[13px] font-medium text-gray-500 focus:ring-0" value={btn.url}
                          onChange={e => { const newB = [...content.details.accommodation_buttons]; newB[i].url = e.target.value; handleTextChange('details', 'accommodation_buttons', newB); }}
                          onBlur={e => { let val = e.target.value.trim(); if (val && !/^https?:\/\//i.test(val)) { const newB = [...content.details.accommodation_buttons]; newB[i].url = `https://${val}`; handleTextChange('details', 'accommodation_buttons', newB); } }}
                          placeholder="https://..." />
                        <button onClick={() => {
                          const newB = content.details.accommodation_buttons.filter((_: any, idx: number) => idx !== i);
                          handleTextChange('details', 'accommodation_buttons', newB);
                        }} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dress Code */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.details.dresscode.title}</h4>
                <button onClick={() => toggleVisibility('dress_code')} className={`w-10 h-5 rounded-full relative transition-colors ${visibility['dress_code'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${visibility['dress_code'] !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`space-y-8 ${visibility['dress_code'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.details.dresscode.titleLabel}</label><input className={inputClass} value={content.dress_code?.title ?? ''} onChange={e => handleTextChange('dress_code', 'title', e.target.value)} /></div>
                <div><label className={labelClass}>{s.details.dresscode.messageLabel}</label><textarea className={`${inputClass} resize-none bg-[#FDFBF7] p-4 rounded-xl border border-gray-100 mt-2`} rows={3} value={content.dress_code?.text?.[0] ?? ''} onChange={e => handleTextChange('dress_code', 'text', [e.target.value])} /></div>
                <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <label className={labelClass}>{s.details.dresscode.paletteLabel}</label>
                    <button onClick={() => handleTextChange('dress_code', 'show_palette', !(content.dress_code?.show_palette !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.dress_code?.show_palette !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.dress_code?.show_palette !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                  <div className={`flex flex-wrap gap-4 ${content.dress_code?.show_palette === false ? 'opacity-30 pointer-events-none' : ''}`}>
                    {(content.dress_code?.colors || []).map((color: string, idx: number) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-full overflow-hidden shadow-sm border-2 border-white ring-1 ring-gray-200 hover:scale-110 transition-transform">
                        <input type="color" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 cursor-pointer border-none p-0 outline-none" value={color} onChange={e => {
                          const newC = [...content.dress_code.colors]; newC[idx] = e.target.value; handleTextChange('dress_code', 'colors', newC);
                        }} />
                        <button onClick={() => {
                          const newC = content.dress_code.colors.filter((_: any, i: number) => i !== idx); handleTextChange('dress_code', 'colors', newC);
                        }} className="absolute top-1 right-1 bg-white text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newC = [...(content.dress_code?.colors || []), "#000000"]; handleTextChange('dress_code', 'colors', newC);
                    }} className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-[#630100] hover:border-[#630100] transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Presentes */}
            <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h4 className="font-serif text-[#630100] text-2xl">{s.details.gifts.title}</h4>
                <button onClick={() => toggleVisibility('gifts')} className={`w-10 h-5 rounded-full relative transition-colors ${visibility['gifts'] !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${visibility['gifts'] !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className={`space-y-8 ${visibility['gifts'] === false ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className={labelClass}>{s.details.gifts.titleLabel}</label><input className={inputClass} value={content.gifts?.title ?? ''} onChange={e => handleTextChange('gifts', 'title', e.target.value)} /></div>
                <div><label className={labelClass}>{s.details.gifts.messageLabel}</label><textarea className={`${inputClass} resize-none bg-[#FDFBF7] p-4 rounded-xl border border-gray-100 mt-2`} rows={3} value={content.gifts?.text ?? ''} onChange={e => handleTextChange('gifts', 'text', e.target.value)} /></div>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6 bg-[#FDFBF7] p-4 rounded-2xl border border-gray-100">
                    <label className={`${labelClass} mb-0`}>{s.details.gifts.ibanToggleLabel}</label>
                    <button onClick={() => handleTextChange('gifts', 'show_iban', !(content.gifts?.show_iban !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.gifts?.show_iban !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.gifts?.show_iban !== false ? 'left-5.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                  <div className={`grid grid-cols-1 gap-6 bg-[#FDFBF7] p-6 rounded-2xl border border-[#630100]/10 ${content.gifts?.show_iban === false ? 'hidden' : ''}`}>
                    <div><label className={labelClass}>{s.details.gifts.ibanBtnLabel}</label><input className={inputClass} value={content.gifts?.iban_button_text ?? ''} onChange={e => handleTextChange('gifts', 'iban_button_text', e.target.value)} placeholder={s.details.gifts.ibanBtnPlaceholder} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className={labelClass}>{s.details.gifts.ibanHoldersLabel}</label><input className={inputClass} value={content.gifts?.iban_holders_name ?? ''} onChange={e => handleTextChange('gifts', 'iban_holders_name', e.target.value)} /></div>
                      <div><label className={labelClass}>{s.details.gifts.ibanValueLabel}</label><input className={inputClass} value={content.gifts?.iban_value ?? ''} onChange={e => handleTextChange('gifts', 'iban_value', e.target.value)} placeholder={s.details.gifts.ibanValuePlaceholder} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 08. RSVP */}
        <AccordionItem {...accordionProps('rsvp', s.rsvp.title)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div><label className={labelClass}>{s.rsvp.subtitleLabel}</label><input className={inputClass} value={content.rsvp?.title_please ?? ''} onChange={e => handleTextChange('rsvp', 'title_please', e.target.value)} /></div>
            <div><label className={labelClass}>{s.rsvp.mainTitleLabel}</label><input className={inputClass} value={content.rsvp?.title_confirm ?? ''} onChange={e => handleTextChange('rsvp', 'title_confirm', e.target.value)} /></div>
            <div><label className={labelClass}>{s.rsvp.deadlineLabel}</label><input className={inputClass} value={content.rsvp?.text_limit_date_fixed ?? ''} onChange={e => handleTextChange('rsvp', 'text_limit_date_fixed', e.target.value)} placeholder={s.rsvp.deadlinePlaceholder} /></div>
          </div>
        </AccordionItem>

        {/* 09. FOOTER */}
        <AccordionItem {...accordionProps('footer', s.footer.title)}>
          <div className="space-y-8">
            <div className="flex justify-between items-center pb-6 border-b border-gray-100">
              <label className={labelClass}>{s.footer.showContactsLabel}</label>
              <button onClick={() => handleTextChange('footer', 'show_contacts', !(content.footer?.show_contacts !== false))} className={`w-10 h-5 rounded-full relative transition-colors ${content.footer?.show_contacts !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${content.footer?.show_contacts !== false ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FDFBF7] p-6 rounded-3xl border border-gray-100 ${content.footer?.show_contacts === false ? 'hidden' : ''}`}>
              <div>
                <label className={labelClass}>{s.footer.contact1NameLabel}</label>
                <input className={inputClass} value={content.footer?.contact_1_name ?? ''} onChange={e => handleTextChange('footer', 'contact_1_name', e.target.value)} placeholder={s.footer.contact1NamePlaceholder} />
                <label className={`${labelClass} mt-6`}>{s.footer.contact1PhoneLabel}</label>
                <input className={inputClass} value={content.footer?.contact_1_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_1_phone', e.target.value)} placeholder={s.footer.contact1PhonePlaceholder} />
              </div>
              <div>
                <label className={labelClass}>{s.footer.contact2NameLabel}</label>
                <input className={inputClass} value={content.footer?.contact_2_name ?? ''} onChange={e => handleTextChange('footer', 'contact_2_name', e.target.value)} placeholder={s.footer.contact2NamePlaceholder} />
                <label className={`${labelClass} mt-6`}>{s.footer.contact2PhoneLabel}</label>
                <input className={inputClass} value={content.footer?.contact_2_phone ?? ''} onChange={e => handleTextChange('footer', 'contact_2_phone', e.target.value)} placeholder={s.footer.contact2PhonePlaceholder} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
              <div className="space-y-6">
                <div><label className={labelClass}>{s.footer.subtitleLabel}</label><input className={inputClass} value={content.footer?.title_main ?? ''} onChange={e => handleTextChange('footer', 'title_main', e.target.value)} /></div>
                <div><label className={labelClass}>{s.footer.mainTitleLabel}</label><input className={inputClass} value={content.footer?.title_celebrate ?? ''} onChange={e => handleTextChange('footer', 'title_celebrate', e.target.value)} /></div>
                <div><label className={labelClass}>{s.footer.locationLabel}</label><input className={inputClass} value={content.footer?.location_text ?? ''} onChange={e => handleTextChange('footer', 'location_text', e.target.value)} placeholder={s.footer.locationPlaceholder} /></div>
              </div>
              <div>
                <label className={labelClass}>{s.footer.photoLabel}</label>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm group mt-2">
                  {content.footer?.footer_image_url ? (
                    <>
                      <img src={content.footer.footer_image_url} className="w-full h-full object-cover" />
                      <button onClick={() => handleTextChange('footer', 'footer_image_url', '')} className="absolute top-3 right-3 bg-red-500/90 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg hover:scale-110 transition-transform z-10">✕</button>
                    </>
                  ) : <div className="h-full flex items-center justify-center text-gray-300 text-[10px] uppercase font-bold tracking-widest bg-gray-50">{s.footer.photoEmpty}</div>}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[10px] font-bold transition-all tracking-widest uppercase backdrop-blur-sm">
                    <input type="file" className="hidden" onChange={e => handleUpload(e, 'footer', 'footer_image_url')} /> {uploading === 'footer' ? '...' : s.footer.changePhoto}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

      </div>
    </div>
  );
}
