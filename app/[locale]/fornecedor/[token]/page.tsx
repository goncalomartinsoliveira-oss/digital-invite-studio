import { Clock, UtensilsCrossed } from "lucide-react";
import { loadVendorPortalData } from "@/lib/vendorPortal";

// Página pública do fornecedor — sem sessão, sem conta DIS. O token já é o
// controlo de acesso (ver 0005_vendor_portal.sql); esta página só decide
// como mostrar o que lib/vendorPortal.ts devolveu. "fixed inset-0" para
// cobrir o Navbar/Footer do site, mesmo padrão do /rsvp público.
export default async function VendorPortalPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const en = locale === "en";
  const data = await loadVendorPortalData(token);

  if (!data) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream flex items-center justify-center flex-col text-center p-6">
        <h1 className="font-serif text-3xl text-brand mb-2">
          {en ? "Link unavailable" : "Link indisponível"}
        </h1>
        <p className="text-gray-500 font-montserrat text-sm max-w-xs">
          {en
            ? "This link has expired or was revoked. Ask the agency for a new one."
            : "Este link expirou ou foi revogado. Peça um novo à agência."}
        </p>
      </div>
    );
  }

  const dateLabel = data.eventDate
    ? new Date(data.eventDate).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="fixed inset-0 z-[100] bg-cream overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-12 sm:py-16">
        <header className="text-center mb-10">
          {data.brand?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.brand.logo} alt={data.brand.name} className="h-12 mx-auto mb-4 object-contain" />
          ) : (
            <p className="font-serif text-2xl text-brand mb-4">{data.brand?.name || "Digital Invite Studio"}</p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {en ? "Vendor Portal" : "Portal do Fornecedor"}
          </p>
          <h1 className="font-serif text-3xl text-ink mt-2">
            {data.groomName} &amp; {data.brideName}
          </h1>
          {dateLabel && <p className="text-sm text-gray-400 mt-1 font-montserrat">{dateLabel}</p>}
        </header>

        {data.catering && (
          <section className="bg-white rounded-[2rem] shadow-md border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed size={18} className="text-brand" />
              <h2 className="font-serif text-xl text-ink">{en ? "Catering" : "Catering"}</h2>
            </div>
            <p className="text-sm text-gray-500 font-montserrat">
              {en ? "Confirmed guests: " : "Convidados confirmados: "}
              <span className="font-bold text-ink">{data.catering.confirmedGuests}</span>
            </p>
            {Object.keys(data.catering.dietary).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(data.catering.dietary).map(([tag, count]) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold uppercase tracking-widest bg-cream text-gray-500 px-3 py-1.5 rounded-full"
                  >
                    {tag} · {count}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="bg-white rounded-[2rem] shadow-md border border-gray-100 p-6">
          <h2 className="font-serif text-xl text-ink mb-5">{en ? "Day Timeline" : "Cronograma do Dia"}</h2>
          {data.timeline.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center font-montserrat">
              {en ? "No schedule published yet." : "Ainda sem cronograma publicado."}
            </p>
          ) : (
            <div className="space-y-1">
              {data.timeline.map((block, i) => {
                const last = i === data.timeline.length - 1;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <Clock size={14} className="text-brand" />
                      {!last && <div className="w-px flex-1 min-h-[2rem] bg-gray-100 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <p className="text-xs font-bold text-gray-400 tabular-nums">
                        {block.start}
                        {block.end ? ` – ${block.end}` : ""}
                      </p>
                      <p className="text-sm font-semibold text-ink mt-0.5">{block.title}</p>
                      {block.notes && <p className="text-xs text-gray-400 mt-0.5">{block.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-[10px] text-gray-300 uppercase tracking-widest mt-10 font-montserrat">
          {en ? "Generated with Digital Invite Studio" : "Gerado com Digital Invite Studio"}
        </p>
      </div>
    </div>
  );
}
