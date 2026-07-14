"use client";
import { createContext, useContext } from "react";
import { DEFAULT_BRAND, type Brand } from "@/lib/brands";

// Contexto para expor a marca ativa a componentes client (dashboard, login,
// páginas de convidados, templates). O valor vem do layout (servidor), que já
// resolveu a marca pelo domínio — por isso não há "flash" na 1ª renderização.
const BrandContext = createContext<Brand>(DEFAULT_BRAND);

export function BrandProvider({
  brand,
  children,
}: {
  brand: Brand;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}
