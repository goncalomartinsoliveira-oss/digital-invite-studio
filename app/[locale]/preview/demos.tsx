import type { ComponentType } from "react";
import RenaissanceBlueTemplate from "../templates/renaissance-blue-01/page";
import { DEMO_INVITATION_ID } from "@/components/invite/demoGuests";

// Convites de exemplo das salas de demonstração (/preview/<modelo>): o desenho
// e os dados fictícios de cada modelo de lib/templates.ts. Um modelo novo
// precisa de uma entrada aqui para ter sala de demonstração.
// O id do evento é DEMO_INVITATION_ID: o RSVP usa convidados fictícios e não
// grava nada (components/invite/demoGuests.ts).

// Os textos do modelo são em português (como nos outros modelos), por isso o
// exemplo também.
const RENAISSANCE_BLUE_DEMO = {
  id: DEMO_INVITATION_ID,
  groom_name: "Miguel",
  bride_name: "Sofia",
  event_date: "2027-09-18T15:00:00",
  slug: "preview",
  template_id: "renaissance-blue-01",
  content: {
    sections_visibility: {},
    content: {
      hero: {
        text_above_names: "O nosso casamento",
        location: "Quinta da Penalva, Sintra",
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
      countdown: { title: "O dia do \"Sim\" aproxima-se..." },
      story: {
        title_our: "A Nossa",
        title_history: "História",
        story_image_url: "/features/guestbook/04-casal-em-casa.jpg",
        paragraphs: [
          "Conhecemo-nos numa tarde de chuva, debaixo do mesmo toldo, sem saber que seria o início de tudo.",
          "Três anos depois, o Miguel ajoelhou-se junto ao mar e a Sofia disse que sim.",
          "Agora é a vossa vez de celebrar connosco este novo capítulo.",
        ],
      },
      program: {
        title_our: "O Nosso",
        title_program: "Programa",
        events: [
          { time: "15:00", title: "Cerimónia" },
          { time: "16:30", title: "Cocktail" },
          { time: "19:00", title: "Jantar" },
          { time: "22:00", title: "Baile" },
        ],
      },
      event: {
        title_main: "O Grande Dia",
        ceremony: { active: true, title: "Capela da Quinta", time: "15:00", location: "Quinta da Penalva, Sintra", google_maps_url: "https://maps.google.com" },
        reception: { active: true, title: "Salão dos Espelhos", time: "16:30", location: "Quinta da Penalva, Sintra", google_maps_url: "https://maps.google.com" },
      },
      details: {
        title_the: "Os",
        title_details: "Detalhes",
        parking_title: "Informações Úteis",
        parking_text: "Há estacionamento gratuito junto à quinta. Recomendamos chegar com 20 minutos de antecedência.",
        accommodation_title: "Alojamento",
        accommodation_text: "Reservámos quartos com desconto nos hotéis abaixo. Usem o código SOFIA-MIGUEL.",
        accommodation_buttons: [{ text: "Hotel Palácio", url: "https://example.com" }],
      },
      dress_code: {
        title: "Dress Code",
        text: ["Elegante de Verão — tons claros, azuis e tecidos leves."],
        show_palette: true,
        colors: ["#F2F0E6", "#7095B0", "#B8945A"],
      },
      gifts: {
        title: "Presentes",
        text: "A vossa presença é o maior presente. Quem quiser contribuir para a lua de mel pode fazê-lo aqui.",
        show_iban: true,
        iban_button_text: "Ver IBAN",
        iban_holders_name: "Sofia & Miguel",
        iban_value: "PT50 0000 0000 0000 0000 0000 0",
      },
      rsvp: {
        title_please: "Por favor",
        title_confirm: "Confirmar Presença",
        text_limit_date_fixed: "1 de agosto de 2027",
      },
      footer: {
        title_main: "Mal podemos esperar para",
        title_celebrate: "Celebrar convosco!",
        location_text: "Quinta da Penalva, Sintra",
        footer_image_url: "/features/guestbook/04-casal-em-casa.jpg",
        show_contacts: true,
        contact_1_name: "Sofia",
        contact_1_phone: "+351910000000",
        contact_2_name: "Miguel",
        contact_2_phone: "+351920000000",
      },
    },
  },
};

export type TemplateDemo = {
  Component: ComponentType<{ data: any; params?: any }>;
  data: any;
};

export const TEMPLATE_DEMOS: Record<string, TemplateDemo> = {
  "renaissance-blue-01": { Component: RenaissanceBlueTemplate, data: RENAISSANCE_BLUE_DEMO },
};
