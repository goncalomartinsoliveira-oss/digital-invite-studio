import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Pinyon_Script } from "next/font/google"; // 1. Adicionada Pinyon_Script
import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// 2. Configurada a fonte Pinyon Script
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400", // Pinyon Script só suporta o peso 400
  variable: "--font-pinyon",
});

export const metadata: Metadata = {
  title: "Digital Invite Studio | Luxury Invitations",
  description: "Convites digitais sofisticados para momentos inesquecíveis.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      {/* 3. Adicionada pinyon.variable à lista de classes do body */}
      <body className={`${cormorant.variable} ${inter.variable} ${pinyon.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}