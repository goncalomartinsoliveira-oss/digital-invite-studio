"use client";
import { useState, useEffect } from "react";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

// Modelo "Romântico" (Arch) — claro e arejado, fotos em arco (topo
// arredondado), texto curvo no hero. Inspirado num template que
// desenvolvemos noutro projeto (Amazing Moon), reconstruído aqui em cima do
// nosso próprio esquema de dados.

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";
const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";

// Cores base do modelo — o casal pode substituir `accent` no painel
// (Design → Cor de Destaque); as restantes mantêm-se fixas para preservar a
// identidade do desenho.
const BASE_T = {
  bg: "#FDFBF7", heading: "#3E2E22", text: "#4A3F35", muted: "#8C7B6B",
  accent: "#B8945A", surface: "#F4EFE6", border: "#3e3226",
};

const ARCH_RADIUS = "999px 999px 18px 18px";

function ArchImage({ src, alt = "", className = "" }: { src: string; alt?: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ borderRadius: ARCH_RADIUS }}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

function CurvedText({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 280 150" className="w-64 h-auto mx-auto" aria-hidden>
      <path id="arch-curve" d="M 20,138 A 120,120 0 0 1 260,138" fill="none" />
      <text fill={BASE_T.heading} className="font-serif" fontSize="13.5" letterSpacing="2">
        <textPath href="#arch-curve" startOffset="50%" textAnchor="middle">{text.toUpperCase()}</textPath>
      </text>
    </svg>
  );
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
          <p className="text-3xl md:text-4xl font-light font-serif" style={{ color: BASE_T.heading }}>{String(v).padStart(2, "0")}</p>
          <p className="text-[10px] tracking-[0.25em] uppercase mt-0.5" style={{ color: BASE_T.muted }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export default function ArchTemplate({ data }: { data: any; params?: any }) {
  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};
  const T = { ...BASE_T, accent: dbContent.theme?.accent || BASE_T.accent };

  function Diamond({ className = "", size = 8 }: { className?: string; size?: number }) {
    return <span className={`inline-block rotate-45 align-middle ${className}`} style={{ width: size, height: size, border: `1px solid ${T.accent}` }} />;
  }

  function SectionHead({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
    return (
      <div className="text-center mb-12">
        <div className="mb-4"><Diamond /></div>
        {eyebrow && <p className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: T.muted }}>{eyebrow}</p>}
        <h2 className="font-serif text-[34px] md:text-[44px] italic font-light leading-tight" style={{ color: T.heading }}>
          {children}
        </h2>
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

  const wrap = "max-w-md mx-auto md:max-w-xl";

  return (
    <div className="w-full font-sans" style={{ background: T.bg }}>

      {/* HERO — texto em arco + foto em arco com nomes sobrepostos */}
      {visibility.hero !== false && (
        <section className="px-6 pt-16 pb-20">
          <div className="max-w-sm mx-auto md:max-w-md">
            <div className="mb-4">
              <CurvedText text={content.hero?.text_above_names ?? "Convidam-vos a celebrar"} />
            </div>
            <div className="relative">
              <div className="overflow-hidden" style={{ borderRadius: ARCH_RADIUS }}>
                <img src={heroImg} alt="" className="w-full h-[480px] md:h-[560px] object-cover" />
                <div className="absolute inset-0" style={{ borderRadius: ARCH_RADIUS, background: "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.12) 45%, transparent 70%)" }} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-7 text-center text-white">
                <p className="text-[10px] tracking-[0.35em] uppercase mb-3 text-white/70">Para celebrar o casamento de</p>
                <h1 className="font-serif text-5xl md:text-6xl italic font-light leading-none">
                  {groom}<span className="mx-2 not-italic" style={{ color: T.accent }}>&amp;</span>{bride}
                </h1>
                {eventDate && <p className="text-[11px] tracking-[0.3em] uppercase mt-4 text-white/80">{formattedDate}</p>}
              </div>
            </div>
            <Countdown date={eventDate} />
          </div>
        </section>
      )}

      {/* HISTÓRIA */}
      {visibility.story !== false && (
        <section className="px-6 py-20">
          <div className={wrap}>
            <SectionHead eyebrow="O início">
              {(content.story?.title_our ?? "A Nossa")} {(content.story?.title_history ?? "História")}
            </SectionHead>
            {content.story?.story_image_url && (
              <ArchImage src={content.story.story_image_url} className="w-full h-64 mb-8" />
            )}
            {storyParagraphs.length > 0 && (
              <div className="space-y-5">
                {storyParagraphs.map((p, i) => (
                  <p key={i} className="font-serif text-xl md:text-2xl italic leading-relaxed font-light text-center" style={{ color: T.text }}>
                    &ldquo;{p}&rdquo;
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* GALERIA — fotos em arco */}
      {visibility.gallery !== false && galleryImgs.length > 0 && (
        <section className="py-20">
          <div className={`${wrap} px-6 mb-10`}>
            <SectionHead eyebrow="Momentos">{(content.gallery?.title_our ?? "A Nossa")} {(content.gallery?.title_gallery ?? "Galeria")}</SectionHead>
          </div>
          <div className="max-w-xl mx-auto w-full px-3">
            <div className="grid grid-cols-2 gap-3">
              {galleryImgs.map((src, i) => (
                <ArchImage key={src + i} src={src} className={`w-full ${i % 3 === 0 ? "h-72" : "h-56"}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROGRAMA — linha vertical com losangos */}
      {visibility.program !== false && (
        <section className="px-6 py-20" style={{ background: T.surface }}>
          <div className={wrap}>
            <SectionHead eyebrow="A agenda">{(content.program?.title_our ?? "O Nosso")} {(content.program?.title_program ?? "Programa")}</SectionHead>
            <div className="max-w-sm mx-auto">
              {programEvents.map((item, i) => {
                const last = i === programEvents.length - 1;
                return (
                  <div key={i} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-px flex-1" style={{ background: `${T.accent}55`, visibility: i === 0 ? "hidden" : "visible" }} />
                      <span className="my-1.5"><Diamond size={7} /></span>
                      <div className="w-px flex-1" style={{ background: `${T.accent}55`, visibility: last ? "hidden" : "visible" }} />
                    </div>
                    <div className="pb-9 pt-1">
                      <p className="text-[11px] tracking-[0.25em] uppercase mb-1" style={{ color: T.accent }}>{item.time}</p>
                      <p className="font-serif text-2xl italic leading-tight" style={{ color: T.heading }}>{item.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CERIMÓNIA & RECEÇÃO */}
      {visibility.event !== false && (ceremonyActive || receptionActive) && (
        <section className="px-6 py-20" style={{ background: T.surface }}>
          <div className={wrap}>
            <SectionHead eyebrow="Onde &amp; quando">{content.event?.title_main ?? "O Grande Dia"}</SectionHead>
            {showBothDetails && (
              <div className="flex justify-center gap-8 mb-10">
                {(["ceremony", "reception"] as const).map((tab) => (
                  <button key={tab} onClick={() => setDetailTab(tab)}
                    className="text-[11px] tracking-[0.25em] uppercase pb-1 transition-colors"
                    style={{ color: detailTab === tab ? T.heading : T.muted, borderBottom: `1px solid ${detailTab === tab ? T.accent : "transparent"}` }}>
                    {tab === "ceremony" ? "Cerimónia" : "Receção"}
                  </button>
                ))}
              </div>
            )}
            {([ceremonyActive && "ceremony", receptionActive && "reception"].filter(Boolean) as ("ceremony" | "reception")[]).map((tab) => {
              if (showBothDetails && tab !== detailTab) return null;
              const d = content.event?.[tab] || {};
              return (
                <div key={tab} className="text-center max-w-xs mx-auto">
                  {!showBothDetails && <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{tab === "ceremony" ? "Cerimónia" : "Receção"}</p>}
                  <div className="space-y-2.5">
                    {d.title && <p className="font-serif text-2xl md:text-3xl italic font-light" style={{ color: T.heading }}>{d.title}</p>}
                    {d.location && <p className="text-[11px] md:text-xs tracking-wide" style={{ color: T.muted }}>{d.location}</p>}
                    {d.time && <p className="text-[11px] tracking-[0.25em] uppercase" style={{ color: T.accent }}>{d.time}</p>}
                    {d.google_maps_url && (
                      <a href={d.google_maps_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-4 text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 transition-colors hover:opacity-80"
                        style={{ border: `1px solid ${T.accent}`, borderRadius: "999px", color: T.heading }}>Como chegar</a>
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
        <section className="px-6 py-20">
          <div className={wrap}>
            <SectionHead eyebrow="Para ficar">{(content.details?.title_the ?? "Os")} {(content.details?.title_details ?? "Detalhes")}</SectionHead>

            {(showUsefulInfo || showAccommodation) && (
              <div className={`grid ${showUsefulInfo && showAccommodation ? "sm:grid-cols-2" : ""} gap-10 mb-14 text-center`}>
                {showUsefulInfo && (
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.details?.parking_title ?? "Informações Úteis"}</p>
                    {content.details?.parking_text && <p className="text-sm leading-relaxed" style={{ color: T.text }}>{content.details.parking_text}</p>}
                  </div>
                )}
                {showAccommodation && (
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.details?.accommodation_title ?? "Alojamento"}</p>
                    {content.details?.accommodation_text && <p className="text-sm leading-relaxed mb-5" style={{ color: T.text }}>{content.details.accommodation_text}</p>}
                    {(content.details?.accommodation_buttons || []).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3">
                        {content.details.accommodation_buttons.map((b: any, i: number) => (
                          <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                            className="inline-block text-[10px] tracking-[0.25em] uppercase px-4 py-2 transition-colors hover:opacity-80"
                            style={{ border: `1px solid ${T.accent}`, borderRadius: "999px", color: T.heading }}>{b.text}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {visibility.dress_code !== false && (
              <div className="text-center mb-14">
                <p className="font-serif text-2xl md:text-3xl italic font-light mb-6" style={{ color: T.heading }}>{content.dress_code?.title ?? "Dress Code"}</p>
                {content.dress_code?.show_palette !== false && (content.dress_code?.colors || []).length > 0 && (
                  <div className="flex justify-center gap-3 mb-6">
                    {content.dress_code.colors.map((c: string, i: number) => (
                      <div key={i} className="w-9 h-9 rounded-full shadow-md" style={{ background: c }} />
                    ))}
                  </div>
                )}
                {(content.dress_code?.text || []).map((t: string, i: number) => t && (
                  <p key={i} className="text-xl italic font-serif leading-relaxed font-light" style={{ color: T.text }}>{t}</p>
                ))}
              </div>
            )}

            {visibility.gifts !== false && (
              <div className="text-center">
                <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.gifts?.title ?? "Presentes"}</p>
                {content.gifts?.text && <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: T.text }}>{content.gifts.text}</p>}
                {content.gifts?.show_iban !== false && content.gifts?.iban_value && (
                  showIban ? (
                    <div className="border p-5 text-center space-y-2 mt-4 max-w-xs mx-auto rounded-2xl" style={{ borderColor: `${T.border}22` }}>
                      <p className="text-xs" style={{ color: T.muted }}>{content.gifts?.iban_holders_name || `${groom} & ${bride}`}</p>
                      <p className="font-mono text-sm tracking-wider" style={{ color: T.heading }}>{content.gifts.iban_value}</p>
                    </div>
                  ) : (
                    <button onClick={() => setShowIban(true)}
                      className="text-[10px] tracking-[0.3em] uppercase px-6 py-3 transition-colors hover:opacity-80"
                      style={{ border: `1px solid ${T.accent}`, borderRadius: "999px", color: T.heading }}>
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
          <div className="px-6 pt-20">
            <div className={wrap}>
              <SectionHead eyebrow="Contamos convosco">{(content.rsvp?.title_please ?? "Por favor")} {(content.rsvp?.title_confirm ?? "Confirmar Presença")}</SectionHead>
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
        <section className="relative px-6 py-24 overflow-hidden text-center" style={{ background: "#000" }}>
          <div className="absolute inset-0">
            <img src={footerImg} alt="" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.55))" }} />
          </div>
          <div className="relative max-w-md mx-auto md:max-w-xl">
            <div className="mb-6">
              <span className="inline-block rotate-45 align-middle" style={{ width: 8, height: 8, border: "1px solid rgba(255,255,255,0.85)" }} />
            </div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/70 mb-2">{content.footer?.title_main ?? "Mal podemos esperar para"}</p>
            <p className="font-serif italic text-3xl md:text-4xl text-white mb-6 font-light">{content.footer?.title_celebrate ?? "Celebrar convosco!"}</p>
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
