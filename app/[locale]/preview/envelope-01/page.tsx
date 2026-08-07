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
        text_above_names: "O nosso casamento",
        location: "Lago de Como, Itália",
        main_image_url: "/features/guestbook/04-casal-em-casa.jpg",
      },
      gallery: {
        title_our: "A Nossa",
        title_gallery: "Galeria",
        images_urls: [
          "/features/convidados-e-mesas/03-rsvp-sincroniza-pt.jpg",
          "/features/guestbook/03-convidado-mensagem.jpg",
          "/features/save-the-date/04-recebido.jpg",
          "/features/guestbook/04-casal-em-casa.jpg",
          "/features/photo-sharing-e-live-wall/03-mobile-galeria-pt.jpg",
        ],
      },
      countdown: {
        title: "O dia do \"Sim\" aproxima-se...",
      },
      story: {
        title_our: "A Nossa",
        title_history: "História",
        story_image_url: "/features/guestbook/04-casal-em-casa.jpg",
        paragraphs: [
          "Conhecemo-nos numa tarde de verão, sem saber que seria o início de tudo.",
          "Três anos depois, ele ajoelhou-se junto ao mar e ela disse que sim.",
          "Agora é a vossa vez de celebrar connosco este novo capítulo.",
        ],
      },
      program: {
        title_our: "O Nosso",
        title_program: "Programa",
        events: [
          { time: "16:00", title: "Cerimónia" },
          { time: "17:30", title: "Cocktail" },
          { time: "19:30", title: "Jantar" },
          { time: "22:00", title: "Baile" },
        ],
      },
      event: {
        title_main: "O Grande Dia",
        ceremony: { active: true, title: "Igreja Matriz", time: "16:00", location: "Lago de Como, Itália", google_maps_url: "https://maps.google.com" },
        reception: { active: true, title: "Villa Bellagio", time: "17:30", location: "Lago de Como, Itália", google_maps_url: "https://maps.google.com" },
      },
      details: {
        title_the: "Os",
        title_details: "Detalhes",
        parking_title: "Informações Úteis",
        parking_text: "Há estacionamento gratuito junto à villa. Recomendamos chegar com 20 minutos de antecedência.",
        accommodation_title: "Alojamento",
        accommodation_text: "Reservámos um conjunto de quartos com desconto nos hotéis parceiros abaixo.",
        accommodation_buttons: [{ text: "Hotel Lago", url: "https://example.com" }],
      },
      dress_code: {
        title: "Dress Code",
        text: ["Elegante Verão — tons claros e tecidos leves."],
        colors: ["#F2F0E6", "#6B7B5E", "#B8945A"],
      },
      gifts: {
        title: "Presentes",
        text: "A vossa presença é o maior presente. Quem quiser contribuir para a lua de mel, pode fazê-lo aqui.",
        show_iban: true,
        iban_button_text: "Ver IBAN",
        iban_value: "PT50 0000 0000 0000 0000 0000 0",
      },
      rsvp: {
        title_please: "Por favor",
        title_confirm: "Confirmar Presença",
        text_limit_date_fixed: "1 de agosto de 2026",
      },
      footer: {
        title_main: "Mal podemos esperar para",
        title_celebrate: "Celebrar convosco!",
        location_text: "Lago de Como, Itália",
        footer_image_url: "/features/guestbook/04-casal-em-casa.jpg",
        contact_1_name: "James",
        contact_1_phone: "+351910000000",
        contact_2_name: "Arabella",
        contact_2_phone: "+351920000000",
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
