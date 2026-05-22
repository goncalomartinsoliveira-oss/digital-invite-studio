"use client";
import { motion, type Variants } from "framer-motion";
import { Cormorant_Garamond, Cinzel, Great_Vibes } from "next/font/google";
import { useState, useEffect } from "react";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const DEFAULT_HERO_MEDIA =
  "https://anvqtinrmgkfjadsftlj.supabase.co/storage/v1/object/public/invites/wedding-dream.mp4";
const DEFAULT_FOOTER_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000";

// ── Decorative ornament ──────────────────────────────────────────────
const Ornament = ({ color = "#B8945A" }: { color?: string }) => (
  <div className="flex items-center justify-center gap-3 my-1">
    <div className="h-px w-12 opacity-40" style={{ backgroundColor: color }} />
    <svg width="8" height="8" viewBox="0 0 8 8" style={{ fill: color, opacity: 0.6 }}>
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
    <div className="h-px w-12 opacity-40" style={{ backgroundColor: color }} />
  </div>
);

// ── Section heading ──────────────────────────────────────────────────
const SectionTitle = ({
  label,
  title,
  light = false,
}: {
  label?: string;
  title: string;
  light?: boolean;
}) => (
  <div className="text-center mb-20 sm:mb-28">
    {label && (
      <p
        className={`${cinzel.className} text-[9px] tracking-[0.45em] uppercase mb-4`}
        style={{ color: "#B8945A" }}
      >
        {label}
      </p>
    )}
    <Ornament color={light ? "#B8945A" : "#2D4A3E"} />
    <h2
      className={`${cormorant.className} text-4xl sm:text-5xl md:text-6xl italic mt-6 leading-tight`}
      style={{ color: light ? "#F7F4EE" : "#2D4A3E" }}
    >
      {title}
    </h2>
  </div>
);

// ── Animation variants ───────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

