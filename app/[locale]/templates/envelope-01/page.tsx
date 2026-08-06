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
const CANVAS_H = 207;

// Áreas onde entram as fotos do casal, medidas diretamente nos ficheiros
// (em % do próprio elemento, não da tela).
const POLAROID_PHOTO = { left: 6.63, top: 5.5, width: 87.43, height: 72.92 };
const ARCO_PHOTO = { left: 46.2, top: 54.9, width: 28.4, height: 21.1 };

// Forro do envelope aberto: forma exata da camada "fotografia" do ficheiro
// original (um pentágono com cantos arredondados, não um retângulo), lida
// diretamente das coordenadas do próprio path SVG e convertida em polígono
// percentual. Uma caixa retangular aproximada (a abordagem anterior) tem
// cantos que caem fora do contorno do envelope perto do bico — nessas zonas
// não há arte por cima a tapar a foto, porque ali já é fundo transparente da
// página, não o envelope. O clip-path elimina esse problema: a foto fica
// sempre recortada exatamente na forma desenhada, seja qual for a proporção
// da foto do casal.
const ENVELOPE_PHOTO_CLIP =
  "polygon(3.64% 43.75%, 3.67% 37.53%, 6.78% 32.50%, 34.56% 13.72%, 47.62% 4.95%, 52.03% 5.06%, 77.24% 21.99%, 93.01% 32.68%, 95.85% 37.20%, 95.89% 43.73%, 88.78% 45.27%, 87.15% 46.21%, 61.58% 72.24%, 38.12% 72.24%, 12.67% 46.49%, 9.96% 45.07%)";

// O corpo do arco começa a 21% do ficheiro (as flores ficam à esquerda dele),
// por isso o texto tem de ser centrado nessa zona e não no elemento inteiro.
const ARCO_BODY_INSET = 21;

// Versaletes da moldura dos nomes (intro, data, local) — mesmo tipo, tamanho
// e cor nos três, tal como na maquete: serifada (a mesma do resto do site),
// versalete com tracking largo, tom escuro e sólido (não o cinza-esverdeado
// mais claro que se usa nas etiquetas "Clique aqui").
const moldSmallCaps: React.CSSProperties = {
  fontSize: "clamp(4px, 1.05cqw, 9px)",
  letterSpacing: "0.16em",
  color: "rgba(51,46,43,0.85)",
  lineHeight: 1.5,
};

type Piece = {
  src: string;
  left: number;    // % da largura da tela
  top: number;     // % da altura da tela
  width: number;   // % da largura da tela
  z: number;
  rotate?: number; // graus
};

// Posições obtidas por correspondência de cada elemento contra a maquete
// (ver LEIA-ME na pasta dos elementos), não estimadas a olho. Tudo é
// relativo à tela, por isso é o único sítio a mexer para reajustar o arranjo.
const PIECES: Record<string, Piece> = {
  envelopeAberto: { src: "envelope-aberto", left: 17.12, top: 1.75,  width: 40.80, z: 2 },
  molduraNomes:   { src: "moldura-nomes",   left: 41.77, top: 10.31, width: 39.33, z: 3 },
  polaroidA:      { src: "polaroid",        left: 21.08, top: 27.27, width: 20.32, z: 4, rotate: -8 },
  badgeDetalhes:  { src: "badge-detalhes",  left: 19.58, top: 38.63, width: 34.75, z: 5 },
  bolo:           { src: "bolo",            left: 50.40, top: 45.10, width: 29.60, z: 4 },
  envelopeRsvp:   { src: "envelope-rsvp",   left: 20.80, top: 56.50, width: 38.80, z: 6 },
  polaroidB:      { src: "polaroid",        left: 57.32, top: 63.81, width: 20.54, z: 5, rotate: 14 },
  arcoHistoria:   { src: "arco-historia",   left: 35.34, top: 70.84, width: 42.60, z: 5 },
  polaroidC:      { src: "polaroid",        left: 20.67, top: 71.44, width: 21.59, z: 6, rotate: -8 },
  polaroidD:      { src: "polaroid",        left: 23.15, top: 83.93, width: 20.54, z: 7, rotate: 14 },
};

