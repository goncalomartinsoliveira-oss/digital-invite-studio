import { loadImageForPdf } from "./pdfLogo";

export type StdTemplateData = {
  photoUrl?: string;
  names: string;
  meta: string;
  photoEmptyLabel?: string;
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
  } else {
    imageEl?.removeAttribute("href");
    imageEl?.removeAttributeNS(XLINK_NS, "href");
    placeholderEl?.setAttribute("opacity", "1");
    emptyLabelEl?.setAttribute("opacity", "1");
  }

  return new XMLSerializer().serializeToString(svg);
}
