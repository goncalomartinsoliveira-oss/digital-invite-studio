"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Modelo "Envelope" — de raiz, a pedido do casal.
// Passo 1: ecrã de entrada (envelope fechado).
// Passo 2: hero em colagem — os elementos são posicionados em percentagem
// dentro de um contentor de proporção fixa, para a composição escalar como
// um todo (as posições relativas nunca mudam, do telemóvel ao computador).

const EL = "/envelope-01/elementos";

// Proporção da tela da colagem (largura : altura). Toda a composição vive
// dentro desta caixa; mexer aqui estica tudo, por isso é o único sítio onde
// se ajusta o "comprimento" geral da página.
const CANVAS_W = 100;
const CANVAS_H = 204;

// Áreas onde entram as fotos do casal, medidas diretamente nos ficheiros
// (em % do próprio elemento, não da tela).
const POLAROID_PHOTO = { left: 6.8, top: 5.5, width: 87.2, height: 74.5 };
const ARCO_PHOTO = { left: 28, top: 11, width: 64, height: 47 };

// O corpo do arco começa a 21% do ficheiro (as flores ficam à esquerda dele),
// por isso o texto tem de ser centrado nessa zona e não no elemento inteiro.
const ARCO_BODY_INSET = 21;

type Piece = {
  src: string;
  left: number;   // % da largura da tela
  top: number;    // % da altura da tela
  width: number;  // % da largura da tela
  z: number;
};

// Posições retiradas da composição de referência. Tudo aqui é relativo à
// tela, por isso é o único sítio a mexer para reajustar o arranjo.
const PIECES: Record<string, Piece> = {
  envelopeAberto: { src: "envelope-aberto", left: 14, top: 1.5,  width: 43, z: 2 },
  molduraNomes:   { src: "moldura-nomes",   left: 48, top: 11,   width: 35, z: 3 },
  polaroidA:      { src: "polaroid",        left: 11, top: 25.5, width: 31, z: 4 },
  badgeDetalhes:  { src: "badge-detalhes",  left: 24, top: 39,   width: 41, z: 5 },
  bolo:           { src: "bolo",            left: 53, top: 43.5, width: 41, z: 4 },
  envelopeRsvp:   { src: "envelope-rsvp",   left: 14, top: 58,   width: 47, z: 6 },
  polaroidB:      { src: "polaroid",        left: 58, top: 62,   width: 31, z: 4 },
  arcoHistoria:   { src: "arco-historia",   left: 49, top: 74,   width: 39, z: 5 },
  polaroidC:      { src: "polaroid",        left: 9,  top: 80,   width: 32, z: 4 },
};

function pieceStyle(p: Piece): React.CSSProperties {
  return {
    position: "absolute",
    left: `${p.left}%`,
    top: `${p.top}%`,
    width: `${p.width}%`,
    zIndex: p.z,
  };
}

// Etiqueta "clique aqui" — repetida nos três elementos navegáveis.
function ClickLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className="block text-center uppercase"
      style={{
        fontFamily: "var(--font-jost)",
        fontSize: "clamp(5px, 1.5cqw, 11px)",
        letterSpacing: "0.22em",
        color: dark ? "rgba(255,255,255,0.75)" : "rgba(60,66,52,0.6)",
      }}
    >
      {children}
    </span>
  );
}

