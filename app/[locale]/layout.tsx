import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { headers, cookies } from "next/headers";
import "../globals.css";

// Usando caminhos relativos exatos para evitar o erro de "Module not found"
import Navbar from "../../components/site/Navbar";
import Footer from "../../components/site/Footer";
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

export const metadata: Metadata = {
  title: "Digital Invite Studio | Luxury Invitations",
  description: "Convites digitais sofisticados para momentos inesquecíveis.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

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

        <Navbar brand={brand} />

        <main className="flex-grow">
          {children}
        </main>

        <Footer brand={brand} />

      </body>
    </html>
  );
}