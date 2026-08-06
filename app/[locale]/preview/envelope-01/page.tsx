import Link from "next/link";
import EnvelopeTemplate from "../../templates/envelope-01/page";

// Demo data — só o necessário para o ecrã de entrada (passo 1)
const DEMO_DATA = {
  id: "preview",
  groom_name: "James",
  bride_name: "Arabella",
  event_date: "2026-09-12T16:00:00",
  slug: "preview",
  template_id: "envelope-01",
  content: {
    sections_visibility: {},
    content: {
      hero: {
        text_above_names: "Recebeu um convite de",
        label_intro: "Juntem-se a nós no casamento de",
        location: "Lago de Como, Itália",
        main_image_url: "/features/guestbook/04-casal-em-casa.jpg",
      },
      gallery: {
        images_urls: [
          "/features/convidados-e-mesas/03-rsvp-sincroniza-pt.jpg",
          "/features/guestbook/03-convidado-mensagem.jpg",
          "/features/save-the-date/04-recebido.jpg",
          "/features/guestbook/04-casal-em-casa.jpg",
        ],
      },
    },
  },
};

export default async function PreviewEnvelope01(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[999] bg-[#2D4A3E] text-white flex items-center justify-between px-5 py-3 shadow-lg font-montserrat">
        <div className="flex items-center gap-3">
          <span className="bg-gold text-[#2D4A3E] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Preview</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Template — Envelope (passo 1: ecrã de entrada)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`} className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </div>
      {/* Folga para a barra de pré-visualização + a navbar fixa do site */}
      <div className="pt-[170px]">
        <EnvelopeTemplate data={DEMO_DATA} />
      </div>
    </>
  );
}