// ════════════════════════════════════════════════════════════════════════
export default function Minimal01Template({
  data,
}: {
  data: any;
  params?: any;
}) {
  const dbContent = data?.content || {};
  const vis = dbContent.sections_visibility || {};
  const c = dbContent.content || {};

  const bride = data?.bride_name || "Sophia";
  const groom = data?.groom_name || "William";
  const coupleNames = `${bride} & ${groom}`;
  const eventDate = data?.event_date || new Date().toISOString();

  const heroMediaUrl =
    c.hero?.main_image_url?.trim() ||
    data?.main_image_url?.trim() ||
    DEFAULT_HERO_MEDIA;
  const isVideo = /\.(mp4|webm|ogg)/i.test(heroMediaUrl) || heroMediaUrl.includes("video");

  const footerImg = c.footer?.footer_image_url?.trim() || DEFAULT_FOOTER_IMAGE;
  const storyImg = c.story?.story_image_url?.trim() || null;

  const formattedDate = new Date(eventDate)
    .toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, " · ");
  const rsvpDeadline = c.rsvp?.text_limit_date_fixed ?? "15.10.26";

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: "00", hours: "00", minutes: "00", seconds: "00",
  });
  const [showIban, setShowIban] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const diff = +new Date(eventDate) - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / 86400000)).padStart(2, "0"),
          hours: String(Math.floor((diff / 3600000) % 24)).padStart(2, "0"),
          minutes: String(Math.floor((diff / 60000) % 60)).padStart(2, "0"),
          seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  const galleryUrls = (c.gallery?.images_urls || []).filter((u: string) => u?.trim());
  const hasGallery = galleryUrls.length > 0;
  const hasCeremony = c.event?.ceremony?.active !== false;
  const hasReception = c.event?.reception?.active !== false;
  const showEvent = vis.event !== false && (hasCeremony || hasReception);

  // ── Default program ────────────────────────────────────────────────
  const defaultProgram = [
    { time: "16:00", title: "Wedding Ceremony" },
    { time: "17:00", title: "Cocktail Hour" },
    { time: "19:00", title: "Dinner" },
    { time: "20:00", title: "Party" },
  ];

  return (
    <div className="w-full bg-[#F7F4EE] text-[#1A1A1A] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          01 · HERO
      ══════════════════════════════════════════════════ */}
      {vis.hero !== false && (
        <section className="relative h-screen min-h-[640px] flex flex-col items-center justify-center overflow-hidden bg-[#2D4A3E]">

          {/* Background media */}
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5 }}
          >
            {isVideo ? (
              <video key={heroMediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src={heroMediaUrl} type="video/mp4" />
              </video>
            ) : (
              <img src={heroMediaUrl} className="w-full h-full object-cover" alt="Wedding" />
            )}
            <div className="absolute inset-0 bg-[#2D4A3E]/55" />
          </motion.div>

          {/* Corner accents */}
          {["top-6 left-6 border-l border-t", "top-6 right-6 border-r border-t",
            "bottom-6 left-6 border-l border-b", "bottom-6 right-6 border-r border-b"]
            .map((cls, i) => (
              <div key={i} className={`absolute z-10 w-14 h-14 sm:w-20 sm:h-20 ${cls}`}
                style={{ borderColor: "rgba(184,148,90,0.45)" }} />
            ))}

          {/* Text */}
          <div className="relative z-10 text-center text-white px-6 flex flex-col items-center">
            <motion.p
              className={`${cinzel.className} text-[9px] sm:text-[10px] tracking-[0.5em] uppercase mb-10`}
              style={{ color: "#D4B07A" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4 }}
            >
              {c.hero?.text_above_names ?? "The Wedding of"}
            </motion.p>

            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.7 }}
            >
              <span className={`${greatVibes.className} text-7xl sm:text-8xl md:text-[7rem] leading-tight drop-shadow-lg`}>
                {bride}
              </span>
              <span
                className={`${cormorant.className} text-base sm:text-xl font-light tracking-[0.5em] my-3`}
                style={{ color: "#D4B07A" }}
              >
                &
              </span>
              <span className={`${greatVibes.className} text-7xl sm:text-8xl md:text-[7rem] leading-tight drop-shadow-lg`}>
                {groom}
              </span>
            </motion.div>

            <motion.div
              className="flex items-center gap-6 mt-10"
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.9, delay: 1.3 }}
            >
              <div className="h-px w-10 sm:w-16" style={{ backgroundColor: "rgba(212,176,122,0.5)" }} />
              <p className={`${cinzel.className} text-xs sm:text-sm tracking-[0.35em]`} style={{ color: "#EDE0C8" }}>
                {formattedDate}
              </p>
              <div className="h-px w-10 sm:w-16" style={{ backgroundColor: "rgba(212,176,122,0.5)" }} />
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-8 z-10 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            <span className={`${cinzel.className} text-[7px] tracking-[0.35em] uppercase text-white/25`}>
              scroll
            </span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              <ChevronDown size={15} className="text-white/25" />
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          02 · STORY
      ══════════════════════════════════════════════════ */}
      {vis.story !== false && (
        <section className="py-32 sm:py-48 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className={`grid grid-cols-1 ${storyImg ? "md:grid-cols-[1fr_300px]" : ""} gap-16 md:gap-24 items-start`}
            >
              <div>
                <motion.div variants={fadeUp} className="mb-12">
                  <SectionTitle title={c.story?.title_history ?? "Dear Friends and Family,"} />
                </motion.div>
                <div
                  className={`${cormorant.className} space-y-6 text-xl sm:text-2xl font-light leading-relaxed`}
                  style={{ color: "#5A5348" }}
                >
                  {(
                    c.story?.paragraphs || [
                      "As we prepare to say “I do,” we feel deeply grateful for every one of you who has walked this journey with us.",
                      "Your presence would mean the world to us as we begin this new chapter of our lives together.",
                    ]
                  )
                    .filter((p: string) => p?.trim())
                    .map((p: string, i: number) => (
                      <motion.p key={i} variants={fadeUp}>{p}</motion.p>
                    ))}
                </div>
              </div>

              {storyImg && (
                <motion.div variants={fadeUp} className="relative self-start">
                  <div
                    className="absolute -top-4 -left-4 w-full h-full border"
                    style={{ borderColor: "rgba(184,148,90,0.3)" }}
                  />
                  <div className="relative w-full aspect-[3/4] overflow-hidden shadow-2xl">
                    <img src={storyImg} className="w-full h-full object-cover" alt="Story" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          03 · COUNTDOWN
      ══════════════════════════════════════════════════ */}
      {vis.countdown !== false && mounted && (
        <section className="py-24 sm:py-32 bg-[#2D4A3E]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.p
                variants={fadeUp}
                className={`${cinzel.className} text-[9px] sm:text-[10px] tracking-[0.45em] uppercase mb-14`}
                style={{ color: "#B8945A" }}
              >
                {c.countdown?.title ?? "The Celebration Begins In"}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex justify-center items-end gap-8 sm:gap-16 md:gap-24"
              >
                {[
                  { val: timeLeft.days, label: "Days" },
                  { val: timeLeft.hours, label: "Hours" },
                  { val: timeLeft.minutes, label: "Min" },
                  { val: timeLeft.seconds, label: "Sec" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span
                      className={`${cormorant.className} text-5xl sm:text-7xl md:text-8xl font-light text-white leading-none tabular-nums`}
                    >
                      {item.val}
                    </span>
                    <span
                      className={`${cinzel.className} text-[8px] sm:text-[9px] tracking-[0.3em] uppercase mt-3`}
                      style={{ color: "rgba(184,148,90,0.65)" }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          04 · CEREMONY & RECEPTION
      ══════════════════════════════════════════════════ */}
      {showEvent && (
        <section className="py-32 sm:py-48 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp}>
                <SectionTitle
                  label="Save the date"
                  title={c.event?.title_main ?? "Ceremony & Celebration"}
                />
              </motion.div>

              <div
                className={`grid grid-cols-1 ${hasCeremony && hasReception ? "md:grid-cols-2" : ""} gap-8 sm:gap-12`}
              >
                {hasCeremony && (
                  <motion.div variants={fadeUp}>
                    <div
                      className="relative p-10 sm:p-12 border transition-all duration-500 hover:shadow-xl group"
                      style={{ borderColor: "#EDE8DF" }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#B8945A]/70" />
                      <p
                        className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-5`}
                        style={{ color: "#B8945A" }}
                      >
                        Ceremony
                      </p>
                      <h3
                        className={`${cormorant.className} text-2xl sm:text-3xl font-light mb-8`}
                        style={{ color: "#2D4A3E" }}
                      >
                        {c.event?.ceremony?.title ?? "Wedding Ceremony"}
                      </h3>
                      <div className="space-y-4">
                        {c.event?.ceremony?.time && (
                          <div className="flex items-center gap-3" style={{ color: "#6B6455" }}>
                            <Clock size={13} style={{ color: "#B8945A", flexShrink: 0 }} />
                            <span className={`${cormorant.className} text-lg font-light`}>
                              {c.event.ceremony.time}
                            </span>
                          </div>
                        )}
                        {c.event?.ceremony?.location && (
                          <div className="flex items-start gap-3" style={{ color: "#6B6455" }}>
                            <MapPin size={13} style={{ color: "#B8945A", flexShrink: 0, marginTop: 4 }} />
                            <span className={`${cormorant.className} text-lg font-light leading-snug`}>
                              {c.event.ceremony.location}
                            </span>
                          </div>
                        )}
                      </div>
                      {c.event?.ceremony?.google_maps_url && (
                        <a
                          href={c.event.ceremony.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${cinzel.className} text-[9px] tracking-[0.2em] uppercase mt-8 inline-block transition-colors duration-300`}
                          style={{ color: "#2D4A3E", borderBottom: "1px solid rgba(45,74,62,0.3)" }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = "#B8945A";
                            (e.currentTarget as HTMLElement).style.borderBottomColor = "#B8945A";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = "#2D4A3E";
                            (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(45,74,62,0.3)";
                          }}
                        >
                          Get Directions →
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}

                {hasReception && (
                  <motion.div variants={fadeUp}>
                    <div
                      className="relative p-10 sm:p-12 border transition-all duration-500 hover:shadow-xl"
                      style={{ borderColor: "#EDE8DF" }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#2D4A3E]/70" />
                      <p
                        className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-5`}
                        style={{ color: "#B8945A" }}
                      >
                        Reception
                      </p>
                      <h3
                        className={`${cormorant.className} text-2xl sm:text-3xl font-light mb-8`}
                        style={{ color: "#2D4A3E" }}
                      >
                        {c.event?.reception?.title ?? "Wedding Reception"}
                      </h3>
                      <div className="space-y-4">
                        {c.event?.reception?.time && (
                          <div className="flex items-center gap-3" style={{ color: "#6B6455" }}>
                            <Clock size={13} style={{ color: "#B8945A", flexShrink: 0 }} />
                            <span className={`${cormorant.className} text-lg font-light`}>
                              {c.event.reception.time}
                            </span>
                          </div>
                        )}
                        {c.event?.reception?.location && (
                          <div className="flex items-start gap-3" style={{ color: "#6B6455" }}>
                            <MapPin size={13} style={{ color: "#B8945A", flexShrink: 0, marginTop: 4 }} />
                            <span className={`${cormorant.className} text-lg font-light leading-snug`}>
                              {c.event.reception.location}
                            </span>
                          </div>
                        )}
                      </div>
                      {c.event?.reception?.google_maps_url && (
                        <a
                          href={c.event.reception.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${cinzel.className} text-[9px] tracking-[0.2em] uppercase mt-8 inline-block transition-colors duration-300`}
                          style={{ color: "#2D4A3E", borderBottom: "1px solid rgba(45,74,62,0.3)" }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = "#B8945A";
                            (e.currentTarget as HTMLElement).style.borderBottomColor = "#B8945A";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = "#2D4A3E";
                            (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(45,74,62,0.3)";
                          }}
                        >
                          Get Directions →
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          05 · PROGRAM
      ══════════════════════════════════════════════════ */}
      {vis.program !== false && (
        <section className="py-32 sm:py-48 px-6 bg-[#F7F4EE]">
          <div className="max-w-xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp}>
                <SectionTitle title={c.program?.title_program ?? "Schedule of Events"} />
              </motion.div>

              <div className="relative">
                {/* Vertical timeline line */}
                <div
                  className="absolute left-[4.5rem] top-0 bottom-0 w-px hidden sm:block"
                  style={{ backgroundColor: "rgba(184,148,90,0.25)" }}
                />

                <div className="space-y-0">
                  {(c.program?.events || defaultProgram).map((ev: any, i: number) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      className="flex items-start gap-6 sm:gap-8 group"
                    >
                      <span
                        className={`${cinzel.className} text-xs sm:text-sm shrink-0 w-16 text-right pt-1 leading-tight`}
                        style={{ color: "#B8945A" }}
                      >
                        {ev.time}
                      </span>
                      <div
                        className="flex items-start gap-5 flex-1 pb-12 last:pb-0"
                        style={{ borderBottom: "1px solid rgba(232,224,208,0.6)" }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border shrink-0 mt-1 relative z-10 transition-all duration-300 group-hover:scale-125"
                          style={{
                            borderColor: "#B8945A",
                            backgroundColor: "#F7F4EE",
                          }}
                        />
                        <h3
                          className={`${cormorant.className} text-2xl sm:text-3xl font-light`}
                          style={{ color: "#1A1A1A" }}
                        >
                          {ev.title}
                        </h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          06 · GALLERY
      ══════════════════════════════════════════════════ */}
      {vis.gallery !== false && hasGallery && (
        <section className="bg-white">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Row 1: first 2 images */}
            {galleryUrls.slice(0, 2).length > 0 && (
              <div className={`grid gap-1 ${galleryUrls.slice(0, 2).length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {galleryUrls.slice(0, 2).map((url: string, i: number) => (
                  <motion.div key={i} variants={fadeUp} className="aspect-[16/9] overflow-hidden">
                    <img
                      src={url}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      alt={`Wedding ${i + 1}`}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Row 2: remaining images */}
            {galleryUrls.slice(2).length > 0 && (
              <div className={`grid gap-1 mt-1 grid-cols-${Math.min(galleryUrls.slice(2).length, 3)}`}>
                {galleryUrls.slice(2, 5).map((url: string, i: number) => (
                  <motion.div key={i} variants={fadeUp} className="aspect-square overflow-hidden">
                    <img
                      src={url}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      alt={`Wedding ${i + 3}`}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          07 · DETAILS
      ══════════════════════════════════════════════════ */}
      {vis.details_section !== false && (
        <section className="py-32 sm:py-48 px-6 bg-[#F7F4EE]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp}>
                <SectionTitle title={c.details?.title_details ?? "Details"} />
              </motion.div>

              {/* Logistics + Accommodation */}
              <div
                className={`grid grid-cols-1 ${vis.useful_info !== false && vis.accommodation !== false ? "md:grid-cols-2" : ""} gap-16 sm:gap-24`}
              >
                {vis.useful_info !== false && (
                  <motion.div variants={fadeUp}>
                    <p
                      className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-3`}
                      style={{ color: "#B8945A" }}
                    >
                      {c.details?.parking_title ?? "Location"}
                    </p>
                    <div className="w-10 h-px mb-6" style={{ backgroundColor: "rgba(184,148,90,0.45)" }} />
                    <p
                      className={`${cormorant.className} text-xl font-light leading-relaxed`}
                      style={{ color: "#5A5348" }}
                    >
                      {c.details?.parking_text ?? "Chateau de Paon. Petit Chemin de Saint-Gilles, Arles, France."}
                    </p>
                  </motion.div>
                )}

                {vis.accommodation !== false && (
                  <motion.div variants={fadeUp}>
                    <p
                      className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-3`}
                      style={{ color: "#B8945A" }}
                    >
                      {c.details?.accommodation_title ?? "Accommodations"}
                    </p>
                    <div className="w-10 h-px mb-6" style={{ backgroundColor: "rgba(184,148,90,0.45)" }} />
                    <p
                      className={`${cormorant.className} text-xl font-light leading-relaxed mb-8`}
                      style={{ color: "#5A5348" }}
                    >
                      {c.details?.accommodation_text ??
                        "We have reserved a block of rooms for your convenience."}
                    </p>
                    {(c.details?.accommodation_buttons || []).length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {c.details.accommodation_buttons.map((btn: any, idx: number) => (
                          <a
                            key={idx}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${cinzel.className} text-[9px] tracking-[0.2em] uppercase px-7 py-3 border transition-all duration-300`}
                            style={{ borderColor: "#2D4A3E", color: "#2D4A3E" }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#2D4A3E";
                              (e.currentTarget as HTMLElement).style.color = "#F7F4EE";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLElement).style.color = "#2D4A3E";
                            }}
                          >
                            {btn.text}
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Dress Code */}
              {vis.dress_code !== false && (
                <motion.div
                  variants={fadeUp}
                  className="mt-28 pt-20 text-center max-w-2xl mx-auto"
                  style={{ borderTop: "1px solid #EDE8DF" }}
                >
                  <p
                    className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-3`}
                    style={{ color: "#B8945A" }}
                  >
                    {c.dress_code?.title ?? "Dress Code"}
                  </p>
                  <div className="w-10 h-px mb-8 mx-auto" style={{ backgroundColor: "rgba(184,148,90,0.45)" }} />
                  {(c.dress_code?.text || [])
                    .filter((t: string) => t?.trim())
                    .map((t: string, i: number) => (
                      <p
                        key={i}
                        className={`${cormorant.className} text-xl font-light leading-relaxed mb-4`}
                        style={{ color: "#5A5348" }}
                      >
                        {t}
                      </p>
                    ))}
                  {c.dress_code?.show_palette !== false &&
                    (c.dress_code?.colors || []).length > 0 && (
                      <div className="flex justify-center gap-4 mt-10">
                        {c.dress_code.colors.map((color: string, i: number) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full shadow-sm"
                            style={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.07)" }}
                          />
                        ))}
                      </div>
                    )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          08 · GIFTS / IBAN
      ══════════════════════════════════════════════════ */}
      {vis.gifts !== false && (
        <section className="py-24 sm:py-32 bg-[#2D4A3E]">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.p
                variants={fadeUp}
                className={`${cinzel.className} text-[9px] tracking-[0.4em] uppercase mb-3`}
                style={{ color: "#B8945A" }}
              >
                {c.gifts?.title ?? "Gifts"}
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="w-10 h-px mb-8 mx-auto"
                style={{ backgroundColor: "rgba(184,148,90,0.4)" }}
              />
              <motion.p
                variants={fadeUp}
                className={`${cormorant.className} text-xl font-light leading-relaxed mb-12`}
                style={{ color: "rgba(247,244,238,0.65)" }}
              >
                {c.gifts?.text ?? "Your presence is the greatest gift to us."}
              </motion.p>

              {c.gifts?.show_iban !== false && !showIban && (
                <motion.button
                  variants={fadeUp}
                  onClick={() => setShowIban(true)}
                  className={`${cinzel.className} text-[9px] tracking-[0.3em] uppercase px-12 py-4 border transition-all duration-500`}
                  style={{ borderColor: "rgba(184,148,90,0.5)", color: "#B8945A" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#B8945A";
                    (e.currentTarget as HTMLElement).style.color = "#2D4A3E";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#B8945A";
                  }}
                >
                  {c.gifts?.iban_button_text ?? "Contribute"}
                </motion.button>
              )}

              {showIban && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-4 p-10 sm:p-14"
                  style={{ border: "1px solid rgba(184,148,90,0.2)" }}
                >
                  <button
                    onClick={() => setShowIban(false)}
                    className="absolute top-4 right-4 transition-colors"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                  <p
                    className={`${cinzel.className} text-[8px] tracking-[0.35em] uppercase mb-2`}
                    style={{ color: "#B8945A" }}
                  >
                    Account Holder
                  </p>
                  <p
                    className={`${cormorant.className} text-2xl sm:text-3xl font-light italic text-white mb-8`}
                  >
                    {c.gifts?.iban_holders_name || coupleNames}
                  </p>
                  <p
                    className={`${cinzel.className} text-[8px] tracking-[0.35em] uppercase mb-2`}
                    style={{ color: "#B8945A" }}
                  >
                    IBAN
                  </p>
                  <p className="text-sm sm:text-base tracking-widest font-mono break-all"
                    style={{ color: "rgba(247,244,238,0.6)" }}>
                    {c.gifts?.iban_value}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          09 · RSVP
      ══════════════════════════════════════════════════ */}
      {vis.rsvp !== false && (
        <section className="py-32 sm:py-48 px-6 bg-[#EDE8DF]">
          <div className="max-w-xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp}>
                <SectionTitle title={c.rsvp?.title_confirm ?? "Confirm Your Attendance"} />
              </motion.div>
              <motion.p
                variants={fadeUp}
                className={`${cinzel.className} text-[9px] tracking-[0.3em] uppercase text-center -mt-14 mb-16`}
                style={{ color: "#8B7B6A" }}
              >
                Please RSVP before {rsvpDeadline}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="bg-white shadow-2xl p-8 sm:p-14"
                style={{ boxShadow: "0 20px 60px rgba(45,74,62,0.08)" }}
              >
                <SmartRsvp invitationId={data?.id || ""} />
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          10 · FOOTER
      ══════════════════════════════════════════════════ */}
      {vis.footer !== false && (
        <footer className="relative py-40 sm:py-56 overflow-hidden flex items-center justify-center bg-[#2D4A3E]">
          <div className="absolute inset-0">
            <img src={footerImg} className="w-full h-full object-cover opacity-20" alt="Footer" />
            <div className="absolute inset-0 bg-[#2D4A3E]/75" />
          </div>

          <div className="relative z-10 text-center px-6 w-full max-w-3xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.p
                variants={fadeUp}
                className={`${cinzel.className} text-[9px] tracking-[0.45em] uppercase mb-8`}
                style={{ color: "#B8945A" }}
              >
                {c.footer?.title_main ?? "We hope to see you there"}
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className={`${greatVibes.className} text-6xl sm:text-8xl md:text-[6.5rem] text-white leading-tight drop-shadow-lg mb-6`}
              >
                {c.footer?.title_celebrate ?? coupleNames}
              </motion.h2>

              {c.footer?.location_text && (
                <motion.p
                  variants={fadeUp}
                  className={`${cormorant.className} text-lg font-light italic mb-12`}
                  style={{ color: "rgba(247,244,238,0.45)" }}
                >
                  {c.footer.location_text}
                </motion.p>
              )}

              {c.footer?.show_contacts !== false && (
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-20 pt-12 mb-16"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {[
                    { name: c.footer?.contact_1_name || bride, phone: c.footer?.contact_1_phone },
                    { name: c.footer?.contact_2_name || groom, phone: c.footer?.contact_2_phone },
                  ].map((ct, i) => (
                    <div key={i} className="text-center">
                      <p className={`${cormorant.className} text-2xl italic text-white font-light mb-1`}>
                        {ct.name}
                      </p>
                      {ct.phone && (
                        <a
                          href={`tel:${ct.phone}`}
                          className={`${cinzel.className} text-[8px] tracking-[0.3em] uppercase transition-colors`}
                          style={{ color: "rgba(184,148,90,0.5)" }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#B8945A")}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(184,148,90,0.5)")}
                        >
                          {ct.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              <motion.div variants={fadeUp}>
                <span
                  className={`${cinzel.className} text-[7px] tracking-[0.45em] uppercase`}
                  style={{ color: "rgba(247,244,238,0.18)" }}
                >
                  Digital Invite Studio
                </span>
              </motion.div>
            </motion.div>
          </div>
        </footer>
      )}
    </div>
  );
}
