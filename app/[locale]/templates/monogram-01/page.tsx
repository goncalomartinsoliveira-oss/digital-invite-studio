"use client";
import { useBrand } from "../../../../components/site/BrandProvider";
import { PROGRAM_ICONS } from "../../../../lib/weddingCardIcons";
import { Church, Martini } from "lucide-react";

// Template à medida — feito para um casal/evento específico (parceiro
// Amazing Moon), não faz parte do seletor de templates (ver
// components/dashboard/DesignModule.tsx: AVAILABLE_TEMPLATES não inclui
// "monogram-01" de propósito, é assim que fica invisível para o resto dos
// utilizadores). Continua a ler o mesmo `content` JSON dos outros templates
// — a agência edita no painel como em qualquer evento, só o desenho é único.
//
// Referência: cartão vertical monocromático, moldura preta, monograma no
// topo, tipografia editorial. Secções conscientemente reduzidas face aos
// outros templates — segue o PDF fornecido, não o conjunto completo.

type ProgramEvent = { time: string; title: string; icon?: string };

export default function Monogram01Template({ data }: { data: any; params?: any }) {
  const brand = useBrand();
  const dbContent = data?.content || {};
  const vis = dbContent.sections_visibility || {};
  const c = dbContent.content || {};

  const bride = data?.bride_name || "Bride";
  const groom = data?.groom_name || "Groom";
  const eventDate = data?.event_date || new Date().toISOString();
  const formattedDate = new Date(eventDate)
    .toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, ".");

  const hero = c.hero || {};
  const ceremony = c.event?.ceremony || {};
  const reception = c.event?.reception || {};
  const hasCeremony = ceremony.active !== false && !!ceremony.location?.trim();
  const hasReception = reception.active !== false && !!reception.location?.trim();
  const showEvent = vis.event !== false && (hasCeremony || hasReception);

  const programEvents: ProgramEvent[] = c.program?.events || [];
  const showProgram = vis.program !== false && programEvents.length > 0;

  const ceremonyMapsUrl = hasCeremony ? ceremony.google_maps_url?.trim() : "";
  const receptionMapsUrl = hasReception ? reception.google_maps_url?.trim() : "";
  const showLinks = !!ceremonyMapsUrl || !!receptionMapsUrl;

  const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" };
  const script = { fontFamily: "var(--font-pinyon), cursive" };

  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] text-[#141211] flex justify-center py-6 px-3 sm:py-12">
      <div className="w-full max-w-[460px] border-[5px] sm:border-[6px] border-[#141211] px-6 py-12 sm:px-10 sm:py-16 text-center animate-in fade-in duration-700">

        {/* Monograma — imagem fornecida pela agência, nunca gerado por código. */}
        {hero.monogram_url && (
          <img src={hero.monogram_url} alt={`${bride} & ${groom}`} className="h-16 sm:h-20 mx-auto mb-8 object-contain" />
        )}

        {hero.text_above_names && (
          <p className="text-[11px] italic tracking-[0.12em] uppercase text-[#141211]/60 mb-8" style={serif}>
            &ldquo;{hero.text_above_names}&rdquo;
          </p>
        )}

        {hero.main_image_url && (
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden mx-auto mb-10 grayscale contrast-[1.05]">
            <img src={hero.main_image_url} alt={`${bride} & ${groom}`} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-5xl sm:text-6xl leading-[1.08] mb-8" style={serif}>
          {bride}
          <span className="block text-3xl sm:text-4xl my-0.5" style={script}>&amp;</span>
          {groom}
        </h1>

        {hero.invite_line && (
          <p className="text-[11px] tracking-[0.08em] uppercase text-[#141211]/65 leading-relaxed mb-8 whitespace-pre-line">
            {hero.invite_line}
          </p>
        )}

        <p className="text-4xl sm:text-5xl mb-10 tabular-nums" style={serif}>{formattedDate}</p>

        {showEvent && (
          <div className="text-[11px] tracking-[0.08em] uppercase leading-relaxed mb-12 space-y-1.5">
            {hasCeremony && <p>{ceremony.location}</p>}
            {hasCeremony && hasReception && (
              <p className="italic text-sm normal-case tracking-normal text-[#141211]/55 py-1" style={serif}>
                seguindo-se a receção em
              </p>
            )}
            {hasReception && <p>{reception.location}</p>}
          </div>
        )}

        {showProgram && (
          <div className="mb-12">
            <p className="text-4xl sm:text-5xl mb-9" style={script}>
              {c.program?.title_program || "Programa"}
            </p>
            <div className="space-y-8">
              {programEvents.map((ev, i) => {
                const Icon = ev.icon ? PROGRAM_ICONS[ev.icon] : null;
                return (
                  <div key={i}>
                    <p className="text-xl tabular-nums" style={serif}>{ev.time}</p>
                    {Icon && <Icon size={17} strokeWidth={1.1} className="mx-auto my-2.5 text-[#141211]/80" />}
                    <p className="italic text-[15px]" style={serif}>{ev.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showLinks && (
          <div>
            <p className="text-[10px] tracking-[0.08em] uppercase text-[#141211]/55 mb-6">
              Para descobrir mais clique nos botões:
            </p>
            <div className="flex justify-center gap-10 sm:gap-14">
              {ceremonyMapsUrl && (
                <a href={ceremonyMapsUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2.5 group">
                  <Church size={19} strokeWidth={1.1} className="group-hover:opacity-55 transition-opacity" />
                  <span className="italic text-xs" style={serif}>Cerimónia</span>
                </a>
              )}
              {receptionMapsUrl && (
                <a href={receptionMapsUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2.5 group">
                  <Martini size={19} strokeWidth={1.1} className="group-hover:opacity-55 transition-opacity" />
                  <span className="italic text-xs" style={serif}>Celebração</span>
                </a>
              )}
            </div>
          </div>
        )}

        {brand.name && (
          <p className="mt-16 text-[7px] tracking-[0.3em] uppercase text-[#141211]/25">{brand.name}</p>
        )}
      </div>
    </div>
  );
}
