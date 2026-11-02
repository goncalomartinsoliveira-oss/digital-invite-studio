"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SmartRsvp from "../../../../components/invite/SmartRsvp";

// Duplicado de "envelope-01" (template_id "envelope-01-jose-e-dalia") — à
// medida do evento de Dália & José, para abrir espaço a alterações profundas
// sem tocar no modelo original que os outros casais continuam a usar.
// Fora do seletor de propósito (não entra em AVAILABLE_TEMPLATES, em
// DesignModule.tsx): fica acessível só a quem tiver este id gravado no
// template_id do evento. Exatamente a mesma receita do template anterior,
// só que agora a partir de um modelo existente em vez de um desenho de raiz.
//
// Os comentários abaixo são os originais de "envelope-01" — deixados tal e
// qual para não perder o porquê de cada escolha; passam a descrever este
// ficheiro também, já que nasceu de uma cópia exata, byte a byte.
//
// Modelo "Envelope" — de raiz, a pedido do casal.
// Passo 1: ecrã de entrada (envelope fechado).
// Passo 2: hero em colagem — os elementos são posicionados em percentagem
// dentro de um contentor de proporção fixa, para a composição escalar como
// um todo (as posições relativas nunca mudam, do telemóvel ao computador).
// Passo 3: contador + uma secção por área, com o mesmo esquema de dados e
// interruptores de visibilidade (`sections_visibility`) dos outros modelos —
// para o painel (ContentModule) funcionar aqui sem alterações.

// Layout da hero redesenhado a pedido do casal (nov/2026) — elementos novos,
// próprios deste evento, já não os do "envelope-01" original. Pasta e
// LEIA-ME próprios: ver public/envelope-01-jose-e-dalia/elementos/LEIA-ME.md.
const EL = "/envelope-01-jose-e-dalia/elementos";

const DEFAULT_FOOTER_IMAGE = "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000&auto=format&fit=crop";
// Visual por omissão do forro do envelope, enquanto os noivos não carregam
// a própria foto de capa — o padrão floral que já vem desenhado para esse
// efeito (ver LEIA-ME).
const DEFAULT_COVER_IMAGE = `${EL}/capa-floral-default.webp`;

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
// se ajusta o "comprimento" geral da página. Medida diretamente na maquete
// completa que os noivos enviaram (748 × 2000 px): 100 / (100×2000/748).
const CANVAS_W = 100;
const CANVAS_H = 267.38;

// Forro do envelope aberto: forma exata da camada "fotografia" do ficheiro
// fonte (um pentágono com cantos arredondados, não um retângulo) — lida
// diretamente das coordenadas do próprio path SVG (clipPath "clippath" do
// ficheiro recebido) e convertida em polígono percentual (curvas Bézier
// amostradas em ~60 pontos, não aproximadas por um retângulo). O clip-path
// garante que a foto fica sempre recortada exatamente na forma desenhada,
// seja qual for a proporção da foto do casal — mesma técnica do
// "envelope-01" original, recalculada a partir do novo ficheiro.
const ENVELOPE_PHOTO_CLIP =
  "polygon(89.25% 36.62%, 55.81% 8.35%, 55.75% 8.29%, 55.59% 8.13%, 55.34% 7.89%, 55.02% 7.59%, 54.65% 7.25%, 54.26% 6.9%, 53.86% 6.56%, 53.47% 6.24%, 53.11% 5.98%, 52.8% 5.79%, 51.82% 5.33%, 50.84% 5.2%, 49.89% 5.32%, 48.99% 5.63%, 48.16% 6.07%, 47.43% 6.57%, 46.83% 7.08%, 46.36% 7.52%, 46.07% 7.83%, 45.96% 7.95%, 12.43% 36.52%, 12.3% 36.63%, 11.95% 36.96%, 11.42% 37.49%, 10.8% 38.21%, 10.14% 39.11%, 9.49% 40.18%, 8.93% 41.41%, 8.5% 42.78%, 8.28% 44.28%, 8.32% 45.9%, 8.38% 45.92%, 8.56% 45.99%, 8.83% 46.1%, 9.17% 46.26%, 9.58% 46.45%, 10.04% 46.68%, 10.52% 46.95%, 11.01% 47.26%, 11.49% 47.59%, 11.95% 47.96%, 32.62% 64.65%, 68.67% 64.54%, 90.84% 46.97%, 91.23% 46.74%, 91.61% 46.53%, 91.97% 46.34%, 92.3% 46.18%, 92.6% 46.04%, 92.86% 45.93%, 93.08% 45.84%, 93.24% 45.78%, 93.34% 45.74%, 93.38% 45.73%, 93.42% 44.12%, 93.19% 42.64%, 92.77% 41.3%, 92.2% 40.11%, 91.55% 39.08%, 90.89% 38.22%, 90.26% 37.53%, 89.74% 37.03%, 89.38% 36.73%, 89.25% 36.62%)";

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

