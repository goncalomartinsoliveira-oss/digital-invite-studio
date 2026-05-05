"use client";
import { motion, Variants } from "framer-motion";
import { Passions_Conflict, Cinzel } from "next/font/google";
import { useState, useEffect } from "react";

import SmartRsvp from "../../../../components/invite/SmartRsvp"; 

const passionsConflict = Passions_Conflict({ 
  weight: "400", 
  subsets: ["latin"],
  display: 'swap',
});

const cinzel = Cinzel({ 
  weight: ["400", "500"], 
  subsets: ["latin"],
  display: 'swap',
});

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000";
const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";

export default function LuxuryTemplate({ data, params }: { data: any, params?: any }) {
  
  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};

  const firstPersonName = data?.bride_name || "Julianna";
  const secondPersonName = data?.groom_name || "Holdern";
  const casalNomes = `${firstPersonName} & ${secondPersonName}`;
  const eventDate = data?.event_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
  
  const backgroundImageUrl = (content.hero?.main_image_url && content.hero.main_image_url.trim() !== "")
    ? content.hero.main_image_url
    : (data?.main_image_url && data.main_image_url.trim() !== "") 
      ? data.main_image_url 
      : DEFAULT_HERO_IMAGE;

  const footerImageUrl = (content.footer?.footer_image_url && content.footer.footer_image_url.trim() !== "")
    ? content.footer.footer_image_url
    : DEFAULT_FOOTER_IMAGE;

  const storyImageUrl = (content.story?.story_image_url && content.story.story_image_url.trim() !== "")
    ? content.story.story_image_url
    : (data?.story_image_url && data.story_image_url.trim() !== "")
      ? data.story_image_url
      : null;

  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('pt-PT', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const footerDate = `${String(dateObj.getDate()).padStart(2, '0')} . ${String(dateObj.getMonth() + 1).padStart(2, '0')} . ${dateObj.getFullYear()}`;
  const rsvpFormattedDeadline = content.rsvp?.text_limit_date_fixed ?? "15 | 10 | 2026";

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [showIbanData, setShowIbanData] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(eventDate) - +new Date();
      let newTimeLeft = { days: "00", hours: "00", minutes: "00", seconds: "00" };
      if (difference > 0) {
        newTimeLeft = {
          days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, "0"),
          hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
          minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, "0"),
          seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, "0"),
        };
      }
      return newTimeLeft;
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.6, delayChildren: 0.3 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } } };

  const timelineEvents = [
    { time: "12:00", title: "RECEÇÃO & BOAS-VINDAS" },
    { time: "13:30", title: "CERIMÓNIA" },
    { time: "14:30", title: "COCKTAIL" },
    { time: "17:00", title: "JANTAR" },
    { time: "20:00", title: "CORTE DO BOLO" },
    { time: "21:00", title: "BAILE" },
  ];

  // Variáveis para a lógica adaptável do layout (Secção 6)
  const showUsefulInfo = visibility.useful_info !== false;
  const showAccommodation = visibility.accommodation !== false;
  const showDetailsSection = showUsefulInfo || showAccommodation || visibility.dress_code !== false || visibility.gifts !== false || visibility.details_header !== false;

  return (
    <div className="w-full bg-[#FDFBF7]">
      
      {/* SECTION 1: HERO */}
      {visibility.hero !== false && (
        <motion.section 
          className="relative w-full h-[100vh] min-h-[600px] overflow-hidden flex flex-col items-center justify-center bg-[#F9F8F6] text-center"
          initial="hidden" animate="visible" variants={containerVariants}
        >
          <div className="absolute inset-0 z-0 bg-[#2A231D]">
            {backgroundImageUrl && (
              <img src={backgroundImageUrl} className="w-full h-full object-cover object-center opacity-90" alt="Capa" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70"></div>
            <div className="absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.4)]"></div>
          </div>
          <div className="relative z-20 w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center pt-10">
            <motion.p variants={itemVariants} className={`${cinzel.className} text-[#F0E9E3] text-[16px] sm:text-[22px] md:text-[28px] font-medium uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-4 sm:mb-8 ml-4 drop-shadow-md`}>
              {content.hero?.text_above_names ?? "THE WEDDING OF"}
            </motion.p>
            <motion.div variants={itemVariants} className={`${passionsConflict.className} text-white flex flex-col items-center justify-center w-full my-2`}>
              <div className="text-[140px] sm:text-[180px] md:text-[240px] leading-[0.8] drop-shadow-xl pr-16 sm:pr-32 z-20">{firstPersonName}</div>
              <div className="text-[70px] sm:text-[100px] md:text-[130px] leading-none opacity-80 drop-shadow-md -my-4 sm:-my-8 z-10">&</div>
              <div className="text-[140px] sm:text-[180px] md:text-[240px] leading-[0.8] drop-shadow-xl pl-16 sm:pl-32 z-20">{secondPersonName}</div>
            </motion.div>
            <motion.time dateTime={eventDate} variants={itemVariants} className={`${cinzel.className} text-[#F0E9E3]/90 text-[12px] sm:text-[16px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-8 sm:mt-12 block drop-shadow-md`}>
              {formattedDate}
            </motion.time>
          </div>
        </motion.section>
      )}

      {/* SECTION 2: COUNTDOWN */}
      {visibility.countdown !== false && (
        <section className="w-full bg-[#41362E] pt-24 pb-16 md:pt-36 md:pb-28 px-4 flex justify-center border-t-8 border-[#302720]">
          <div className="w-full max-w-4xl border border-[#967C5A]/40 p-2 md:p-3 relative">
            <div className="w-full border border-[#967C5A]/60 py-16 md:py-24 px-4 flex flex-col items-center justify-center relative bg-[#41362E]">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#967C5A]"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#967C5A]"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#967C5A]"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#967C5A]"></div>
              <h2 className={`${passionsConflict.className} text-[#B99A6E] text-[50px] sm:text-[60px] md:text-[80px] mb-8 md:mb-12 leading-none text-center px-4`}>
                {content.countdown?.title ?? "O dia do \"Sim\" aproxima-se..."}
              </h2>
              {mounted && (
                <div className={`${cinzel.className} flex items-center justify-center text-[#FDFBF7] gap-3 md:gap-8`}>
                  <div className="flex flex-col items-center w-16 md:w-28">
                    <span className="text-[40px] sm:text-[50px] md:text-[80px] leading-none mb-4">{timeLeft.days}</span>
                    <span className="text-[9px] sm:text-[11px] md:text-[13px] uppercase tracking-[0.2em] opacity-80">Days</span>
                  </div>
                  <span className="text-[30px] md:text-[60px] leading-none self-start mt-2 md:mt-4 opacity-50">:</span>
                  <div className="flex flex-col items-center w-16 md:w-28">
                    <span className="text-[40px] sm:text-[50px] md:text-[80px] leading-none mb-4">{timeLeft.hours}</span>
                    <span className="text-[9px] sm:text-[11px] md:text-[13px] uppercase tracking-[0.2em] opacity-80">Hours</span>
                  </div>
                  <span className="text-[30px] md:text-[60px] leading-none self-start mt-2 md:mt-4 opacity-50">:</span>
                  <div className="flex flex-col items-center w-16 md:w-28">
                    <span className="text-[40px] sm:text-[50px] md:text-[80px] leading-none mb-4">{timeLeft.minutes}</span>
                    <span className="text-[9px] sm:text-[11px] md:text-[13px] uppercase tracking-[0.2em] opacity-80">Minutes</span>
                  </div>
                  <span className="text-[30px] md:text-[60px] leading-none self-start mt-2 md:mt-4 opacity-50 hidden sm:block">:</span>
                  <div className="flex flex-col items-center w-16 md:w-28 hidden sm:flex">
                    <span className="text-[40px] sm:text-[50px] md:text-[80px] leading-none mb-4">{timeLeft.seconds}</span>
                    <span className="text-[9px] sm:text-[11px] md:text-[13px] uppercase tracking-[0.2em] opacity-80">Seconds</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: A NOSSA HISTÓRIA */}
      {visibility.story !== false && (
        <section className="w-full bg-[#eeede7] py-24 md:py-40 px-6 overflow-hidden border-b border-[#3e3226]/5">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="flex flex-col items-center text-center mb-20 md:mb-32 z-10"
            >
              <h2 className={`${cinzel.className} text-[#3e3226] text-[18px] md:text-[24px] tracking-[0.4em] md:tracking-[0.6em] uppercase mb-[-10px] md:mb-[-20px] ml-4`}>
                {content.story?.title_our ?? "A Nossa"}
              </h2>
              <span className={`${passionsConflict.className} text-[#3e3226] text-[120px] sm:text-[150px] md:text-[220px] leading-none`}>
                {content.story?.title_history ?? "História"}
              </span>
            </motion.div>

            <div className="w-full grid md:grid-cols-2 gap-20 md:gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
                className="relative flex justify-center items-center w-full"
              >
                <div className="relative w-[85%] sm:w-[75%] max-w-[450px] md:max-w-[550px] mx-auto flex items-center justify-center mb-32 md:mb-40">
                  <div className="absolute top-[16%] left-[20%] w-[60%] h-[68%] z-0 rounded-[50%] overflow-hidden bg-[#3e3226]/5 border border-[#3e3226]/10 flex items-center justify-center">
                    {storyImageUrl ? (
                      <img src={storyImageUrl} alt="O Casal" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center opacity-40">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                         <span className={`${cinzel.className} text-[8px] uppercase tracking-widest text-[#3e3226] text-center`}>Sem Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-[55%] md:top-[50%] -right-[10%] sm:-right-[15%] w-[105%] sm:w-[115%] z-10 rotate-[-4deg]">
                    <img src="/papel-rasgado.png" alt="Papel" className="w-full h-auto drop-shadow-xl" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pt-8 sm:pt-10 md:pt-12 text-center">
                       <span className={`${passionsConflict.className} text-[#3e3226] text-[40px] sm:text-[50px] md:text-[65px] leading-[0.8] mb-2`}>
                         {casalNomes}
                       </span>
                       <span className={`${cinzel.className} text-[#3e3226] text-[9px] sm:text-[11px] md:text-[13px] tracking-[0.2em] opacity-70`}>
                         {formattedDate}
                       </span>
                    </div>
                  </div>
                  <img 
                    src="/moldura-oval.png" 
                    alt="Moldura" 
                    className="relative w-full h-auto z-20 drop-shadow-2xl pointer-events-none"
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                className="flex flex-col space-y-8 px-4 md:px-0"
              >
                {(content.story?.paragraphs || [
                  "Esta é a história de como dois caminhos improváveis se cruzaram para se tornarem num só. Tudo começou com um encontro onde o tempo pareceu parar, revelando uma ligação que ambos sabíamos, desde o primeiro olhar, ser inegável.",
                  "Ao longo dos anos, partilhámos grandes aventuras, superámos desafios de mãos dadas e construímos memórias que moldaram a nossa essência enquanto casal. Das nossas pequenas piadas internas aos momentos de maior apoio incondicional, cada instante trouxe-nos exatamente até este momento.",
                  "Agora, ao olharmos para o futuro, o que mais nos entusiasma é o próximo capítulo que vamos escrever juntos. E não faria sentido dar este passo tão importante sem o amor, o carinho e a presença da nossa família e amigos mais queridos."
                ]).map((paragraph: string, idx: number) => (
                  <p key={idx} className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] lg:text-[16px] leading-[2.2] opacity-85 text-justify`}>
                    {paragraph}
                  </p>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3.5: GALERIA EDITORIAL */}
      {visibility.gallery !== false && (
        <section className="w-full bg-[#FDFBF7] py-20 md:py-32 px-4 md:px-8 border-t border-[#3e3226]/5">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="flex flex-col items-center text-center mb-10 md:mb-20"
            >
              <h2 className={`${cinzel.className} text-[#3e3226] text-[16px] md:text-[20px] tracking-[0.4em] uppercase z-10 -mb-6 md:-mb-8 ml-4`}>
                {content.gallery?.title_our ?? "A Nossa"}
              </h2>
              <span className={`${passionsConflict.className} text-[#3e3226] text-[100px] md:text-[140px] leading-none z-0`}>
                {content.gallery?.title_gallery ?? "Galeria"}
              </span>
            </motion.div>

            {(() => {
              const userImgs = content.gallery?.images_urls || [];
              const validImgs = userImgs.filter((url: string) => url && url.trim() !== "");

              if (validImgs.length === 0) {
                return (
                  <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 opacity-60">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const isLarge = idx === 0;
                      return (
                         <div key={idx} className={`${isLarge ? 'col-span-2 md:col-span-2 h-[180px] sm:h-[300px] md:h-[450px]' : 'col-span-1 md:col-span-1 h-[140px] sm:h-[250px] md:h-[350px]'} bg-[#3e3226]/5 border border-[#3e3226]/10 flex flex-col items-center justify-center rounded-sm`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                         </div>
                      )
                    })}
                  </div>
                )
              }

              if (validImgs.length === 1) {
                return (
                  <div className="w-full max-w-4xl grid grid-cols-1 gap-2 md:gap-4">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="h-[300px] sm:h-[450px] md:h-[600px] overflow-hidden group rounded-sm shadow-sm">
                      <img src={validImgs[0]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria" />
                    </motion.div>
                  </div>
                );
              }

              if (validImgs.length === 2) {
                return (
                  <div className="w-full max-w-5xl grid grid-cols-2 gap-2 md:gap-4">
                    {validImgs.map((img: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.2 }} className="h-[250px] sm:h-[350px] md:h-[500px] overflow-hidden group rounded-sm shadow-sm">
                        <img src={img} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt={`Galeria ${i+1}`} />
                      </motion.div>
                    ))}
                  </div>
                );
              }

              if (validImgs.length === 3) {
                return (
                  <div className="w-full max-w-5xl grid grid-cols-2 gap-2 md:gap-4">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="col-span-2 h-[200px] sm:h-[350px] md:h-[500px] overflow-hidden group rounded-sm shadow-sm">
                      <img src={validImgs[0]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 1" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="col-span-1 h-[150px] sm:h-[250px] md:h-[400px] overflow-hidden group rounded-sm shadow-sm">
                      <img src={validImgs[1]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 2" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="col-span-1 h-[150px] sm:h-[250px] md:h-[400px] overflow-hidden group rounded-sm shadow-sm">
                      <img src={validImgs[2]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 3" />
                    </motion.div>
                  </div>
                );
              }

              if (validImgs.length === 4) {
                return (
                  <div className="w-full max-w-5xl grid grid-cols-2 gap-2 md:gap-4">
                    {validImgs.map((img: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} className="col-span-1 h-[150px] sm:h-[250px] md:h-[350px] overflow-hidden group rounded-sm shadow-sm">
                        <img src={img} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt={`Galeria ${i+1}`} />
                      </motion.div>
                    ))}
                  </div>
                );
              }

              return (
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }} className="col-span-2 md:col-span-2 h-[180px] sm:h-[300px] md:h-[450px] overflow-hidden group rounded-sm shadow-sm">
                    <img src={validImgs[0]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 1" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="col-span-1 md:col-span-1 h-[140px] sm:h-[250px] md:h-[450px] overflow-hidden group rounded-sm shadow-sm">
                    <img src={validImgs[1]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 2" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="col-span-1 md:col-span-1 h-[140px] sm:h-[250px] md:h-[350px] overflow-hidden group rounded-sm shadow-sm">
                    <img src={validImgs[2]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 3" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="col-span-1 md:col-span-1 h-[140px] sm:h-[250px] md:h-[350px] overflow-hidden group rounded-sm shadow-sm">
                    <img src={validImgs[3]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 4" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }} className="col-span-1 md:col-span-1 h-[140px] sm:h-[250px] md:h-[350px] overflow-hidden group rounded-sm shadow-sm">
                    <img src={validImgs[4]} className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 grayscale-[20%]" alt="Galeria 5" />
                  </motion.div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* SECTION 4: PROGRAMA */}
      {visibility.program !== false && (
        <section className="w-full bg-[#eeede7] py-20 md:py-32 px-6 flex flex-col items-center justify-center border-t border-[#3e3226]/5">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }} className="relative flex flex-col items-center text-center w-full">
            <div className="relative">
               <span className={`${passionsConflict.className} text-[#3e3226] text-[100px] sm:text-[120px] md:text-[160px] absolute -top-14 sm:-top-16 md:-top-24 -left-8 sm:-left-12 md:-left-20 z-10 leading-none opacity-90 rotate-[-2deg]`}>
                 {content.program?.title_our ?? "O Nosso"}
               </span>
               <h2 className={`${cinzel.className} text-[#3e3226] text-[35px] sm:text-[45px] md:text-[65px] tracking-[0.25em] sm:tracking-[0.3em] md:tracking-[0.4em] uppercase z-0 relative ml-4 sm:ml-8 md:ml-12 mt-8 md:mt-12`}>
                 {content.program?.title_program ?? "Programa"}
               </h2>
            </div>
          </motion.div>
          <div className="w-full max-w-3xl mt-20 md:mt-28 space-y-8 md:space-y-12">
            {(content.program?.events || timelineEvents).map((event: any, index: number) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="flex items-end justify-between w-full group">
                <span className={`${cinzel.className} text-[#3e3226] text-[12px] sm:text-[14px] md:text-[16px] tracking-widest font-medium whitespace-nowrap`}>{event.time}</span>
                <div className="flex-grow border-b-[1.5px] border-dotted border-[#3e3226]/40 mx-3 sm:mx-6 mb-[5px] sm:mb-[6px] transition-colors duration-500 group-hover:border-[#3e3226]/80"></div>
                <span className={`${cinzel.className} text-[#3e3226] text-[12px] sm:text-[14px] md:text-[16px] tracking-widest font-medium whitespace-nowrap text-right`}>{event.title}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: O EVENTO (Locais) */}
      {visibility.event !== false && (
        <section className="w-full bg-[#FDFBF7] py-24 px-6 md:px-8 border-t border-[#3e3226]/5">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="flex flex-col items-center text-center mb-16 md:mb-24">
              <span className={`${passionsConflict.className} text-[#3e3226] text-[80px] sm:text-[100px] md:text-[130px] leading-none z-0`}>
                {content.event?.title_main ?? "O Nosso Casamento"}
              </span>
            </motion.div>

            <div className="w-full flex flex-col md:flex-row gap-12 md:gap-16 items-stretch justify-center max-w-5xl">
              
              {content.event?.ceremony?.active !== false && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="flex-1 border border-[#3e3226]/10 p-8 md:p-12 rounded-sm bg-white shadow-sm flex flex-col items-center text-center">
                  <h3 className={`${cinzel.className} text-[#3e3226] text-[18px] md:text-[20px] tracking-[0.2em] font-bold uppercase mb-2`}>{content.event.ceremony.title ?? "A Cerimónia"}</h3>
                  <span className={`${cinzel.className} text-[#3e3226] text-[11px] md:text-[13px] tracking-[0.1em] uppercase opacity-60 mb-6`}>{content.event.ceremony.location ?? "Igreja de São Martinho, Sintra"}</span>
                  <span className={`${cinzel.className} text-[#B99A6E] text-[22px] md:text-[26px] tracking-[0.2em] font-medium leading-none mb-6`}>{content.event.ceremony.time ?? "13:30"}</span>
                  <p className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] leading-relaxed italic opacity-80 mb-8 max-w-xs`}>
                    {content.event.ceremony.description ?? "Testemunhem a nossa troca de votos num momento íntimo, solene e inesquecível, onde oficializaremos o nosso compromisso."}
                  </p>
                  <a href={content.event.ceremony.google_maps_url || "#"} target="_blank" rel="noopener noreferrer" className={`${cinzel.className} px-8 py-3 border border-[#3e3226]/20 text-[#3e3226] text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-[#3e3226] hover:text-[#fdfbf7] transition-all duration-300`}>Ver no Mapa</a>
                </motion.div>
              )}

              {content.event?.reception?.active !== false && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="flex-1 border border-[#3e3226]/10 p-8 md:p-12 rounded-sm bg-white shadow-sm flex flex-col items-center text-center mt-12 md:mt-0">
                  <h3 className={`${cinzel.className} text-[#3e3226] text-[18px] md:text-[20px] tracking-[0.2em] font-bold uppercase mb-2`}>{content.event.reception.title ?? "A Receção"}</h3>
                  <span className={`${cinzel.className} text-[#3e3226] text-[11px] md:text-[13px] tracking-[0.1em] uppercase opacity-60 mb-6`}>{content.event.reception.location ?? "Quinta do Vale, Sintra"}</span>
                  <span className={`${cinzel.className} text-[#B99A6E] text-[22px] md:text-[26px] tracking-[0.2em] font-medium leading-none mb-6`}>{content.event.reception.time ?? "15:00"}</span>
                  <p className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] leading-relaxed italic opacity-80 mb-8 max-w-xs`}>
                    {content.event.reception.description ?? "Juntem-se a nós para um final de tarde e noite de grande celebração, com um jantar requintado, brindes e muito baile."}
                  </p>
                  <a href={content.event.reception.google_maps_url || "#"} target="_blank" rel="noopener noreferrer" className={`${cinzel.className} px-8 py-3 border border-[#3e3226]/20 text-[#3e3226] text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-[#3e3226] hover:text-[#fdfbf7] transition-all duration-300`}>Ver no Mapa</a>
                </motion.div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: DETALHES (Cabeçalho, Logística, Alojamento, Dress Code, Presentes) */}
      {showDetailsSection && (
        <section className="w-full py-24 px-4 md:px-8 bg-[#eeede7] bg-no-repeat bg-center bg-cover border-t border-[#3e3226]/5" style={{ backgroundImage: "url('/moldura-relevo-mobile.webp')" }}>
          <div className="w-full max-w-5xl mx-auto p-6 md:p-16 flex flex-col items-center text-center">
            
            {/* CABEÇALHO DOS DETALHES */}
            {visibility.details_header !== false && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="flex flex-col items-center justify-center mb-16 md:mb-24">
                <h2 className={`${cinzel.className} text-[#3e3226] text-[16px] md:text-[22px] tracking-[0.4em] uppercase z-10 -mb-6 md:-mb-10 ml-4`}>{content.details?.title_the ?? "Os"}</h2>
                <span className={`${passionsConflict.className} text-[#3e3226] text-[110px] md:text-[160px] leading-none z-0`}>
                  {content.details?.title_details ?? "Detalhes"}
                </span>
              </motion.div>
            )}
            
            {/* Lógica Adaptável (Flex Coluna se for só 1, Grid 2 se forem 2) */}
            <div className={`w-full ${showUsefulInfo && showAccommodation ? 'grid md:grid-cols-2' : 'flex flex-col items-center'} gap-12 md:gap-16 mb-20 max-w-4xl mx-auto`}>
              
              {/* Informações Úteis (Localização) */}
              {showUsefulInfo && (
                <div className="flex flex-col items-center w-full max-w-md">
                  <h3 className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] tracking-[0.2em] font-bold uppercase mb-6`}>{content.details?.parking_title ?? "Informações Úteis"}</h3>
                  <p className={`${cinzel.className} text-[#3e3226] text-[14px] md:text-[16px] leading-relaxed italic opacity-80`}>{content.details?.parking_text ?? ""}</p>
                </div>
              )}
              
              {/* Alojamento */}
              {showAccommodation && (
                <div className="flex flex-col items-center w-full max-w-md">
                  <h3 className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] tracking-[0.2em] font-bold uppercase mb-6`}>{content.details?.accommodation_title ?? "Alojamento"}</h3>
                  <p className={`${cinzel.className} text-[#3e3226] text-[14px] md:text-[16px] leading-relaxed italic opacity-80 mb-10`}>{content.details?.accommodation_text ?? ""}</p>
                  
                  {/* Botões Dinâmicos de Alojamento */}
                  {(content.details?.accommodation_buttons && content.details.accommodation_buttons.length > 0) && (
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                      {content.details.accommodation_buttons.map((btn: any, idx: number) => (
                         <a key={idx} href={btn.url} target="_blank" rel="noopener noreferrer" className={`${cinzel.className} px-8 py-3 rounded-full bg-[#fdfbf7]/80 text-[#3e3226] text-[11px] md:text-[12px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-md transition-all text-center`}>
                           {btn.text}
                         </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Dress Code */}
            {visibility.dress_code !== false && (
              <div className="max-w-2xl flex flex-col items-center border-t border-[#3e3226]/10 pt-16 w-full">
                <span className={`${passionsConflict.className} text-[#3e3226] text-[80px] md:text-[110px] leading-none mb-8`}>{content.dress_code?.title ?? "Dress Code"}</span>
                
                {/* Ocultar paleta se desligado no Dashboard */}
                {content.dress_code?.show_palette !== false && (
                  <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 flex-wrap">
                    {(content.dress_code?.colors || ["#4A3B32", "#7A6652", "#686343", "#A1A384"]).map((color: string, idx: number) => (
                      <div key={idx} className="w-10 h-10 md:w-14 md:h-14 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                    ))}
                  </div>
                )}
                
                {(content.dress_code?.text || []).map((text: string, idx: number) => (
                  <p key={idx} className={`${cinzel.className} text-[#3e3226] text-[14px] md:text-[16px] leading-relaxed italic opacity-80 mb-6`}>{text}</p>
                ))}
              </div>
            )}

            {/* Presentes */}
            {visibility.gifts !== false && (
              <div className="max-w-2xl flex flex-col items-center border-t border-[#3e3226]/10 pt-16 mt-16 w-full">
                <h3 className={`${cinzel.className} text-[#3e3226] text-[13px] md:text-[15px] tracking-[0.2em] font-bold uppercase mb-6`}>{content.gifts?.title ?? "Presentes"}</h3>
                <p className={`${cinzel.className} text-[#3e3226] text-[14px] md:text-[16px] leading-relaxed italic opacity-80 mb-10`}>{content.gifts?.text ?? ""}</p>
                
                {/* Ocultar Botão e IBAN se desligado no Dashboard */}
                {content.gifts?.show_iban !== false && (
                  <>
                    {!showIbanData ? (
                      <button onClick={() => setShowIbanData(true)} className={`${cinzel.className} px-10 py-4 rounded-full bg-[#3e3226] text-[#fdfbf7] text-[11px] md:text-[12px] tracking-[0.2em] uppercase font-bold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                        {content.gifts?.iban_button_text ?? "Contribuir"}
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative bg-[#fdfbf7] border border-[#3e3226]/10 shadow-md p-8 md:p-12 w-full max-w-md flex flex-col items-center gap-4 rounded-sm mt-4">
                        <button onClick={() => setShowIbanData(false)} className="absolute top-4 right-4 text-[#3e3226] opacity-40 hover:opacity-100 p-2 transition-opacity" aria-label="Fechar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                        <span className={`${cinzel.className} text-[#3e3226] text-[11px] md:text-[13px] tracking-[0.2em] uppercase opacity-60`}>Titulares</span>
                        <span className={`${cinzel.className} text-[#3e3226] text-[16px] md:text-[20px] font-bold`}>{content.gifts?.iban_holders_name || casalNomes}</span>
                        <div className="w-full h-[1px] bg-[#3e3226]/10 my-2"></div>
                        <span className={`${cinzel.className} text-[#3e3226] text-[11px] md:text-[13px] tracking-[0.2em] uppercase opacity-60`}>IBAN</span>
                        <span className={`${cinzel.className} text-[#3e3226] text-[14px] sm:text-[16px] md:text-[20px] tracking-widest font-bold break-all`}>{content.gifts?.iban_value ?? ""}</span>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </section>
      )}

      {/* SECTION 7: RSVP */}
      {visibility.rsvp !== false && (
        <section className="w-full bg-[#eeede7] py-24 md:py-32 px-6 flex flex-col items-center justify-center border-t border-[#3e3226]/10">
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="flex flex-col items-center w-full">
              <div className="relative w-full flex flex-col items-center justify-center pt-16 mb-8">
                <span className={`${passionsConflict.className} text-[#3e3226] text-[140px] sm:text-[170px] md:text-[220px] absolute top-[-30px] md:top-[-50px] z-10 leading-none opacity-90`}>{content.rsvp?.title_please ?? "Por favor"}</span>
                <h2 className={`${cinzel.className} text-[#3e3226] text-[40px] sm:text-[55px] md:text-[75px] tracking-[0.15em] z-0 relative mt-10 md:mt-16`}>{content.rsvp?.title_confirm ?? "CONFIRMAR PRESENÇA"}</h2>
              </div>
              <span className={`${cinzel.className} text-[#3e3226] text-[12px] md:text-[14px] tracking-[0.4em] font-medium uppercase mt-2`}>ATÉ {rsvpFormattedDeadline}</span>
              <div className="flex items-center justify-center gap-4 my-12 w-full max-w-[280px]">
                <div className="h-[1px] flex-grow bg-[#3e3226]/40"></div>
                <span className="text-[#3e3226]/60 text-xl leading-none -mt-1">❦</span>
                <div className="h-[1px] flex-grow bg-[#3e3226]/40"></div>
              </div>
              <div className="w-full max-w-2xl bg-[#FDFBF7] p-6 md:p-12 shadow-sm border border-[#3e3226]/10 rounded-sm">
                 <SmartRsvp invitationId={data?.id || ""} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* SECTION 8: FOOTER */}
      {visibility.footer !== false && (
        <section className="relative w-full h-[70vh] min-h-[550px] flex flex-col items-center justify-center overflow-hidden border-t border-[#302720]">
          <div className="absolute inset-0 z-0 bg-[#2A231D]">
            {footerImageUrl && (
              <img src={footerImageUrl} alt="Casal Banner" className="w-full h-full object-cover object-center grayscale opacity-60" />
            )}
            <div className="absolute inset-0 bg-black/65"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 text-center">
            <h2 className={`${cinzel.className} text-[#F0E9E3] text-[14px] sm:text-[22px] md:text-[32px] tracking-[0.25em] md:tracking-[0.3em] uppercase mb-2`}>{content.footer?.title_main ?? "Mal podemos esperar para"}</h2>
            <span className={`${passionsConflict.className} text-[#FDFBF7] text-[75px] sm:text-[110px] md:text-[150px] leading-none drop-shadow-xl`}>{content.footer?.title_celebrate ?? "Celebrar convosco!"}</span>
          </div>

          <div className="absolute bottom-24 sm:bottom-28 w-full px-6 md:px-16 flex justify-between items-center z-10">
            <span className={`${cinzel.className} text-[#FDFBF7] text-[9px] sm:text-[11px] tracking-[0.3em] uppercase opacity-70`}>{footerDate}</span>
            <span className={`${cinzel.className} text-[#FDFBF7] text-[9px] sm:text-[11px] tracking-[0.3em] uppercase opacity-70`}>{content.footer?.location_text ?? "SINTRA, PORTUGAL"}</span>
          </div>

          {/* Contactos Dinâmicos - Oculta se desligado no Dashboard */}
          {content.footer?.show_contacts !== false && (
            <div className="absolute bottom-14 w-full flex justify-center gap-8 z-10 px-4">
               <div className="flex flex-col items-center">
                  <span className={`${cinzel.className} text-[#FDFBF7] text-[7px] tracking-widest uppercase opacity-40 mb-1`}>{content.footer?.contact_1_name || "Noiva"}</span>
                  <a href={`tel:${content.footer?.contact_1_phone || data?.bride_phone || ""}`} className={`${cinzel.className} text-[#FDFBF7] text-[9px] tracking-widest opacity-70 hover:opacity-100 transition-opacity`}>Contactar</a>
               </div>
               <div className="w-[1px] h-6 bg-[#FDFBF7]/20"></div>
               <div className="flex flex-col items-center">
                  <span className={`${cinzel.className} text-[#FDFBF7] text-[7px] tracking-widest uppercase opacity-40 mb-1`}>{content.footer?.contact_2_name || "Noivo"}</span>
                  <a href={`tel:${content.footer?.contact_2_phone || data?.groom_phone || ""}`} className={`${cinzel.className} text-[#FDFBF7] text-[9px] tracking-widest opacity-70 hover:opacity-100 transition-opacity`}>Contactar</a>
               </div>
            </div>
          )}

          <div className="absolute bottom-4 w-full text-center z-10">
             <span className={`${cinzel.className} text-[#FDFBF7] text-[8px] tracking-[0.5em] uppercase opacity-30`}>Wedding Studio</span>
          </div>
        </section>
      )}

    </div>
  );
}