"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

// Modelo "Envelope" — de raiz, a pedido do casal.
// Passo 1: ecrã de entrada (envelope fechado).
// Passo 2: hero em colagem — os elementos são posicionados em percentagem
// dentro de um contentor de proporção fixa, para a composição escalar como
// um todo (as posições relativas nunca mudam, do telemóvel ao computador).
// Passo 3: contador + uma secção por área, com o mesmo esquema de dados e
// interruptores de visibilidade (`sections_visibility`) dos outros modelos —
// para o painel (ContentModule) funcionar aqui sem alterações.

const EL = "/envelope-01/elementos";

const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";

// Paleta das secções de baixo (tudo o que não é a colagem) — o mesmo tom
// creme/tinta/oliva já usado na colagem, para as duas partes lerem como um
// só convite. Ainda sem `supportsTheme` no painel (DesignModule), mas o
// `theme?.accent` é lido na mesma, para já não ter de mexer aqui se/quando
// se ligar o seletor de cor.
const BASE_T = {
  bg: "#FDFCF9",
  heading: "#332E2B",
  text: "#4A453F",
  muted: "rgba(51,46,43,0.6)",
  accent: "#6B7B5E",
  surface: "#F2F0E6",
  border: "#332E2B",
};

// Proporção da tela da colagem (largura : altura). Toda a composição vive
// dentro desta caixa; mexer aqui estica tudo, por isso é o único sítio onde
// se ajusta o "comprimento" geral da página.
const CANVAS_W = 100;
const CANVAS_H = 207;

// Áreas onde entram as fotos do casal, medidas diretamente nos ficheiros
// (em % do próprio elemento, não da tela).
const POLAROID_PHOTO = { left: 6.63, top: 5.5, width: 87.43, height: 72.92 };
// Camada "fotografia" de elementos/"POSICIONAMENTO elementos (5).svg" — um
// retângulo simples (sem rotação), por isso basta a caixa, sem clip-path.
const ARCO_PHOTO = { left: 42.61, top: 50.89, width: 34.66, height: 26.15 };

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

