import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATE_DEMOS } from "../demos";
import { INVITE_TEMPLATES, findTemplate } from "@/lib/templates";
import PreviewShowroom from "@/components/site/PreviewShowroom";

// Sala de demonstração de um modelo: no computador, o convite a funcionar
// dentro de um telemóvel, com o painel do modelo ao lado; no telemóvel, o
// convite em ecrã inteiro com uma barra em baixo. O convite em si vem de
// ./convite (iframe), com os dados de ../demos.tsx.

export async function generateMetadata(props: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await props.params;
  const tpl = findTemplate(id);
  if (!tpl) return {};
  return {
    title: `${tpl.name} · ${locale === "en" ? "Live invitation" : "Convite ao vivo"} | Digital Invite Studio`,
    description: tpl.desc[locale === "en" ? "en" : "pt"],
    robots: { index: false, follow: true },
  };
}

export default async function PreviewPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  const tpl = findTemplate(id);
  if (!tpl || !TEMPLATE_DEMOS[tpl.id]) notFound();
  const others = INVITE_TEMPLATES.filter(t => t.id !== tpl.id && TEMPLATE_DEMOS[t.id]).map(t => ({ id: t.id, name: t.name, phone: t.phone }));
  return (
    <PreviewShowroom
      locale={locale === "en" ? "en" : "pt"}
      template={{ id: tpl.id, name: tpl.name, desc: tpl.desc[locale === "en" ? "en" : "pt"] }}
      others={others}
    />
  );
}