function pieceStyle(p: Piece): React.CSSProperties {
  return {
    position: "absolute",
    left: `${p.left}%`,
    top: `${p.top}%`,
    width: `${p.width}%`,
    zIndex: p.z,
    ...(p.rotate ? { transform: `rotate(${p.rotate}deg)` } : {}),
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

  // Foto de capa escolhida no separador "Hero" do painel — é a que entra no
  // forro do envelope aberto.
  const coverPhoto: string = content.hero?.main_image_url || "";

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
              Recebeu um convite de
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-6xl md:text-8xl mb-12 px-4"
              /* A Pinyon Script tem laçadas altas e caudas longas: com
                 entrelinha apertada, o topo e o fundo das letras ficam
                 cortados. Daí a entrelinha folgada e o padding vertical. */
              style={{
                fontFamily: "var(--font-pinyon)",
                color: "#332E2B",
                lineHeight: 1.6,
                paddingBlock: "0.15em",
              }}
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
              {/* Envelope aberto — o forro é a foto de capa do casal. O
                  ficheiro tem um buraco recortado exatamente na forma do
                  forro (a camada "fotografia" do desenho original), por
                  isso a foto colocada por baixo, em posição retangular,
                  aparece já recortada nessa forma pelo próprio desenho. */}
              <div style={pieceStyle(PIECES.envelopeAberto)}>
                <div className="relative w-full h-auto" style={{ aspectRatio: "978 / 1200" }}>
                  {coverPhoto && (
                    <img
                      src={coverPhoto}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      draggable={false}
                      style={{ clipPath: ENVELOPE_PHOTO_CLIP }}
                    />
                  )}
                  <img
                    src={`${EL}/envelope-aberto.webp`}
                    alt=""
                    className="relative w-full h-full select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Moldura com os nomes, data e local */}
              <div style={pieceStyle(PIECES.molduraNomes)}>
                <div className="relative">
                  <img src={`${EL}/moldura-nomes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  {/* As três zonas são posicionadas por `top` absoluto (como
                      nas outras peças da colagem), não por centragem flex —
                      o casal marcou a que altura exata quer cada uma numa
                      captura de ecrã do cartão real. */}
                  <div className="absolute left-0 right-0 text-center px-[15%]" style={{ top: "28%" }}>
                    <span className="uppercase font-serif" style={moldSmallCaps}>
                      {content.hero?.text_above_names || "O nosso casamento"}
                    </span>
                  </div>
                  <div className="absolute left-0 right-0 text-center px-[11%]" style={{ top: "37%" }}>
                    <span
                      /* A Pinyon Script tem laçadas altas que a entrelinha
                         apertada corta, sobretudo no "&" — daí a folga. */
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(16px, 6.2cqw, 44px)",
                        color: "#332E2B",
                        lineHeight: 1.35,
                        paddingBlock: "0.1em",
                      }}
                    >
                      {groom} &amp; {bride}
                    </span>
                  </div>
                  {(dateLabel || place) && (
                    <div className="absolute left-0 right-0 flex flex-col items-center px-[15%]" style={{ top: "68%" }}>
                      {dateLabel && (
                        <span className="uppercase font-serif" style={moldSmallCaps}>
                          {dateLabel}
                        </span>
                      )}
                      {place &&
                        place.split(",").map((line: string, i: number) => (
                          <span key={i} className="uppercase font-serif" style={moldSmallCaps}>
                            {line.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Polaroids — a foto entra na área cinzenta medida no ficheiro */}
              {[
                { key: "polaroidA", piece: PIECES.polaroidA, idx: 0 },
                { key: "polaroidB", piece: PIECES.polaroidB, idx: 1 },
                { key: "polaroidC", piece: PIECES.polaroidC, idx: 2 },
                { key: "polaroidD", piece: PIECES.polaroidD, idx: 3 },
              ].map(({ key, piece, idx }) => (
                <div key={key} style={pieceStyle(piece)}>
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
                  {/* Na maquete o título fica acima das pombas (que fazem parte
                      do desenho) e a chamada por baixo delas. */}
                  <div className="absolute left-0 right-0 flex justify-center" style={{ top: "14%" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(11px, 4.2cqw, 32px)",
                        color: "#F2F0E6",
                        lineHeight: 1,
                      }}
                    >
                      Detalhes
                    </span>
                  </div>
                  <div className="absolute left-0 right-0" style={{ top: "70%" }}>
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
                  <div className="absolute left-0 right-0 flex justify-center" style={{ top: "30%" }}>
                    <span
                      className="text-center"
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(11px, 4cqw, 30px)",
                        color: "#3C4234",
                        lineHeight: 1.05,
                      }}
                    >
                      Confirmar Presença
                    </span>
                  </div>
                  <div className="absolute left-0 right-0" style={{ top: "76%" }}>
                    <ClickLabel>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Arco "A Nossa História" — navegação */}
              <a href="#historia" style={pieceStyle(PIECES.arcoHistoria)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/arco-historia.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  {/* Ordem tirada da maquete: título em cima, foto emoldurada
                      ao centro, e a chamada no fundo. */}
                  <div
                    className="absolute left-0 right-0 flex justify-center"
                    style={{ top: "30%", paddingLeft: `${ARCO_BODY_INSET}%` }}
                  >
                    <span
                      className="text-center"
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(10px, 3.6cqw, 28px)",
                        color: "#F2F0E6",
                        lineHeight: 1.05,
                      }}
                    >
                      A Nossa História
                    </span>
                  </div>
                  {photoAt(4) && (
                    <img
                      src={photoAt(4)}
                      alt=""
                      className="absolute object-cover select-none"
                      draggable={false}
                      style={{
                        left: `${ARCO_PHOTO.left}%`,
                        top: `${ARCO_PHOTO.top}%`,
                        width: `${ARCO_PHOTO.width}%`,
                        height: `${ARCO_PHOTO.height}%`,
                        border: "2px solid #F2F0E6",
                      }}
                    />
                  )}
                  <div
                    className="absolute left-0 right-0"
                    style={{ top: "88%", paddingLeft: `${ARCO_BODY_INSET}%` }}
                  >
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
