import Link from "next/link";
import Minimal01Template from "../../templates/minimal-01/page";

// Demo data — populates every section of the template
const DEMO_DATA = {
  id: "preview",
  groom_name: "William",
  bride_name: "Isabella",
  event_date: "2026-09-12T16:00:00",
  slug: "preview",
  template_id: "minimal-01",
  main_image_url: "",
  content: {
    sections_visibility: {
      hero: true,
      story: true,
      countdown: true,
      event: true,
      program: true,
      gallery: false,
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
        text_above_names: "The Wedding of",
        main_image_url: "",
      },
      story: {
        title_history: "Dear Friends and Family,",
        paragraphs: [
          "We met on a rainy afternoon in Lisbon, over a shared umbrella and a cup of espresso that neither of us wanted to finish. Five years later, we are ready to say 'I do' surrounded by the people who mean the most to us.",
          "Your love and support have shaped our journey, and we cannot imagine beginning this new chapter without you by our side. We are counting the days.",
        ],
        story_image_url: "",
      },
      countdown: {
        title: "The Celebration Begins In",
      },
      event: {
        title_main: "Ceremony & Celebration",
        ceremony: {
          active: true,
          title: "Wedding Ceremony",
          time: "16:00",
          location: "Igreja de Santa Maria, Praça do Município, 1100-300 Lisboa",
          google_maps_url: "https://maps.google.com",
        },
        reception: {
          active: true,
          title: "Wedding Reception",
          time: "19:00",
          location: "Quinta da Penalva, Estrada Nacional 12, Sintra, Portugal",
          google_maps_url: "https://maps.google.com",
        },
      },
      program: {
        title_program: "Schedule of Events",
        events: [
          { time: "15:30", title: "Guest Arrival" },
          { time: "16:00", title: "Wedding Ceremony" },
          { time: "17:00", title: "Cocktail Hour" },
          { time: "19:00", title: "Dinner Reception" },
          { time: "21:00", title: "First Dance" },
          { time: "21:30", title: "Celebration & Party" },
        ],
      },
      details: {
        title_details: "Good to Know",
        parking_title: "Getting There",
        parking_text:
          "The venue has complimentary parking available for all guests. For those travelling from Lisbon, a shuttle service will run every 30 minutes from Marquês de Pombal.",
        accommodation_title: "Where to Stay",
        accommodation_text:
          "We have reserved a block of rooms at two partner hotels nearby. Please use the code WILLIAM-ISABELLA when booking to receive our exclusive rate.",
        accommodation_buttons: [
          { text: "Hotel Palácio", url: "https://example.com" },
          { text: "Quinta Suites", url: "https://example.com" },
        ],
      },
      dress_code: {
        title: "Dress Code",
        text: [
          "We invite you to dress in black tie attire. Ladies are encouraged to avoid white and ivory.",
          "The celebration will take place partly outdoors — comfortable footwear is recommended for the garden cocktail hour.",
        ],
        show_palette: true,
        colors: ["#2D4A3E", "var(--color-gold)", "#EDE8DF", "#8B7355", "#D4C5B0"],
      },
      gifts: {
        title: "Gifts",
        text: "Your presence is truly the greatest gift. For those who wish to contribute to our honeymoon adventure, we have set up a small fund.",
        show_iban: true,
        iban_button_text: "Contribute to Our Honeymoon",
        iban_holders_name: "Isabella & William",
        iban_value: "PT50 0000 0000 0000 0000 0000 0",
      },
      rsvp: {
        title_confirm: "Will You Join Us?",
        text_limit_date_fixed: "01.07.2026",
      },
      footer: {
        title_main: "We hope to see you there",
        title_celebrate: "Isabella & William",
        location_text: "Quinta da Penalva, Sintra · 12 September 2026",
        show_contacts: true,
        contact_1_name: "Isabella",
        contact_1_phone: "+351 912 000 001",
        contact_2_name: "William",
        contact_2_phone: "+351 912 000 002",
        footer_image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000",
      },
    },
  },
};

export default async function PreviewMinimal01(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  return (
    <>
      {/* ── Preview banner ─────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[999] bg-[#2D4A3E] text-white flex items-center justify-between px-5 py-3 shadow-lg font-montserrat">
        <div className="flex items-center gap-3">
          <span className="bg-gold text-[#2D4A3E] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            Preview
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Template — Minimal 01
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
          <Link
            href={`/${locale}/dashboard/new-invite`}
            className="bg-gold text-[#2D4A3E] text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-[#C9A96E] transition-colors"
          >
            Use this template
          </Link>
        </div>
      </div>

      {/* ── Template (offset for banner) ───────────────────── */}
      <div className="pt-[52px]">
        <Minimal01Template data={DEMO_DATA} />
      </div>
    </>
  );
}
