import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { headers, cookies } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";

// Usando caminhos relativos exatos para evitar o erro de "Module not found"
import Navbar from "../../components/site/Navbar";
import Footer from "../../components/site/Footer";
import { BrandProvider } from "../../components/site/BrandProvider";
import { resolveBrand } from "../../lib/brands";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "500", "600", "700"],
});

const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400", 
  variable: "--font-pinyon",
});

const HOME_SEO = {
  pt: {
    title: "Digital Invite Studio | Convite Digital, RSVP, Convidados, Mesas e Fotos",
    description: "A plataforma que os vossos convidados vão usar do início ao fim: convite digital, RSVP inteligente, lista de convidados e plano de mesas, partilha de fotos e guestbook, tudo num único link.",
  },
  en: {
    title: "Digital Invite Studio | Digital Invitation, RSVP, Guests, Seating & Photos",
    description: "The platform your guests will actually use, start to finish: digital invitation, smart RSVP, guest list and seating chart, photo sharing and guestbook, all in one link.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const h = await headers();
  const c = await cookies();
  const brand = resolveBrand(h.get("host") ?? "", c.get("brand")?.value);
  // Search Console/Analytics são só da DIS — não faz sentido verificar ou
  // medir o tráfego de um domínio de parceiro como se fosse nosso.
  const isDis = brand.id === "dis";
  const seo = HOME_SEO[locale === "pt" ? "pt" : "en"];
  const host = h.get("host") || "www.digitalinvitestudio.com";
  return {
    metadataBase: new URL(`https://${host}`),
    title: isDis ? seo.title : brand.name,
    description: isDis ? seo.description : brand.tagline,
    icons: brand.favicon
      ? { icon: brand.favicon, apple: brand.favicon }
      : {
          icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon.svg", type: "image/svg+xml" },
          ],
          apple: "/apple-touch-icon.png",
        },
    verification: isDis && process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Marca ativa (white-label): resolvida pelo domínio, com override por cookie
  // para testar antes de o subdomínio estar configurado.
  const h = await headers();
  const c = await cookies();
  const brand = resolveBrand(h.get("host") ?? "", c.get("brand")?.value);

  return (
    <html lang={locale} data-brand={brand.id}>
      <body className={`${cormorant.variable} ${jost.variable} ${pinyon.variable} antialiased flex flex-col min-h-screen`}>
        <BrandProvider brand={brand}>

          <Navbar brand={brand} />

          <main className="flex-grow">
            {children}
          </main>

          <Footer brand={brand} />

        </BrandProvider>
        {brand.id === "dis" && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}