// Contador para a data do evento — mesmo relógio dos outros modelos.
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
    <div className="flex justify-center gap-6 md:gap-10 mt-8">
      {([["dias", diff.days], ["horas", diff.hours], ["min", diff.minutes], ["seg", diff.seconds]] as const).map(([l, v]) => (
        <div key={l} className="text-center">
          <p className="font-serif text-3xl md:text-4xl" style={{ color: BASE_T.heading }}>{String(v).padStart(2, "0")}</p>
          <p className="font-serif text-[10px] tracking-[0.25em] uppercase mt-1" style={{ color: BASE_T.muted }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export default function EnvelopeTemplate({ data }: { data: any; params?: any }) {
  const [opened, setOpened] = useState(false);

  const dbContent = data?.content || {};
  const visibility = dbContent.sections_visibility || {};
  const content = dbContent.content || {};
  const T = { ...BASE_T, accent: dbContent.theme?.accent || BASE_T.accent };

  const bride = data?.bride_name || "Noiva";
  const groom = data?.groom_name || "Noivo";

  const eventDate = data?.event_date || new Date().toISOString();
  const dateLabel = data?.event_date
    ? new Date(data.event_date)
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
  const footerImg = content.footer?.footer_image_url || DEFAULT_FOOTER_IMAGE;

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

  const [detailTab, setDetailTab] = useState<"ceremony" | "reception">(
    ceremonyActive ? "ceremony" : "reception"
  );
  const [showIban, setShowIban] = useState(false);

  // Título de secção no mesmo espírito da moldura dos nomes: versaletes
  // serifados em cima, título grande em Pinyon Script em baixo.
  function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
    return (
      <div className="text-center mb-12">
        {eyebrow && (
          <p className="uppercase font-serif mb-3" style={{ fontSize: "11px", letterSpacing: "0.3em", color: T.accent }}>
            {eyebrow}
          </p>
        )}
        <h2 style={{ fontFamily: "var(--font-pinyon)", fontSize: "clamp(32px, 6vw, 50px)", color: T.heading, lineHeight: 1.3, paddingBlock: "0.08em" }}>
          {children}
        </h2>
      </div>
    );
  }

  const wrap = "max-w-lg mx-auto md:max-w-2xl";

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
            className="px-0 py-10 sm:px-4"
          >
            {/* ── HERO / COLAGEM ────────────────────────────────────────
                Tela de proporção fixa: tudo lá dentro está em %, por isso a
                composição mantém-se idêntica em qualquer largura de ecrã.
                `containerType: inline-size` permite dimensionar os textos em
                `cqw` (percentagem da largura da tela), para escalarem com a
                colagem em vez de saltarem por breakpoints.

                Sem padding lateral não chega para as artes baterem quase na
                borda: as peças em si já têm folga própria (o desenho vai só
                de ~17% a ~81% da largura da tela, nunca 0-100%), por isso a
                tela em si tem de ficar MAIOR do que o ecrã no telemóvel — 150%
                de largura, recuada 25% à esquerda para ficar centrada — e o
                que sobra para lá da borda fica escondido pelo
                `overflow-x-hidden` do contentor lá em cima. Dá o efeito de
                "zoom": as peças passam a encostar quase à borda do ecrã, à
                custa de mais altura total (mais scroll) — como pedido. A
                partir do `sm` volta ao tamanho normal, com respiro.

                NOTA: `sm:ml-0` aqui ao lado de `sm:mx-auto` tinha partido a
                centragem em desktop — as duas mexem em `margin-left` e o
                Tailwind decide qual vence pela ordem em que gera o CSS (não
                pela ordem escrita na className), e `ml-0` ganhava, deixando
                a colagem encostada à esquerda com uma faixa enorme de
                espaço vazio à direita. `mx-auto` sozinho já cobre o reset
                do `-ml-[25%]` do telemóvel, por isso o `ml-0` era só a
                mais — e a causa do bug. */}
            <div
              className="relative w-[150%] -ml-[25%] sm:mx-auto sm:w-full sm:max-w-[560px]"
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
                  {/* As três zonas ficam centradas exatamente nos pontos que
                      o casal marcou num ficheiro de referência próprio
                      (elementos/"exemplo de posicionamentos.svg", com 3
                      camadas de texto "O NOSSO CASAMENTO" / "NOME NOIVOS" /
                      "DATA CASAMENTO"). As posições desse SVG usam uma
                      rotação (writing-mode vertical) — convertidas para o
                      sistema de coordenadas normal e depois confirmadas por
                      medição de pixel numa renderização à parte, dão:
                      43% / 59% / 79% da altura do cartão, sempre ao centro.
                      `translateY(-50%)` centra cada bloco nesse ponto, em
                      vez de o ponto ser o topo do bloco. */}
                  <div
                    className="absolute left-0 right-0 text-center px-[15%]"
                    style={{ top: "43%", transform: "translateY(-50%)" }}
                  >
                    <span className="uppercase font-serif" style={moldSmallCaps}>
                      {content.hero?.text_above_names || "O nosso casamento"}
                    </span>
                  </div>
                  <div
                    className="absolute left-0 right-0 text-center px-[11%]"
                    style={{ top: "59%", transform: "translateY(-50%)" }}
                  >
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
                    <div
                      className="absolute left-0 right-0 flex flex-col items-center px-[15%]"
                      style={{ top: "79%", transform: "translateY(-50%)" }}
                    >
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

              {/* Crachá "Local" — navegação. Título e "clique aqui" centrados
                  exatamente nos pontos marcados em
                  elementos/"POSICIONAMENTO novo-badge-detalhes.svg". */}
              <a href="#local" style={pieceStyle(PIECES.badgeDetalhes)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/badge-detalhes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute w-[70%] text-center" style={{ left: "50%", top: "28.8%", transform: "translate(-50%, -50%)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(11px, 4.2cqw, 32px)",
                        color: "#F2F0E6",
                        lineHeight: 1,
                      }}
                    >
                      Local
                    </span>
                  </div>
                  <div className="absolute" style={{ left: "50.9%", top: "66.8%", transform: "translate(-50%, -50%)" }}>
                    <ClickLabel dark>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Bolo — só decorativo */}
              <img src={`${EL}/bolo.webp`} alt="" style={pieceStyle(PIECES.bolo)} className="select-none" draggable={false} />

              {/* Envelope creme "Confirmar presença" — navegação. Mesma
                  lógica, a partir de elementos/"POSICIONAMENTO elementos (4).svg". */}
              <a href="#rsvp" style={pieceStyle(PIECES.envelopeRsvp)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/envelope-rsvp.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute w-[70%] text-center" style={{ left: "50%", top: "32.8%", transform: "translate(-50%, -50%)" }}>
                    <span
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
                  <div className="absolute" style={{ left: "52.5%", top: "84.4%", transform: "translate(-50%, -50%)" }}>
                    <ClickLabel>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Arco "A Nossa História" — navegação. Título, foto e "clique
                  aqui" a partir de elementos/"POSICIONAMENTO elementos (5).svg"
                  — o corpo do arco fica à direita das flores, por isso o
                  centro do texto não é o centro do elemento (~60%, não 50%).
                  A zona da foto é a camada "fotografia" desse ficheiro,
                  medida diretamente (retângulo simples, sem rotação). */}
              <a href="#historia" style={pieceStyle(PIECES.arcoHistoria)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/arco-historia.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute w-[55%] text-center" style={{ left: "59.6%", top: "37.4%", transform: "translate(-50%, -50%)" }}>
                    <span
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
                  <div className="absolute" style={{ left: "60.3%", top: "92.8%", transform: "translate(-50%, -50%)" }}>
                    <ClickLabel dark>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>
            </div>

            {/* ── CONTADOR ────────────────────────────────────────────── */}
            {visibility.countdown !== false && (
              <section className="px-6 pt-14 pb-6 text-center">
                <p className="font-serif italic text-lg md:text-xl" style={{ color: T.heading }}>
                  {content.countdown?.title ?? "O dia do “Sim” aproxima-se..."}
                </p>
                <Countdown date={eventDate} />
              </section>
            )}

            {/* ── A NOSSA HISTÓRIA ───────────────────────────────────── */}
            {visibility.story !== false && (
              <section id="historia" className="px-6 py-20 scroll-mt-6">
                <div className={wrap}>
                  <SectionTitle eyebrow="O início">
                    {(content.story?.title_our ?? "A Nossa")} {(content.story?.title_history ?? "História")}
                  </SectionTitle>
                  {content.story?.story_image_url && (
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden mx-auto mb-10 border-4 border-white shadow-sm">
                      <img src={content.story.story_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {storyParagraphs.length > 0 && (
                    <div className="space-y-6">
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

            {/* ── GALERIA ─────────────────────────────────────────────── */}
            {visibility.gallery !== false && photos.length > 0 && (
              <section className="py-20" style={{ background: T.surface }}>
                <div className={`${wrap} px-6 mb-10`}>
                  <SectionTitle eyebrow="Momentos">{(content.gallery?.title_our ?? "A Nossa")} {(content.gallery?.title_gallery ?? "Galeria")}</SectionTitle>
                </div>
                <div className="max-w-2xl mx-auto w-full px-3">
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((src, i) => (
                      <div key={src + i} className={`overflow-hidden rounded-2xl ${i % 3 === 0 ? "col-span-2 h-64" : "h-48"}`}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── PROGRAMA ────────────────────────────────────────────── */}
            {visibility.program !== false && (
              <section className="px-6 py-20">
                <div className={wrap}>
                  <SectionTitle eyebrow="A agenda">{(content.program?.title_our ?? "O Nosso")} {(content.program?.title_program ?? "Programa")}</SectionTitle>
                  <div className="max-w-sm mx-auto">
                    {programEvents.map((item, i) => {
                      const last = i === programEvents.length - 1;
                      return (
                        <div key={i} className="flex gap-5">
                          <div className="flex flex-col items-center">
                            <div className="w-px flex-1" style={{ background: `${T.accent}55`, visibility: i === 0 ? "hidden" : "visible" }} />
                            <span className="my-1.5 inline-block rotate-45" style={{ width: 7, height: 7, border: `1px solid ${T.accent}` }} />
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

            {/* ── LOCAL (cerimónia & receção) ─────────────────────────── */}
            {visibility.event !== false && (ceremonyActive || receptionActive) && (
              <section id="local" className="px-6 py-20 scroll-mt-6" style={{ background: T.surface }}>
                <div className={wrap}>
                  <SectionTitle eyebrow="Onde &amp; quando">{content.event?.title_main ?? "O Grande Dia"}</SectionTitle>
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

            {/* ── DETALHES: informações úteis / alojamento / dress code / presentes ── */}
            {showDetailsSection && (
              <section className="px-6 py-20">
                <div className={wrap}>
                  <SectionTitle eyebrow="Para ficar">{(content.details?.title_the ?? "Os")} {(content.details?.title_details ?? "Detalhes")}</SectionTitle>

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

            {/* ── CONFIRMAR PRESENÇA ─────────────────────────────────── */}
            {visibility.rsvp !== false && (
              <div style={{ background: T.surface }}>
                <div className="px-6 pt-20">
                  <div className={wrap}>
                    <SectionTitle eyebrow="Contamos convosco">{(content.rsvp?.title_please ?? "Por favor")} {(content.rsvp?.title_confirm ?? "Confirmar Presença")}</SectionTitle>
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

            {/* ── RODAPÉ ──────────────────────────────────────────────── */}
            {visibility.footer !== false && (
              <section className="relative px-6 py-24 overflow-hidden text-center" style={{ background: "#000" }}>
                <div className="absolute inset-0">
                  <img src={footerImg} alt="" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.55))" }} />
                </div>
                <div className="relative max-w-lg mx-auto md:max-w-2xl">
                  <p className="text-[11px] tracking-[0.25em] uppercase text-white/70 mb-2">{content.footer?.title_main ?? "Mal podemos esperar para"}</p>
                  <p style={{ fontFamily: "var(--font-pinyon)", fontSize: "clamp(30px, 5vw, 42px)", color: "#fff", lineHeight: 1.3, paddingBlock: "0.08em" }} className="mb-4">
                    {content.footer?.title_celebrate ?? "Celebrar convosco!"}
                  </p>
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
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