export default function EnvelopeTemplate({ data }: { data: any; params?: any }) {
  const [opened, setOpened] = useState(false);

  const dbContent = data?.content || {};
  const content = dbContent.content || {};

  const bride = data?.bride_name || "Noiva";
  const groom = data?.groom_name || "Noivo";

  const eventDate = data?.event_date;
  const dateLabel = eventDate
    ? new Date(eventDate)
        .toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
        .toUpperCase()
    : "";
  const place = content.hero?.location || content.footer?.location_text || "";

  const photos: string[] = (content.gallery?.images_urls || []).filter(
    (u: string) => u && u.trim() !== ""
  );
  const photoAt = (i: number) => photos[i % (photos.length || 1)] || "";

  return (
    <div className="w-full min-h-screen bg-[#FDFCF9] font-sans overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section
            key="entry"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-[#332E2B]/55 mb-5"
            >
              {content.hero?.text_above_names ?? "Recebeu um convite de"}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-6xl md:text-8xl leading-tight mb-12 px-4"
              style={{ fontFamily: "var(--font-pinyon)", color: "#332E2B" }}
            >
              {groom} &amp; {bride}
            </motion.h1>

            <motion.button
              type="button"
              onClick={() => setOpened(true)}
              aria-label="Abrir o convite"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-[300px] md:max-w-[360px] cursor-pointer"
            >
              <img
                src="/envelope-01/envelope.webp"
                alt=""
                className="w-full h-auto drop-shadow-xl select-none"
                draggable={false}
              />
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-[#332E2B]/40 mt-9"
            >
              Clique para abrir
            </motion.p>
          </motion.section>
        ) : (
          <motion.section
            key="invite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="px-4 py-10"
          >
            {/* ── HERO / COLAGEM ────────────────────────────────────────
                Tela de proporção fixa: tudo lá dentro está em %, por isso a
                composição mantém-se idêntica em qualquer largura de ecrã.
                `containerType: inline-size` permite dimensionar os textos em
                `cqw` (percentagem da largura da tela), para escalarem com a
                colagem em vez de saltarem por breakpoints. */}
            <div
              className="relative mx-auto w-full max-w-[560px]"
              style={{
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                containerType: "inline-size",
              }}
            >
              {/* Envelope aberto */}
              <img src={`${EL}/envelope-aberto.webp`} alt="" style={pieceStyle(PIECES.envelopeAberto)} className="select-none" draggable={false} />

              {/* Moldura com os nomes, data e local */}
              <div style={pieceStyle(PIECES.molduraNomes)}>
                <div className="relative">
                  <img src={`${EL}/moldura-nomes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[17%]">
                    <span
                      className="uppercase"
                      style={{
                        fontFamily: "var(--font-jost)",
                        fontSize: "clamp(3px, 0.95cqw, 8px)",
                        letterSpacing: "0.14em",
                        color: "rgba(60,66,52,0.7)",
                        lineHeight: 1.7,
                      }}
                    >
                      {content.hero?.label_intro ?? "Juntem-se a nós no casamento de"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(12px, 4.4cqw, 34px)",
                        color: "#3C4234",
                        lineHeight: 1.1,
                        margin: "4% 0",
                      }}
                    >
                      {groom} &amp; {bride}
                    </span>
                    {dateLabel && (
                      <span
                        className="uppercase"
                        style={{
                          fontFamily: "var(--font-jost)",
                          fontSize: "clamp(4px, 1.3cqw, 10px)",
                          letterSpacing: "0.18em",
                          color: "rgba(60,66,52,0.75)",
                        }}
                      >
                        {dateLabel}
                      </span>
                    )}
                    {place && (
                      <span
                        className="uppercase"
                        style={{
                          fontFamily: "var(--font-jost)",
                          fontSize: "clamp(4px, 1.3cqw, 10px)",
                          letterSpacing: "0.18em",
                          color: "rgba(60,66,52,0.75)",
                          marginTop: "2%",
                        }}
                      >
                        {place}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Polaroids — a foto entra na área cinzenta medida no ficheiro */}
              {[
                { key: "polaroidA", piece: PIECES.polaroidA, idx: 0, rotate: -3 },
                { key: "polaroidB", piece: PIECES.polaroidB, idx: 1, rotate: 2.5 },
                { key: "polaroidC", piece: PIECES.polaroidC, idx: 2, rotate: -2 },
              ].map(({ key, piece, idx, rotate }) => (
                <div key={key} style={{ ...pieceStyle(piece), transform: `rotate(${rotate}deg)` }}>
                  <div className="relative">
                    <img src={`${EL}/polaroid.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                    {photoAt(idx) && (
                      <img
                        src={photoAt(idx)}
                        alt=""
                        className="absolute object-cover select-none"
                        draggable={false}
                        style={{
                          left: `${POLAROID_PHOTO.left}%`,
                          top: `${POLAROID_PHOTO.top}%`,
                          width: `${POLAROID_PHOTO.width}%`,
                          height: `${POLAROID_PHOTO.height}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Crachá "Detalhes" — navegação */}
              <a href="#detalhes" style={pieceStyle(PIECES.badgeDetalhes)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/badge-detalhes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-[15%]">
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(13px, 5cqw, 38px)",
                        color: "#F2F0E6",
                        lineHeight: 1,
                        marginBottom: "3%",
                      }}
                    >
                      Detalhes
                    </span>
                    <ClickLabel dark>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Bolo — só decorativo */}
              <img src={`${EL}/bolo.webp`} alt="" style={pieceStyle(PIECES.bolo)} className="select-none" draggable={false} />

              {/* Envelope creme "Confirmar presença" — navegação */}
              <a href="#rsvp" style={pieceStyle(PIECES.envelopeRsvp)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/envelope-rsvp.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-[16%]">
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(11px, 4cqw, 30px)",
                        color: "#3C4234",
                        lineHeight: 1,
                        marginBottom: "3%",
                      }}
                    >
                      Confirmar Presença
                    </span>
                    <ClickLabel>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Arco "A Nossa História" — navegação */}
              <a href="#historia" style={pieceStyle(PIECES.arcoHistoria)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/arco-historia.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  {photoAt(3) && (
                    <img
                      src={photoAt(3)}
                      alt=""
                      className="absolute object-cover select-none"
                      draggable={false}
                      style={{
                        left: `${ARCO_PHOTO.left}%`,
                        top: `${ARCO_PHOTO.top}%`,
                        width: `${ARCO_PHOTO.width}%`,
                        height: `${ARCO_PHOTO.height}%`,
                        borderRadius: "999px 999px 4px 4px",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-end pb-[13%]"
                    style={{ paddingLeft: `${ARCO_BODY_INSET}%` }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(10px, 3.6cqw, 28px)",
                        color: "#F2F0E6",
                        lineHeight: 1,
                        marginBottom: "3%",
                      }}
                    >
                      A Nossa História
                    </span>
                    <ClickLabel dark>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>
            </div>

            {/* As secções de destino (#detalhes, #rsvp, #historia) entram nos
                próximos passos. */}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
