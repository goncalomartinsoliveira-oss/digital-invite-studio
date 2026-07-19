"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_BRAND, type Brand, resolveBrandById } from "@/lib/brands";
import { supabase } from "@/lib/supabase";

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

// Sobrepõe a marca ativa pela marca de um evento específico (pelo seu brand_id).
// Usado nas superfícies de um evento (convite público, editor) para que
// mostrem o logótipo do parceiro dono do casamento. "Logo only": só troca
// o logótipo e o nome; as restantes propriedades (cores, etc.) mantêm-se.
export function EventBrandProvider({
  brandId,
  children,
}: {
  brandId?: string;
  children: React.ReactNode;
}) {
  const domain = useBrand();
  const [brand, setBrand] = useState<Brand>(domain);

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await resolveBrandById(supabase, brandId);
      if (!alive) return;
      setBrand(b ? { ...domain, id: b.id, name: b.name, logo: b.logo, logoRaster: b.logoRaster, logoAlt: b.name, contactUrl: b.contactUrl } : domain);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}
