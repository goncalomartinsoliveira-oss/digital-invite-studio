import Link from "next/link";
import NoirTemplate from "../../templates/noir-01/page";

// Demo data — populates every section of the template
const DEMO_DATA = {
  id: "preview",
  groom_name: "William",
  bride_name: "Isabella",
  event_date: "2026-09-12T16:00:00",
  slug: "preview",
  template_id: "noir-01",
  main_image_url: "",
  content: {
    sections_visibility: {
      hero: true,
      story: true,
      countdown: true,
      event: true,
      program: true,
      gallery: true,
      details_section: true,
      useful_info: true,
      accommodation: true,
      dress_code: true,
      gifts: true,
      rsvp: true,
      footer: true,
    },
    content: {
      hero: {
        text_above_names: "O casamento de",
        main_image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000",
      },
      story: {
        title_our: "A Nossa",
        title_history: "História",
        story_image_url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800",
        paragraphs: [
          "Conhecemo-nos numa tarde de chuva em Lisboa, a partilhar um guarda-chuva e um café que nenhum dos dois queria terminar.",
          "Cinco anos depois, estamos prontos para dizer 'sim' rodeados das pessoas que mais amamos.",
        ],
      },
      countdown: { title: "O dia do “Sim” aproxima-se..." },
      event: {
        title_main: "O Grande Dia",
        ceremony: { active: true, title: "Igreja de Santa Maria", time: "16:00", location: "Praça do Município, 1100-300 Lisboa", google_maps_url: "https://maps.google.com" },
        reception: { active: true, title: "Quinta da Penalva", time: "19:00", location: "Estrada Nacional 12, Sintra", google_maps_url: "https://maps.google.com" },
      },
      gallery: {
        title_gallery: "Galeria",
        images_urls: [
          "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800",
          "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800",
          "https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?q=80&w=800",
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800",
        ],
      },
      program: {
        title_program: "Programa do Dia",
        events: [
          { time: "15:30", title: "Chegada dos convidados" },
          { time: "16:00", title: "Cerimónia" },
          { time: "17:00", title: "Cocktail" },
          { time: "19:00", title: "Jantar" },
          { time: "21:30", title: "Baile" },
        ],
      },
      details: {
        title_details: "Detalhes",
        parking_title: "Informações Úteis",
        parking_text: "O local tem estacionamento gratuito para todos os convidados.",
        accommodation_title: "Alojamento",
        accommodation_text: "Reservámos um conjunto de quartos em dois hotéis parceiros próximos.",
        accommodation_buttons: [
          { text: "Hotel Palácio", url: "https://example.com" },
          { text: "Quinta Suites", url: "https://example.com" },
        ],
      },
      dress_code: {
        title: "Dress Code",
        text: ["Convidamo-vos a vestir traje formal. As senhoras, por favor evitem branco e marfim."],
        show_palette: true,
        colors: ["#2D4A3E", "#B8945A", "#EDE8DF", "#8B7355"],
      },
      gifts: {
        title: "Presentes",
        text: "A vossa presença é o maior presente. Para quem quiser contribuir para a lua de mel, deixamos aqui o nosso IBAN.",
        show_iban: true,
        iban_button_text: "Ver IBAN",
        iban_holders_name: "Isabella & William",
        iban_value: "PT50 0000 0000 0000 0000 0000 0",
      },
      rsvp: { title_confirm: "Confirmar Presença", text_limit_date_fixed: "01.07.2026" },
      footer: {
        title_main: "Mal podemos esperar para",
        title_celebrate: "Celebrar convosco!",
        location_text: "Quinta da Penalva, Sintra",
        show_contacts: true,
        contact_1_name: "Isabella",
        contact_1_phone: "+351912000001",
        contact_2_name: "William",
        contact_2_phone: "+351912000002",
        footer_image_url: "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=2000",
      },
    },
  },
};

export default async function PreviewNoir01(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[999] bg-[#2D4A3E] text-white flex items-center justify-between px-5 py-3 shadow-lg font-montserrat">
        <div className="flex items-center gap-3">
          <span className="bg-gold text-[#2D4A3E] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Preview</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Template — Editorial Noir</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`} className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">← Dashboard</Link>
          <Link href={`/${locale}/dashboard/new-invite`} className="bg-gold text-[#2D4A3E] text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-[#C9A96E] transition-colors">Use this template</Link>
        </div>
      </div>
      <div className="pt-[52px]">
        <NoirTemplate data={DEMO_DATA} />
      </div>
    </>
  );
}
