import { loadImageForPdf } from "./pdfLogo";

export type StdTemplateData = {
  photoUrl?: string;
  names: string;
  meta: string;
  photoEmptyLabel?: string;
  // Alguns templates têm o nome da noiva e do noivo em linhas separadas
  // (em vez de "Noivo & Noiva" numa única linha), e/ou a data e a cidade
  // em zonas distintas. Opcionais: só usados pelos templates que os têm.
  brideName?: string;
  groomName?: string;
  date?: string;
  city?: string;
  // Foto de um casal genérico, só para a pré-visualização (nunca usada no
  // PDF descarregado) parecer um cartão real antes de terem carregado a
  // vossa própria foto.
  fallbackPhotoUrl?: string;
};

const XLINK_NS = "http://www.w3.org/1999/xlink";

// Carrega a base SVG de um template do Save the Date e preenche as zonas
// marcadas (foto + textos) com os dados do casal. Devolve o markup SVG já
// pronto a injetar no DOM — tanto para a pré-visualização como para a
// captura que gera o PDF.
export async function fillStdTemplate(svgUrl: string, data: StdTemplateData): Promise<string> {
  const res = await fetch(svgUrl);
  if (!res.ok) throw new Error(`Falha ao carregar o template (${res.status})`);
  const svgText = await res.text();

  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement;

  const namesEl = svg.querySelector("#namesSlot");
  if (namesEl) namesEl.textContent = data.names;

  const metaEl = svg.querySelector("#metaSlot");
  if (metaEl) metaEl.textContent = data.meta;

  const brideEl = svg.querySelector("#brideNameSlot");
  if (brideEl && data.brideName) brideEl.textContent = data.brideName.toUpperCase();

  const groomEl = svg.querySelector("#groomNameSlot");
  if (groomEl && data.groomName) groomEl.textContent = data.groomName.toUpperCase();

  const dateEl = svg.querySelector("#dateSlot");
  if (dateEl && data.date) dateEl.textContent = data.date;

  const cityEl = svg.querySelector("#citySlot");
  if (cityEl && data.city) cityEl.textContent = data.city.toUpperCase();

  const imageEl = svg.querySelector("#photoSlot");
  const placeholderEl = svg.querySelector("#photoPlaceholder");
  const emptyLabelEl = svg.querySelector("#photoEmptyLabel");
  if (emptyLabelEl && data.photoEmptyLabel) emptyLabelEl.textContent = data.photoEmptyLabel;

  if (data.photoUrl && imageEl) {
    // Carregada via fetch→data URL: evita que a foto (normalmente noutra
    // origem, ex.: Supabase Storage) fique "tainted" ao capturar o cartão
    // para o PDF (o mesmo problema que corrigimos nos logótipos dos PDFs).
    const { dataUrl } = await loadImageForPdf(data.photoUrl);
    imageEl.setAttribute("href", dataUrl);
    imageEl.setAttributeNS(XLINK_NS, "href", dataUrl);
    placeholderEl?.setAttribute("opacity", "0");
    emptyLabelEl?.setAttribute("opacity", "0");
  } else if (data.fallbackPhotoUrl && imageEl) {
    imageEl.setAttribute("href", data.fallbackPhotoUrl);
    imageEl.setAttributeNS(XLINK_NS, "href", data.fallbackPhotoUrl);
    placeholderEl?.setAttribute("opacity", "0");
    emptyLabelEl?.setAttribute("opacity", "0");
  } else {
    imageEl?.removeAttribute("href");
    imageEl?.removeAttributeNS(XLINK_NS, "href");
    placeholderEl?.setAttribute("opacity", "1");
    emptyLabelEl?.setAttribute("opacity", "1");
  }

  return new XMLSerializer().serializeToString(svg);
}
