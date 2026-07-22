"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

// Modelo "Editorial" (Noir) — estética de revista, alto contraste, fundo
// escuro, títulos em maiúsculas com filete por baixo. Inspirado num template
// que desenvolvemos noutro projeto (Amazing Moon), reconstruído aqui em cima
// do nosso próprio esquema de dados.

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";
const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";

// Cores base do modelo — o casal pode substituir `accent` no painel
// (Design → Cor de Destaque); as restantes mantêm-se fixas para preservar a
// identidade do desenho.
const BASE_T = {
  bg: "#0f0e0d", heading: "#ffffff", text: "rgba(255,255,255,0.75)", muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.18)", accent: "#C6A467", surface: "rgba(255,255,255,0.035)", border: "rgba(255,255,255,0.14)",
};

function imgClass(i: number, total: number) {
  if (total === 1) return "col-span-2 h-80";
  if (total === 2) return "h-56";
  if (total === 3) return i === 0 ? "col-span-2 h-64" : "h-48";
  if (total === 4) return "h-48";
  return i === 0 ? "col-span-2 h-64" : "h-44";
}

function Countdown({ date }: { date: string }) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function calc() {
      const ms = new Date(date).getTime() - Date.now();
      if (ms <= 0) { setReady(false); return; }
      setReady(true);
      setDiff({
        days: Math.floor(ms / 86400000),
        hours: Math.floor((ms % 86400000) / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000),
      });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [date]);

  if (!ready) return null;
  return (
    <div className="flex justify-center gap-6 mt-8">
      {([["dias", diff.days], ["horas", diff.hours], ["min", diff.minutes], ["seg", diff.seconds]] as const).map(([l, v]) => (
        <div key={l} className="text-center">
          <p className="text-3xl md:text-4xl font-light" style={{ color: BASE_T.heading }}>{String(v).padStart(2, "0")}</p>
          <p className="text-[10px] tracking-[0.25em] uppercase mt-0.5" style={{ color: BASE_T.muted }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export default function Noir01Template({ data }: { data?: any; params?: any }) {
  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};
  const T = { ...BASE_T, accent: dbContent.theme?.accent || BASE_T.accent };

  function EditorialTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
    return (
      <div className="mb-12 text-center">
        {eyebrow && <p className="text-[10px] tracking-[0.5em] uppercase mb-4" style={{ color: T.accent }}>{eyebrow}</p>}
        <h2 className="font-serif text-3xl md:text-5xl uppercase tracking-[0.12em] font-light" style={{ color: T.heading }}>
          {children}
        </h2>
        <div className="h-px w-full mt-7" style={{ background: T.border }} />
      </div>
    );
  }

  const [detailTab, setDetailTab] = useState<"ceremony" | "reception">(
    content.event?.ceremony?.active !== false ? "ceremony" : "reception"
  );
  const [showIban, setShowIban] = useState(false);

  const bride = data?.bride_name || "Noiva";
  const groom = data?.groom_name || "Noivo";
  const eventDate = data?.event_date || new Date().toISOString();
  const formattedDate = new Date(eventDate).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  const heroImg = content.hero?.main_image_url || DEFAULT_HERO_IMAGE;
  const footerImg = content.footer?.footer_image_url || DEFAULT_FOOTER_IMAGE;

  const galleryImgs: string[] = (content.gallery?.images_urls || []).filter((u: string) => u && u.trim() !== "");
  const storyParagraphs: string[] = (content.story?.paragraphs || []).filter((p: string) => p && p.trim() !== "");
  const programEvents: { time: string; title: string }[] = content.program?.events?.length
    ? content.program.events
    : [
        { time: "13:30", title: "Cerimónia" },
        { time: "15:00", title: "Cocktail" },
        { time: "17:00", title: "Jantar" },
        { time: "21:00", title: "Baile" },
      ];

  const ceremonyActive = content.event?.ceremony?.active !== false;
  const receptionActive = content.event?.reception?.active !== false;
  const showBothDetails = ceremonyActive && receptionActive;

  const showUsefulInfo = visibility.useful_info !== false;
  const showAccommodation = visibility.accommodation !== false;
  const showDetailsSection = showUsefulInfo || showAccommodation || visibility.dress_code !== false || visibility.gifts !== false;

  const wrap = "max-w-xl mx-auto md:max-w-3xl";

  return (
    <div className="w-full font-sans" style={{ background: T.bg }}>

      {/* HERO — bloco editorial com moldura */}
      {visibility.hero !== false && (
        <section className="relative min-h-screen flex items-center justify-center px-5 py-16 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${T.bg}99, ${T.bg}73, ${T.bg})` }} />
          </div>
          <div className="relative z-10 w-full max-w-md md:max-w-lg text-center border px-8 py-12 md:py-16" style={{ borderColor: T.heading }}>
            <p className="text-[10px] tracking-[0.5em] uppercase mb-8" style={{ color: T.muted }}>
              {content.hero?.text_above_names ?? "O casamento de"}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl uppercase tracking-[0.1em] font-light leading-[1.05]" style={{ color: T.heading }}>{groom}</h1>
            <p className="my-3 text-sm tracking-[0.4em] uppercase" style={{ color: T.accent }}>e</p>
            <h1 className="font-serif text-5xl md:text-7xl uppercase tracking-[0.1em] font-light leading-[1.05] mb-8" style={{ color: T.heading }}>{bride}</h1>
            {eventDate && (
              <p className="text-[11px] md:text-xs tracking-[0.35em] uppercase pt-6 border-t inline-block" style={{ color: T.muted, borderColor: T.border }}>{formattedDate}</p>
            )}
            <Countdown date={eventDate} />
          </div>
        </section>
      )}

      {/* HISTÓRIA */}
      {visibility.story !== false && (
        <section className="px-6 py-24">
          <div className={wrap}>
            <EditorialTitle eyebrow="O início">
              {(content.story?.title_our ?? "A Nossa")} {(content.story?.title_history ?? "História")}
            </EditorialTitle>
            {content.story?.story_image_url && (
              <div className="w-full h-64 md:h-80 overflow-hidden mb-10">
                <img src={content.story.story_image_url} alt="" className="w-full h-full object-cover grayscale" />
              </div>
            )}
            {storyParagraphs.length > 0 && (
              <div className="space-y-6">
                {storyParagraphs.map((p, i) => (
                  <p key={i} className="text-base md:text-lg leading-[1.9] text-center max-w-2xl mx-auto" style={{ color: T.text }}>{p}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* GALERIA */}
      {visibility.gallery !== false && galleryImgs.length > 0 && (
        <section className="py-24">
          <div className={`${wrap} px-6 mb-10`}>
            <EditorialTitle eyebrow="Momentos">{(content.gallery?.title_our ?? "A Nossa")} {(content.gallery?.title_gallery ?? "Galeria")}</EditorialTitle>
          </div>
          <div className="max-w-3xl mx-auto w-full">
            <div className="grid grid-cols-2 gap-2 px-2">
              {galleryImgs.map((src, i) => (
                <div key={src + i} className={`overflow-hidden ${imgClass(i, galleryImgs.length)}`}>
                  <img src={src} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROGRAMA — grelha horizontal de horas */}
      {visibility.program !== false && (
        <section className="px-6 py-24" style={{ background: T.surface }}>
          <div className={wrap}>
            <EditorialTitle eyebrow="A agenda">{(content.program?.title_our ?? "O Nosso")} {(content.program?.title_program ?? "Programa")}</EditorialTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: T.border }}>
              {programEvents.map((item, i) => (
                <div key={i} className="px-4 py-7 text-center" style={{ background: T.bg }}>
                  <p className="text-lg tracking-[0.2em] mb-3" style={{ color: T.accent }}>{item.time}</p>
                  <p className="font-serif text-base uppercase tracking-[0.08em] leading-snug" style={{ color: T.heading }}>{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CERIMÓNIA & RECEÇÃO */}
      {visibility.event !== false && (ceremonyActive || receptionActive) && (
        <section className="px-6 py-24" style={{ background: T.surface }}>
          <div className={wrap}>
            <EditorialTitle eyebrow="Onde &amp; quando">{content.event?.title_main ?? "O Grande Dia"}</EditorialTitle>
            {showBothDetails && (
              <div className="flex justify-center gap-8 mb-12">
                {(["ceremony", "reception"] as const).map((tab) => (
                  <button key={tab} onClick={() => setDetailTab(tab)}
                    className="text-[11px] tracking-[0.3em] uppercase pb-1 border-b-2 transition-colors"
                    style={{ color: detailTab === tab ? T.heading : T.muted, borderColor: detailTab === tab ? T.accent : "transparent" }}>
                    {tab === "ceremony" ? "Cerimónia" : "Receção"}
                  </button>
                ))}
              </div>
            )}
            {([ceremonyActive && "ceremony", receptionActive && "reception"].filter(Boolean) as ("ceremony" | "reception")[]).map((tab) => {
              if (showBothDetails && tab !== detailTab) return null;
              const d = content.event?.[tab] || {};
              return (
                <div key={tab} className="border p-8 md:p-10 text-center" style={{ borderColor: T.border }}>
                  {!showBothDetails && <p className="text-[10px] tracking-[0.4em] uppercase mb-5" style={{ color: T.accent }}>{tab === "ceremony" ? "Cerimónia" : "Receção"}</p>}
                  <div className="space-y-3">
                    {d.title && <p className="font-serif text-2xl md:text-3xl uppercase tracking-[0.1em] font-light" style={{ color: T.heading }}>{d.title}</p>}
                    {d.location && <p className="text-xs tracking-wide" style={{ color: T.muted }}>{d.location}</p>}
                    {d.time && <p className="text-[11px] tracking-[0.3em] uppercase pt-1" style={{ color: T.accent }}>{d.time}</p>}
                    {d.google_maps_url && (
                      <a href={d.google_maps_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-5 text-[10px] tracking-[0.3em] uppercase border px-6 py-3 transition-colors hover:opacity-80"
                        style={{ borderColor: T.heading, color: T.heading }}>Como chegar</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DETALHES: INFO ÚTEIS / ALOJAMENTO / DRESS CODE / PRESENTES */}
      {showDetailsSection && (
        <section className="px-6 py-24">
          <div className={wrap}>
            <EditorialTitle eyebrow="Boa estadia">{(content.details?.title_the ?? "Os")} {(content.details?.title_details ?? "Detalhes")}</EditorialTitle>

            {(showUsefulInfo || showAccommodation) && (
              <div className={`grid ${showUsefulInfo && showAccommodation ? "sm:grid-cols-2" : ""} gap-4 mb-4`}>
                {showUsefulInfo && (
                  <div className="border p-7 text-center" style={{ borderColor: T.border }}>
                    <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.details?.parking_title ?? "Informações Úteis"}</p>
                    {content.details?.parking_text && <p className="text-sm leading-relaxed" style={{ color: T.text }}>{content.details.parking_text}</p>}
                  </div>
                )}
                {showAccommodation && (
                  <div className="border p-7 text-center" style={{ borderColor: T.border }}>
                    <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.details?.accommodation_title ?? "Alojamento"}</p>
                    {content.details?.accommodation_text && <p className="text-sm leading-relaxed mb-5" style={{ color: T.text }}>{content.details.accommodation_text}</p>}
                    {(content.details?.accommodation_buttons || []).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3">
                        {content.details.accommodation_buttons.map((b: any, i: number) => (
                          <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                            className="inline-block text-[10px] tracking-[0.25em] uppercase border px-4 py-2 transition-colors hover:opacity-80"
                            style={{ borderColor: T.heading, color: T.heading }}>{b.text}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {visibility.dress_code !== false && (
              <div className="text-center py-16 border-t" style={{ borderColor: T.border }}>
                <p className="font-serif text-2xl md:text-3xl uppercase tracking-[0.1em] font-light mb-6" style={{ color: T.heading }}>{content.dress_code?.title ?? "Dress Code"}</p>
                {content.dress_code?.show_palette !== false && (content.dress_code?.colors || []).length > 0 && (
                  <div className="flex justify-center gap-4 mb-6">
                    {content.dress_code.colors.map((c: string, i: number) => (
                      <div key={i} className="w-9 h-9 border" style={{ background: c, borderColor: T.border }} />
                    ))}
                  </div>
                )}
                {(content.dress_code?.text || []).map((t: string, i: number) => t && (
                  <p key={i} className="text-base leading-[1.9] max-w-xl mx-auto" style={{ color: T.text }}>{t}</p>
                ))}
              </div>
            )}

            {visibility.gifts !== false && (
              <div className="text-center py-16 border-t" style={{ borderColor: T.border }}>
                <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.gifts?.title ?? "Presentes"}</p>
                {content.gifts?.text && <p className="text-base leading-[1.9] max-w-xl mx-auto mb-6" style={{ color: T.text }}>{content.gifts.text}</p>}
                {content.gifts?.show_iban !== false && content.gifts?.iban_value && (
                  showIban ? (
                    <div className="border p-5 text-center space-y-2 mt-4 max-w-xs mx-auto" style={{ borderColor: T.border }}>
                      <p className="text-xs" style={{ color: T.muted }}>{content.gifts?.iban_holders_name || `${groom} & ${bride}`}</p>
                      <p className="font-mono text-sm tracking-wider" style={{ color: T.heading }}>{content.gifts.iban_value}</p>
                    </div>
                  ) : (
                    <button onClick={() => setShowIban(true)}
                      className="text-[10px] tracking-[0.3em] uppercase border px-6 py-3 transition-colors hover:opacity-80"
                      style={{ borderColor: T.heading, color: T.heading }}>
                      {content.gifts?.iban_button_text ?? "Ver IBAN"}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* RSVP */}
      {visibility.rsvp !== false && (
        <div style={{ background: T.surface }}>
          <div className="px-6 pt-24">
            <div className={wrap}>
              <EditorialTitle eyebrow="Contamos convosco">{(content.rsvp?.title_please ?? "Por favor")} {(content.rsvp?.title_confirm ?? "Confirmar Presença")}</EditorialTitle>
              {content.rsvp?.text_limit_date_fixed && (
                <p className="text-[10px] tracking-[0.2em] uppercase text-center -mt-8 mb-8" style={{ color: T.muted }}>
                  até {content.rsvp.text_limit_date_fixed}
                </p>
              )}
            </div>
          </div>
          <SmartRsvp invitationId={data?.id || ""} />
        </div>
      )}

      {/* FOOTER */}
      {visibility.footer !== false && (
        <section className="relative px-6 py-28 overflow-hidden text-center" style={{ background: "#000" }}>
          <div className="absolute inset-0">
            <img src={footerImg} alt="" className="w-full h-full object-cover grayscale opacity-60" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.65))" }} />
          </div>
          <div className="relative max-w-xl mx-auto md:max-w-2xl">
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/70 mb-2">{content.footer?.title_main ?? "Mal podemos esperar para"}</p>
            <p className="font-serif uppercase tracking-[0.1em] text-2xl md:text-3xl text-white mb-6 font-light">{content.footer?.title_celebrate ?? "Celebrar convosco!"}</p>
            {content.footer?.location_text && (
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-8">{content.footer.location_text}</p>
            )}
            {content.footer?.show_contacts !== false && (content.footer?.contact_1_phone || content.footer?.contact_2_phone) && (
              <div className="flex flex-wrap justify-center gap-x-7 gap-y-3">
                {content.footer?.contact_1_phone && (
                  <a href={`tel:${content.footer.contact_1_phone}`} className="text-[11px] tracking-wide text-white/70 hover:text-white transition-colors">
                    {content.footer?.contact_1_name || "Contacto 1"}
                  </a>
                )}
                {content.footer?.contact_2_phone && (
                  <a href={`tel:${content.footer.contact_2_phone}`} className="text-[11px] tracking-wide text-white/70 hover:text-white transition-colors">
                    {content.footer?.contact_2_name || "Contacto 2"}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
