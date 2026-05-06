"use client";
import { motion } from "framer-motion";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import { useState, useEffect } from "react";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

const cinzel = Cinzel({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: 'swap' 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  style: ["italic", "normal"],
  display: 'swap' 
});

const inter = Inter({ 
  subsets: ["latin"], 
  weight: ["300", "400", "600"],
  display: 'swap' 
});

// URL do seu vídeo do Supabase como padrão (Fallback)
const DEFAULT_HERO_MEDIA = "https://anvqtinrmgkfjadsftlj.supabase.co/storage/v1/object/public/invites/wedding-dream.mp4";
const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000";

export default function Minimal01Template({ data, params }: { data: any, params?: any }) {
  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

  const bride = data?.bride_name || "Julianna";
  const groom = data?.groom_name || "Holdern";
  const casalNomes = `${bride} & ${groom}`;
  const eventDate = data?.event_date || new Date().toISOString();

  // Lógica de Media: Prioridade ao que está no DB, caso contrário usa o seu vídeo do Supabase
  const heroMediaUrl = (content.hero?.main_image_url && content.hero.main_image_url.trim() !== "") 
    ? content.hero.main_image_url 
    : (data?.main_image_url && data.main_image_url.trim() !== "") ? data.main_image_url : DEFAULT_HERO_MEDIA;
    
  // Verifica se o URL é um vídeo
  const isVideo = heroMediaUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/i) || heroMediaUrl.toLowerCase().includes("video");

  const footerImg = (content.footer?.footer_image_url && content.footer.footer_image_url.trim() !== "") 
    ? content.footer.footer_image_url 
    : DEFAULT_FOOTER_IMAGE;
    
  const storyImg = (content.story?.story_image_url && content.story.story_image_url.trim() !== "")
    ? content.story.story_image_url : null;

  // Formatação de Datas e Countdown
  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '.');
  const rsvpFormattedDeadline = content.rsvp?.text_limit_date_fixed ?? "15.10.26";

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [showIbanData, setShowIbanData] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const diff = +new Date(eventDate) - +new Date();
      if (diff > 0) {
        setTimeLeft({
          days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
          hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
          minutes: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0"),
          seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } }
  };

  const showUsefulInfo = visibility.useful_info !== false;
  const showAccommodation = visibility.accommodation !== false;

  const timelineEvents = [
    { time: "16:00", title: "Wedding Ceremony" },
    { time: "17:00", title: "Cocktail Hour" },
    { time: "19:00", title: "Dinner" },
    { time: "20:00", title: "Party" }
  ];

  return (
    <div className={`${inter.className} w-full bg-[#F2EFE9] text-[#2C2C2C] selection:bg-[#2C2C2C] selection:text-white`}>
      
      {/* 01. HERO SECTION COM O SEU VÍDEO SUPABASE */}
      {visibility.hero !== false && (
        <section className="relative h-[90vh] min-h-[600px] w-full flex flex-col items-center justify-center overflow-hidden bg-[#1A1A1A]">
          <motion.div 
            initial={{ scale: 1.05, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 2 }}
            className="absolute inset-0 z-0"
          >
            {isVideo ? (
              <video 
                key={heroMediaUrl} // Força o refresh do vídeo se o link mudar
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover object-center"
              >
                <source src={heroMediaUrl} type="video/mp4" />
              </video>
            ) : (
              <img src={heroMediaUrl} className="w-full h-full object-cover object-center" alt="Wedding" />
            )}
            
            <div className="absolute inset-0 bg-black/30"></div>
          </motion.div>
          
          <div className="relative z-10 text-center text-white px-4 flex flex-col items-center justify-center h-full">
            <motion.span 
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              transition={{ duration: 1.5 }}
              className={`${cinzel.className} text-[10px] sm:text-xs uppercase mb-8 block font-light tracking-[0.5em] text-[#E5DACE] drop-shadow-md`}
            >
              {content.hero?.text_above_names ?? "THE WEDDING DAY OF"}
            </motion.span>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.2 }}
              className={`${playfair.className} text-6xl sm:text-8xl md:text-9xl mb-6 flex flex-col items-center gap-2 drop-shadow-lg`}
            >
              <span className="leading-none">{bride}</span>
              <span className="text-3xl sm:text-5xl font-light italic text-[#E5DACE] drop-shadow-md">&</span>
              <span className="leading-none">{groom}</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className={`${cinzel.className} text-sm sm:text-lg tracking-[0.3em] mt-8 border-t border-white/20 pt-8 inline-block text-[#E5DACE]`}
            >
              {formattedDate}
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 animate-bounce z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
          </div>
        </section>
      )}

      {/* 02. HISTÓRIA */}
      {visibility.story !== false && (
        <section className="py-24 sm:py-40 px-6 max-w-4xl mx-auto text-center border-b border-[#2C2C2C]/5">
          <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className={`${playfair.className} text-3xl sm:text-5xl mb-16 italic text-[#2C2C2C]`}>
              {content.story?.title_history ?? "Dear Friends and Family,"}
            </h2>
            <div className="space-y-8 text-base sm:text-lg leading-relaxed text-[#5A5A5A] font-light max-w-2xl mx-auto">
              {(content.story?.paragraphs || ["As we get ready to say “I do,” we feel grateful for the wonderful people in our lives.", "Your support means the world to us, and we would be honored to have you with us as we begin our life together."]).map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {storyImg && (
              <div className="mt-20 flex justify-center">
                <div className="w-full max-w-[280px] aspect-[3/4] overflow-hidden p-3 bg-[#EAE5DF] shadow-xl rounded-sm">
                  <img src={storyImg} className="w-full h-full object-cover grayscale-[30%]" alt="Our Story" />
                </div>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* 03. COUNTDOWN */}
      {visibility.countdown !== false && mounted && (
        <section className="py-24 bg-white border-b border-[#2C2C2C]/5">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <span className={`${cinzel.className} text-[10px] tracking-[0.4em] uppercase text-[#8B7355] block mb-12 font-bold`}>
              {content.countdown?.title ?? "The Celebration Begins In"}
            </span>
            <div className="flex justify-center items-center gap-4 sm:gap-16">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hours", val: timeLeft.hours },
                { label: "Mins", val: timeLeft.minutes },
                { label: "Secs", val: timeLeft.seconds }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={`${playfair.className} text-4xl sm:text-7xl font-light text-[#2C2C2C]`}>{item.val}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-4 opacity-50 font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 04. CRONOGRAMA */}
      {visibility.program !== false && (
        <section className="py-24 sm:py-40 px-6 bg-[#F2EFE9] border-b border-[#2C2C2C]/5">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-24">
              <h2 className={`${playfair.className} text-4xl sm:text-6xl mb-4 italic text-[#2C2C2C]`}>
                {content.program?.title_program ?? "Schedule of Events"}
              </h2>
            </motion.div>
            <div className="space-y-8 sm:space-y-12 max-w-xl mx-auto">
              {(content.program?.events || timelineEvents).map((ev: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#2C2C2C]/10 pb-6 group"
                >
                  <div className="text-left mb-2 sm:mb-0">
                    <span className={`${cinzel.className} text-[11px] sm:text-sm tracking-[0.2em] text-[#8B7355] block mb-1 font-bold`}>{ev.time}</span>
                    <h3 className={`${playfair.className} text-xl sm:text-2xl text-[#2C2C2C]`}>{ev.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 05. DETALHES */}
      {visibility.details_header !== false && (
        <section className="py-24 sm:py-32 bg-white border-b border-[#2C2C2C]/5">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20 sm:mb-32">
               <h2 className={`${playfair.className} text-4xl sm:text-6xl italic text-[#2C2C2C]`}>
                 {content.details?.title_details ?? "Details"}
               </h2>
            </motion.div>

            <div className={`grid ${showUsefulInfo && showAccommodation ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto text-center'} gap-16 sm:gap-24`}>
              {showUsefulInfo && (
                <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className={!showAccommodation ? "flex flex-col items-center" : ""}>
                  <h3 className={`${cinzel.className} text-xs tracking-[0.3em] text-[#8B7355] uppercase mb-6 border-b border-[#8B7355]/30 pb-4 inline-block font-bold`}>
                    {content.details?.parking_title ?? "Location"}
                  </h3>
                  <p className="text-base sm:text-lg font-light leading-relaxed text-[#5A5A5A]">
                    {content.details?.parking_text ?? "Chateau de Paon. Address: Petit Chemin de Saint-Gilles 13200 Arles, France."}
                  </p>
                </motion.div>
              )}

              {showAccommodation && (
                <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className={!showUsefulInfo ? "flex flex-col items-center" : ""}>
                  <h3 className={`${cinzel.className} text-xs tracking-[0.3em] text-[#8B7355] uppercase mb-6 border-b border-[#8B7355]/30 pb-4 inline-block font-bold`}>
                    {content.details?.accommodation_title ?? "Accommodations"}
                  </h3>
                  <p className="text-base sm:text-lg font-light leading-relaxed text-[#5A5A5A] mb-8">
                    {content.details?.accommodation_text ?? "We have reserved a block of rooms for your convenience."}
                  </p>
                  <div className={`flex flex-wrap gap-4 ${!showUsefulInfo ? 'justify-center' : ''}`}>
                    {(content.details?.accommodation_buttons || []).map((btn: any, idx: number) => (
                      <a key={idx} href={btn.url} target="_blank" rel="noopener noreferrer" className={`${cinzel.className} text-[10px] uppercase tracking-widest border border-[#2C2C2C] text-[#2C2C2C] px-8 py-3 hover:bg-[#2C2C2C] hover:text-white transition-colors duration-300`}>
                        {btn.text}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {visibility.dress_code !== false && (
              <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center pt-24 sm:pt-40 mt-12 sm:mt-20 border-t border-[#2C2C2C]/10 max-w-3xl mx-auto">
                <h3 className={`${cinzel.className} text-xs tracking-[0.3em] text-[#8B7355] uppercase mb-10 inline-block font-bold`}>
                  {content.dress_code?.title ?? "Dress Code"}
                </h3>
                <div className="space-y-6 font-light text-[#5A5A5A] text-base sm:text-lg leading-relaxed">
                  {(content.dress_code?.text || ["We kindly invite you to dress in elegant attire."]).map((t: string, i: number) => (
                    <p key={i}>{t}</p>
                  ))}
                  {content.dress_code?.show_palette !== false && (
                    <div className="flex justify-center gap-4 pt-10">
                      {(content.dress_code?.colors || []).map((c: string, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: c }}></div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* 06. PRESENTES / IBAN */}
      {visibility.gifts !== false && (
        <section className="py-24 bg-[#1A1A1A] text-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className={`${playfair.className} text-3xl sm:text-5xl italic mb-10`}>
              {content.gifts?.title ?? "Gifts"}
            </h2>
            <p className="text-base sm:text-lg font-light opacity-70 leading-relaxed mb-12 max-w-2xl mx-auto">
              {content.gifts?.text ?? "Your presence is the greatest gift to us."}
            </p>
            {content.gifts?.show_iban !== false && !showIbanData && (
              <button 
                onClick={() => setShowIbanData(true)}
                className={`${cinzel.className} bg-transparent border border-[#F2EFE9] text-[#F2EFE9] px-10 py-4 text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:bg-[#F2EFE9] hover:text-[#2C2C2C] transition-colors duration-500`}
              >
                {content.gifts?.iban_button_text || "Contribute"}
              </button>
            )}
            {showIbanData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1A1A1A] border border-white/10 p-8 sm:p-12 rounded-sm relative mt-8">
                 <button onClick={() => setShowIbanData(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
                <span className={`${cinzel.className} text-[10px] uppercase tracking-[0.2em] text-[#8B7355] block mb-2 font-bold`}>Account Holder</span>
                <p className={`${playfair.className} text-2xl mb-8`}>{content.gifts?.iban_holders_name || casalNomes}</p>
                <span className={`${cinzel.className} text-[10px] uppercase tracking-[0.2em] text-[#8B7355] block mb-2 font-bold`}>IBAN</span>
                <p className={`${inter.className} text-sm sm:text-lg tracking-widest break-all`}>{content.gifts?.iban_value}</p>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* 07. RSVP */}
      {visibility.rsvp !== false && (
        <section className="py-24 sm:py-40 bg-[#F5F2F0]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16 sm:mb-24">
              <h2 className={`${playfair.className} text-4xl sm:text-6xl italic text-[#2C2C2C] mb-8`}>
                {content.rsvp?.title_confirm ?? "Confirm Your Attendance"}
              </h2>
              <p className={`${inter.className} text-xs sm:text-sm tracking-[0.1em] uppercase opacity-50`}>
                Please RSVP before {rsvpFormattedDeadline}
              </p>
            </div>
            <div className="bg-white p-8 sm:p-16 shadow-2xl rounded-sm">
              <SmartRsvp invitationId={data?.id || ""} />
            </div>
          </div>
        </section>
      )}

      {/* 08. RODAPÉ */}
      {visibility.footer !== false && (
        <footer className="relative py-32 sm:py-48 bg-[#1A1A1A] overflow-hidden flex items-center justify-center border-t-8 border-[#2C2C2C]">
          <div className="absolute inset-0 opacity-30">
            <img src={footerImg} className="w-full h-full object-cover grayscale" alt="Footer" />
          </div>
          <div className="relative z-10 text-center text-[#F2EFE9] px-4 w-full max-w-4xl mx-auto">
            <motion.div variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <p className={`${cinzel.className} text-[10px] sm:text-xs tracking-[0.4em] uppercase text-[#8B7355] mb-8 font-bold`}>
                {content.footer?.title_main ?? "Hope to see you there!"}
              </p>
              <h2 className={`${playfair.className} text-5xl sm:text-7xl md:text-8xl mb-16`}>
                {content.footer?.title_celebrate ?? casalNomes}
              </h2>
              
              {content.footer?.show_contacts !== false && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 pt-12 border-t border-white/10 w-full mb-16">
                  <div className="text-center">
                    <span className={`${playfair.className} text-xl italic block mb-2`}>{content.footer?.contact_1_name || bride}</span>
                    <a href={`tel:${content.footer?.contact_1_phone || ""}`} className={`${cinzel.className} text-[10px] tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity`}>Contact</a>
                  </div>
                  <div className="hidden sm:block w-[1px] h-12 bg-white/10"></div>
                  <div className="text-center">
                    <span className={`${playfair.className} text-xl italic block mb-2`}>{content.footer?.contact_2_name || groom}</span>
                    <a href={`tel:${content.footer?.contact_2_phone || ""}`} className={`${cinzel.className} text-[10px] tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity`}>Contact</a>
                  </div>
                </div>
              )}

              <div className="mt-16 sm:mt-24">
                <span className={`${inter.className} text-[8px] sm:text-[9px] tracking-[0.4em] uppercase opacity-30`}>
                  Digital Invite Studio
                </span>
              </div>
            </motion.div>
          </div>
        </footer>
      )}

    </div>
  );
}