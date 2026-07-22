"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

// Modelo "Clássico" — minimalista, centrado, divisores em losango.
// Inspirado num template que desenvolvemos noutro projeto (Amazing Moon),
// reconstruído aqui em cima do nosso próprio esquema de dados.

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";
const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";

const T = {
  bg: "#FDFBF7", heading: "#332E2B", text: "#4A4038", muted: "#8C7B6B",
  faint: "#C9BCA9", accent: "#B8945A", surface: "#F4EFE6", border: "#3e3226",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-10 md:mb-14">
      <div className="flex items-center gap-3 justify-center max-w-[220px] mx-auto mb-6">
        <div className="flex-1 h-px" style={{ background: `${T.accent}55` }} />
        <div className="w-1.5 h-1.5 rotate-45" style={{ background: T.accent }} />
        <div className="flex-1 h-px" style={{ background: `${T.accent}55` }} />
      </div>
      <h2 className="font-serif text-[28px] md:text-[40px] italic font-light" style={{ color: T.heading }}>
        {children}
      </h2>
    </div>
  );
}

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
          <p className="text-3xl md:text-4xl font-light font-serif" style={{ color: T.heading }}>{String(v).padStart(2, "0")}</p>
          <p className="text-[10px] tracking-[0.25em] uppercase mt-0.5" style={{ color: T.muted }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export default function ClassicTemplate({ data }: { data: any; params?: any }) {
  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

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
  const storyImg = content.story?.story_image_url || "";

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

  const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8 } };

  return (
    <div className="w-full font-sans" style={{ background: T.bg }}>

      {/* HERO */}
      {visibility.hero !== false && (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${T.bg}8c, ${T.bg}59, ${T.bg})` }} />
          </div>
          <div className="relative text-center z-10 max-w-xl mx-auto md:max-w-2xl">
            <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6" style={{ color: T.muted }}>
              {content.hero?.text_above_names ?? "Convidam-vos para celebrar"}
            </p>
            <h1 className="font-serif text-6xl md:text-8xl italic font-light leading-none mb-2" style={{ color: T.heading }}>{groom}</h1>
            <p className="text-2xl md:text-3xl my-2" style={{ color: T.accent }}>&amp;</p>
            <h1 className="font-serif text-6xl md:text-8xl italic font-light leading-none mb-8" style={{ color: T.heading }}>{bride}</h1>
            {eventDate && (
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px w-8" style={{ background: T.accent }} />
                <p className="text-[11px] md:text-sm tracking-[0.3em] uppercase" style={{ color: T.muted }}>{formattedDate}</p>
                <div className="h-px w-8" style={{ background: T.accent }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* COUNTDOWN */}
      {visibility.countdown !== false && (
        <section className="px-6 py-16 text-center" style={{ background: T.surface }}>
          <p className="font-serif italic text-xl md:text-2xl" style={{ color: T.heading }}>
            {content.countdown?.title ?? "O dia do “Sim” aproxima-se..."}
          </p>
          <Countdown date={eventDate} />
        </section>
      )}

      {/* HISTÓRIA */}
      {visibility.story !== false && (
        <section className="px-6 py-20">
          <div className="max-w-lg mx-auto md:max-w-2xl">
            <SectionTitle>
              {(content.story?.title_our ?? "A Nossa")} {(content.story?.title_history ?? "História")}
            </SectionTitle>
            {storyImg && (
              <motion.div {...fadeUp} className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden mx-auto mb-10 border-4" style={{ borderColor: "#fff" }}>
                <img src={storyImg} alt="" className="w-full h-full object-cover" />
              </motion.div>
            )}
            {storyParagraphs.length > 0 ? (
              <div className="space-y-6">
                {storyParagraphs.map((p, i) => (
                  <p key={i} className="font-serif text-xl md:text-2xl italic leading-relaxed font-light text-center" style={{ color: T.text }}>
                    &ldquo;{p}&rdquo;
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* CERIMÓNIA & RECEÇÃO */}
      {visibility.event !== false && (ceremonyActive || receptionActive) && (
        <section className="px-6 py-20" style={{ background: T.surface }}>
          <div className="max-w-lg mx-auto md:max-w-2xl">
            <SectionTitle>{content.event?.title_main ?? "O Grande Dia"}</SectionTitle>
            {showBothDetails && (
              <div className="flex border mb-10" style={{ borderColor: `${T.border}22` }}>
                <button onClick={() => setDetailTab("ceremony")}
                  style={{ background: detailTab === "ceremony" ? `${T.accent}22` : "transparent", color: detailTab === "ceremony" ? T.heading : T.muted }}
                  className="flex-1 py-3 text-[10px] tracking-[0.3em] uppercase transition-colors">Cerimónia</button>
                <button onClick={() => setDetailTab("reception")}
                  style={{ background: detailTab === "reception" ? `${T.accent}22` : "transparent", color: detailTab === "reception" ? T.heading : T.muted }}
                  className="flex-1 py-3 text-[10px] tracking-[0.3em] uppercase transition-colors">Receção</button>
              </div>
            )}
            {([ceremonyActive && "ceremony", receptionActive && "reception"].filter(Boolean) as ("ceremony" | "reception")[]).map((tab) => {
              if (showBothDetails && tab !== detailTab) return null;
              const d = content.event?.[tab] || {};
              return (
                <div key={tab} className="text-center">
                  {!showBothDetails && <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.muted }}>{tab === "ceremony" ? "Cerimónia" : "Receção"}</p>}
                  <div className="space-y-3">
                    {d.title && <p className="font-serif text-2xl md:text-3xl italic font-light" style={{ color: T.heading }}>{d.title}</p>}
                    {d.location && <p className="text-[11px] md:text-xs tracking-wide" style={{ color: T.muted }}>{d.location}</p>}
                    {d.time && <p className="text-[11px] md:text-xs tracking-widest uppercase" style={{ color: T.accent }}>{d.time}</p>}
                    {d.google_maps_url && (
                      <a href={d.google_maps_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-4 text-[10px] tracking-[0.3em] uppercase border px-5 py-2.5 transition-colors hover:opacity-70"
                        style={{ borderColor: `${T.border}33`, color: T.text }}>Como chegar</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* GALERIA */}
      {visibility.gallery !== false && galleryImgs.length > 0 && (
        <section className="py-20">
          <div className="max-w-lg mx-auto md:max-w-2xl px-6 mb-8">
            <SectionTitle>{content.gallery?.title_gallery ?? "Galeria"}</SectionTitle>
          </div>
          <div className="max-w-2xl mx-auto w-full">
            <div className="grid grid-cols-2 gap-1.5 px-1.5">
              {galleryImgs.map((src, i) => (
                <div key={src + i} className={`overflow-hidden rounded-sm ${imgClass(i, galleryImgs.length)}`}>
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROGRAMA */}
      {visibility.program !== false && (
        <section className="px-6 py-20" style={{ background: T.surface }}>
          <div className="max-w-lg mx-auto md:max-w-2xl">
            <SectionTitle>{content.program?.title_program ?? "Programa do Dia"}</SectionTitle>
            <div>
              {programEvents.map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="w-px h-6 ml-[3px]" style={{ background: `${T.accent}55` }} />}
                  <div className="flex items-center gap-3">
                    <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: T.accent }} />
                    <span className="text-[11px] tracking-widest uppercase w-14 flex-shrink-0" style={{ color: T.accent }}>{item.time}</span>
                    <span className="font-serif italic" style={{ fontSize: "20px", lineHeight: "1", color: T.heading }}>{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DETALHES: INFO ÚTEIS / ALOJAMENTO / DRESS CODE / PRESENTES */}
      {showDetailsSection && (
        <section className="px-6 py-24">
          <div className="max-w-lg mx-auto md:max-w-2xl">
            <SectionTitle>{content.details?.title_details ?? "Detalhes"}</SectionTitle>

            {(showUsefulInfo || showAccommodation) && (
              <div className={`grid ${showUsefulInfo && showAccommodation ? "md:grid-cols-2" : ""} gap-12 mb-16 text-center`}>
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
                            className="inline-block text-[10px] tracking-[0.25em] uppercase border px-4 py-2 transition-colors hover:opacity-70"
                            style={{ borderColor: `${T.border}33`, color: T.accent }}>{b.text}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {visibility.dress_code !== false && (
              <div className="text-center mb-16 pt-16 border-t" style={{ borderColor: `${T.border}15` }}>
                <p className="font-serif text-2xl md:text-3xl italic font-light mb-6" style={{ color: T.heading }}>{content.dress_code?.title ?? "Dress Code"}</p>
                {content.dress_code?.show_palette !== false && (content.dress_code?.colors || []).length > 0 && (
                  <div className="flex justify-center gap-3 mb-6">
                    {content.dress_code.colors.map((c: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full shadow-md" style={{ background: c }} />
                    ))}
                  </div>
                )}
                {(content.dress_code?.text || []).map((t: string, i: number) => t && (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: T.text }}>{t}</p>
                ))}
              </div>
            )}

            {visibility.gifts !== false && (
              <div className="text-center pt-16 border-t" style={{ borderColor: `${T.border}15` }}>
                <p className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: T.accent }}>{content.gifts?.title ?? "Presentes"}</p>
                {content.gifts?.text && <p className="text-sm leading-relaxed mb-6" style={{ color: T.text }}>{content.gifts.text}</p>}
                {content.gifts?.show_iban !== false && content.gifts?.iban_value && (
                  showIban ? (
                    <div className="border p-5 text-center space-y-2 mt-4 max-w-xs mx-auto" style={{ borderColor: `${T.border}22` }}>
                      <p className="text-xs" style={{ color: T.muted }}>{content.gifts?.iban_holders_name || `${groom} & ${bride}`}</p>
                      <p className="font-mono text-sm tracking-wider" style={{ color: T.heading }}>{content.gifts.iban_value}</p>
                    </div>
                  ) : (
                    <button onClick={() => setShowIban(true)}
                      className="text-[10px] tracking-[0.3em] uppercase border px-6 py-3 transition-colors hover:opacity-70"
                      style={{ borderColor: `${T.border}33`, color: T.text }}>
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
          <SmartRsvp invitationId={data?.id || ""} />
        </div>
      )}

      {/* FOOTER */}
      {visibility.footer !== false && (
        <section className="relative px-6 py-28 overflow-hidden text-center" style={{ background: "#000" }}>
          <div className="absolute inset-0">
            <img src={footerImg} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.6))" }} />
          </div>
          <div className="relative max-w-lg mx-auto md:max-w-2xl">
            <div className="flex items-center gap-3 justify-center max-w-[180px] mx-auto mb-8">
              <div className="flex-1 h-px bg-white/30" />
              <div className="w-1.5 h-1.5 rotate-45 bg-white/70" />
              <div className="flex-1 h-px bg-white/30" />
            </div>
            <p className="text-sm tracking-[0.25em] uppercase text-white/70 mb-2">{content.footer?.title_main ?? "Mal podemos esperar para"}</p>
            <p className="font-serif italic text-3xl md:text-4xl text-white mb-8">{content.footer?.title_celebrate ?? "Celebrar convosco!"}</p>
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
