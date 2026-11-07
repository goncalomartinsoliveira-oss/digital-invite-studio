// Esquemas de conteúdo dos modelos de convite: que campos o editor
// (ContentModule) mostra em cada secção e com que texto por omissão.
//
// Cada modelo em lib/templates.ts indica o seu esquema (`layout`). Modelos
// com a mesma disposição (ex.: os temas feitos a partir do Renaissance Blue)
// partilham o esquema — basta pôr `layout: "envelope-colagem"` no modelo novo.
// Um modelo com outra disposição ganha um esquema novo aqui.
//
// Os valores ficam em content.<secção>.<key>. O template usa contentText():
// campo vazio = texto por omissão, por isso acrescentar um campo nunca muda
// convites já feitos.
//
// Por agora só a secção "hero" (capa) depende do esquema; as outras secções
// do editor são iguais para todos os modelos. Para levar outra secção para
// aqui, acrescentar a chave em `sections` e o ContentModule passa a usá-la.

import { findTemplate, resolveTemplateId } from "./templates";

type Text = { pt: string; en: string };

export type ContentField = {
  key: string;
  label: Text;
  default?: Text;   // texto que aparece no convite enquanto o campo está vazio
  lines?: number;   // > 1: caixa de texto com várias linhas (uma por linha do convite)
  maxLength?: number;
  hint?: Text;
};

export type ContentLayout = {
  id: string;
  sections: {
    hero?: { fields: ContentField[]; media: boolean };
  };
};

export const CONTENT_LAYOUTS: Record<string, ContentLayout> = {
  // Modelos antigos (luxury, minimal, …): só o título por cima dos nomes.
  classico: {
    id: "classico",
    sections: {
      hero: {
        media: true,
        fields: [
          { key: "text_above_names", label: { pt: "Título secundário", en: "Secondary title" }, default: { pt: "", en: "" }, maxLength: 60 },
        ],
      },
    },
  },

  // Renaissance Blue e temas com a mesma colagem: etiqueta dos nomes com a
  // frase e a palavra em destaque, círculo "Save the Date" (com a data do
  // evento), coração "Detalhes" e losango "RSVP".
  "envelope-colagem": {
    id: "envelope-colagem",
    sections: {
      hero: {
        media: true,
        fields: [
          {
            key: "invite_phrase",
            label: { pt: "Frase do convite", en: "Invitation phrase" },
            default: { pt: "É com muita alegria\nque convidamos\npara o nosso", en: "It is with great joy\nthat we invite you\nto our" },
            lines: 3,
            maxLength: 90,
            hint: { pt: "Até 3 linhas, como aparecem na etiqueta dos nomes.", en: "Up to 3 lines, as they appear on the names label." },
          },
          { key: "wedding_word", label: { pt: "Palavra em destaque", en: "Highlighted word" }, default: { pt: "Casamento", en: "Wedding" }, maxLength: 24 },
          { key: "std_title", label: { pt: "Título do círculo", en: "Circle title" }, default: { pt: "Save the Date", en: "Save the Date" }, maxLength: 24, hint: { pt: "Por baixo aparece a data do casamento.", en: "The wedding date appears underneath." } },
          { key: "details_title", label: { pt: "Botão dos detalhes — título", en: "Details button — title" }, default: { pt: "Detalhes", en: "Details" }, maxLength: 20 },
          { key: "details_subtitle", label: { pt: "Botão dos detalhes — subtítulo", en: "Details button — subtitle" }, default: { pt: "Clique aqui", en: "Click here" }, maxLength: 30 },
          { key: "rsvp_title", label: { pt: "Botão do RSVP — título", en: "RSVP button — title" }, default: { pt: "RSVP", en: "RSVP" }, maxLength: 20 },
          { key: "rsvp_subtitle", label: { pt: "Botão do RSVP — subtítulo", en: "RSVP button — subtitle" }, default: { pt: "Confirme a sua presença", en: "Confirm your attendance" }, maxLength: 40 },
        ],
      },
    },
  },
};

export const DEFAULT_LAYOUT_ID = "classico";

// Esquema do modelo de um evento (ids antigos incluídos; modelos fora do
// registo, como os à medida, usam o clássico).
export function getContentLayout(templateId: string | null | undefined): ContentLayout {
  const t = findTemplate(templateId) ?? findTemplate(resolveTemplateId(templateId));
  return CONTENT_LAYOUTS[t?.layout ?? DEFAULT_LAYOUT_ID] ?? CONTENT_LAYOUTS[DEFAULT_LAYOUT_ID];
}

// Texto de um campo no convite: o valor escrito pelos noivos ou, vazio, o
// texto por omissão do esquema (na língua do convite; por omissão PT).
export function contentText(
  content: any,
  section: string,
  key: string,
  layoutId: string,
  lang: "pt" | "en" = "pt"
): string {
  const v = content?.[section]?.[key];
  if (typeof v === "string" && v.trim() !== "") return v;
  const field = (CONTENT_LAYOUTS[layoutId]?.sections as any)?.[section]?.fields?.find((f: ContentField) => f.key === key);
  return field?.default?.[lang] ?? "";
}