// Posições medidas diretamente sobre a maquete completa ("template completo
// sem texto", 748 × 2000 px) que os noivos enviaram: grelha de 5% sobreposta
// à imagem, não estimadas a olho. A ordem da lista é também a ordem de
// empilhamento (z) — do fundo (envelope) para a frente, tal como na maquete.
// Tudo relativo à tela, por isso é o único sítio a mexer para reajustar o
// arranjo. Ver LEIA-ME.md na pasta dos elementos para o detalhe de cada peça.
const PIECES: Record<string, Piece> = {
  envelopeAberto:     { src: "envelope-aberto",     left: 16.9, top: 2,  width: 50, z: 1 },
  bouquetCascante:    { src: "bouquet-cascante",     left: 54.1, top: 2,  width: 34, z: 2 },
  etiquetaNomes:      { src: "etiqueta-nomes",       left: 38, top: 18, width: 48, z: 3 },
  peonia:             { src: "peonia",               left: 13, top: 28, width: 40, z: 4 },
  busto:              { src: "busto",                left: 58, top: 43, width: 25, z: 5 },
  bouquetCalla:       { src: "bouquet-calla",        left: 15, top: 42, width: 50, z: 6 },
  formaCirculo:       { src: "forma-circulo",        left: 45, top: 58, width: 43, z: 7 },
  coracaoRenda:       { src: "coracao-renda",         left: 17, top: 65, width: 47, z: 8 },
  pandeiro:           { src: "pandeiro",              left: 58, top: 65, width: 27, z: 9 },
  hortensias:         { src: "hortensias",            left: 15, top: 76, width: 41, z: 10 },
  etiquetaDetalhes:   { src: "etiqueta-detalhes",      left: 45, top: 83, width: 43, z: 11 },
  bouquetCallaFinal:  { src: "bouquet-calla",          left: 52, top: 90, width: 39, z: 12 },
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

export default function EnvelopeJoseEDaliaTemplate({ data }: { data: any; params?: any }) {
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

                Sem padding lateral não chega: as peças desta colagem vão de
                ~13% a ~91% da largura da tela (nunca 0-100%), por isso a
                tela em si tem de ficar um pouco MAIOR do que o ecrã no
                telemóvel — 115% de largura, recuada 7.5% à esquerda para
                ficar centrada — e o que sobra para lá da borda fica
                escondido pelo `overflow-x-hidden` do contentor lá em cima.
                Dá um ligeiro efeito de "zoom", mas com folga de propósito —
                a pedido do casal, as artes já não encostam à borda do ecrã
                como no "envelope-01" original (lá, a tela ia a 150%/-25%,
                zoom mais forte). A partir do `sm` volta ao tamanho normal,
                com respiro.

                NOTA: `sm:ml-0` aqui ao lado de `sm:mx-auto` tinha partido a
                centragem em desktop — as duas mexem em `margin-left` e o
                Tailwind decide qual vence pela ordem em que gera o CSS (não
                pela ordem escrita na className), e `ml-0` ganhava, deixando
                a colagem encostada à esquerda com uma faixa enorme de
                espaço vazio à direita. `mx-auto` sozinho já cobre o reset
                do `-ml-[7.5%]` do telemóvel, por isso o `ml-0` era só a
                mais — e a causa do bug. */}
            <div
              className="relative w-[115%] -ml-[7.5%] sm:mx-auto sm:w-full sm:max-w-[560px]"
              style={{
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                containerType: "inline-size",
              }}
            >
              {/* Envelope aberto — o forro é a foto de capa do casal (ou o
                  padrão floral por omissão, enquanto não carregam a
                  própria). O recorte é feito em CSS (`clip-path`, forma
                  exata do pentágono do ficheiro fonte — ver
                  ENVELOPE_PHOTO_CLIP), não por um buraco no próprio webp,
                  por isso a foto entra por cima do envelope, não por baixo. */}
              <div style={pieceStyle(PIECES.envelopeAberto)}>
                <div className="relative w-full h-auto" style={{ aspectRatio: "1103 / 1426" }}>
                  <img
                    src={`${EL}/envelope-aberto.webp`}
                    alt=""
                    className="absolute inset-0 w-full h-full select-none"
                    draggable={false}
                  />
                  <img
                    src={coverPhoto || DEFAULT_COVER_IMAGE}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    draggable={false}
                    style={{ clipPath: ENVELOPE_PHOTO_CLIP }}
                  />
                </div>
              </div>

              {/* Ramo junto ao envelope — só decorativo */}
              <img src={`${EL}/bouquet-cascante.webp`} alt="" style={pieceStyle(PIECES.bouquetCascante)} className="select-none" draggable={false} />

              {/* Etiqueta com os nomes, data e local — mesmos campos e
                  mesma lógica de texto da moldura do "envelope-01" original,
                  só que agora sobre o novo cartão em branco (sem marcador de
                  posição próprio; centrado a olho dentro da zona em branco,
                  que é larga e sem elementos decorativos a evitar). */}
              <div style={pieceStyle(PIECES.etiquetaNomes)}>
                <div className="relative">
                  <img src={`${EL}/etiqueta-nomes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div
                    className="absolute left-0 right-0 text-center px-[18%]"
                    style={{ top: "34%", transform: "translateY(-50%)" }}
                  >
                    <span className="uppercase font-serif" style={moldSmallCaps}>
                      {content.hero?.text_above_names || "O nosso casamento"}
                    </span>
                  </div>
                  <div
                    className="absolute left-0 right-0 text-center px-[12%]"
                    style={{ top: "52%", transform: "translateY(-50%)" }}
                  >
                    <span
                      /* A Pinyon Script tem laçadas altas que a entrelinha
                         apertada corta, sobretudo no "&" — daí a folga. */
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(16px, 6cqw, 42px)",
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
                      className="absolute left-0 right-0 flex flex-col items-center px-[18%]"
                      style={{ top: "71%", transform: "translateY(-50%)" }}
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

              {/* Peónia, busto, ramo, forma e coração — só decorativos */}
              <img src={`${EL}/peonia.webp`} alt="" style={pieceStyle(PIECES.peonia)} className="select-none" draggable={false} />
              <img src={`${EL}/busto.webp`} alt="" style={pieceStyle(PIECES.busto)} className="select-none" draggable={false} />
              <img src={`${EL}/bouquet-calla.webp`} alt="" style={pieceStyle(PIECES.bouquetCalla)} className="select-none" draggable={false} />
              <img src={`${EL}/forma-circulo.webp`} alt="" style={pieceStyle(PIECES.formaCirculo)} className="select-none" draggable={false} />
              <img src={`${EL}/coracao-renda.webp`} alt="" style={pieceStyle(PIECES.coracaoRenda)} className="select-none" draggable={false} />
              <img src={`${EL}/pandeiro.webp`} alt="" style={pieceStyle(PIECES.pandeiro)} className="select-none" draggable={false} />
              <img src={`${EL}/hortensias.webp`} alt="" style={pieceStyle(PIECES.hortensias)} className="select-none" draggable={false} />

              {/* Etiqueta "Detalhes" — navegação para a secção "Local",
                  mesmo papel do antigo crachá "badge-detalhes". Texto
                  deslocado para o quadrante superior do cartão: o ramo
                  final (bouquetCallaFinal) sobrepõe-se ao canto inferior
                  direito, tal como na maquete — aqui, ao contrário da
                  maquete (que não tinha texto), isso tapava o "clique
                  aqui" se ficasse centrado. */}
              <a href="#local" style={pieceStyle(PIECES.etiquetaDetalhes)} className="block group">
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  <img src={`${EL}/etiqueta-detalhes.webp`} alt="" className="w-full h-auto select-none" draggable={false} />
                  <div className="absolute w-[70%] text-center" style={{ left: "50%", top: "20%", transform: "translate(-50%, -50%)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-pinyon)",
                        fontSize: "clamp(12px, 4.4cqw, 32px)",
                        color: "#F2F0E6",
                        lineHeight: 1,
                      }}
                    >
                      Detalhes
                    </span>
                  </div>
                  <div className="absolute" style={{ left: "50%", top: "36%", transform: "translate(-50%, -50%)" }}>
                    <ClickLabel dark>Clique aqui</ClickLabel>
                  </div>
                </div>
              </a>

              {/* Ramo final — só decorativo */}
              <img src={`${EL}/bouquet-calla.webp`} alt="" style={pieceStyle(PIECES.bouquetCallaFinal)} className="select-none" draggable={false} />
            </div>

            {/* Atalhos discretos para "Confirmar Presença" e "A Nossa
                História" — sem equivalente visual na nova colagem (só
                "Detalhes"/Local tem), mas a pedido do casal mantêm-se
                acessíveis a partir daqui, em vez de só por scroll normal.
                `relative z-20`: sem isto, ficava tapada pelo ramo final da
                colagem — um `div` com `position:relative` pinta sempre por
                cima de um irmão seguinte sem posição própria, seja qual for
                a ordem no DOM; só dando posição + z-index à navegação é que
                a ordem normal (o que vem depois fica por cima) passa a
                valer. Encostados à esquerda (não centrados): o ramo final
                invade o lado direito da faixa por baixo da colagem, por
                isso texto centrado caía em cima das flores, difícil de ler. */}
            <nav className="relative z-20 flex flex-col items-start gap-2 pt-7 pb-2 pl-8 pr-6">
              <a
                href="#rsvp"
                className="uppercase font-serif transition-opacity hover:opacity-60"
                style={{ fontSize: "10px", letterSpacing: "0.22em", color: T.accent }}
              >
                Confirmar Presença
              </a>
              <a
                href="#historia"
                className="uppercase font-serif transition-opacity hover:opacity-60"
                style={{ fontSize: "10px", letterSpacing: "0.22em", color: T.accent }}
              >
                A Nossa História
              </a>
            </nav>

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
              <div id="rsvp" className="scroll-mt-6" style={{ background: T.surface }}>
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
                <SmartRsvp invitationId={data?.id || ""} hideHeader />
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
