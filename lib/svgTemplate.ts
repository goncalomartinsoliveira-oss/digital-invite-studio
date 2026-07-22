import { loadImageForPdf } from "./pdfLogo";

export type StdTemplateData = {
  photoUrl?: string;
  // Foto já convertida para data URL (ver `loadImageForPdf`). Quando
  // fornecida, é usada diretamente em vez de `photoUrl` — evita repetir o
  // fetch + FileReader por cada template do carrossel + a pré-visualização
  // principal (5×) sempre que algo muda no formulário.
  photoDataUrl?: string;
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
  // Área da foto no viewBox deste template (ver `STD_TEMPLATES[].photoBox`).
  // Sem isto, a foto fica sempre centrada (comportamento anterior).
  photoBox?: { x: number; y: number; width: number; height: number };
  // Tamanho real (em píxeis) da foto carregada — necessário para calcular o
  // enquadramento. Vem de `loadImageForPdf`.
  photoNaturalSize?: { width: number; height: number };
  // Ajuste manual de enquadramento dentro de `photoBox`, escolhido pelo
  // casal ao arrastar/ampliar a foto. `x`/`y` em [-50,50] (0 = centrado,
  // -50/50 = topo-esquerda/fundo-direita do que sobra depois do zoom);
  // `zoom` ≥ 1 (1 = a foto só o suficiente para cobrir a área, sem sobras).
  photoPosition?: { x: number; y: number; zoom: number };
};

const XLINK_NS = "http://www.w3.org/1999/xlink";

// Cada template base é um ficheiro estático (público) — o texto do SVG não
// muda entre preenchimentos, só os dados injetados. Evita re-pedir o mesmo
// ficheiro ao servidor sempre que o casal edita um campo.
const svgTextCache = new Map<string, Promise<string>>();

function fetchSvgText(svgUrl: string): Promise<string> {
  let cached = svgTextCache.get(svgUrl);
  if (!cached) {
    cached = fetch(svgUrl).then(res => {
      if (!res.ok) throw new Error(`Falha ao carregar o template (${res.status})`);
      return res.text();
    });
    cached.catch(() => svgTextCache.delete(svgUrl));
    svgTextCache.set(svgUrl, cached);
  }
  return cached;
}

// Recalcula x/y/width/height do <image> para aplicar o zoom/posição escolhidos
// pelo casal dentro de `photoBox`, mantendo sempre a área toda coberta (sem
// sobras/vazios, independentemente da proporção da foto). Sem `photoBox` ou
// `photoNaturalSize`, mantém o comportamento por omissão do próprio SVG
// (preserveAspectRatio já definido no ficheiro).
function applyPhotoFraming(imageEl: Element, data: StdTemplateData) {
  const box = data.photoBox;
  const natural = data.photoNaturalSize;
  if (!box || !natural || !natural.width || !natural.height) return;

  const coverScale = Math.max(box.width / natural.width, box.height / natural.height);
  const zoom = Math.max(1, data.photoPosition?.zoom || 1);
  const scale = coverScale * zoom;
  const renderW = natural.width * scale;
  const renderH = natural.height * scale;
  const slackX = renderW - box.width;
  const slackY = renderH - box.height;

  const px = Math.max(-50, Math.min(50, data.photoPosition?.x || 0)) / 100;
  const py = Math.max(-50, Math.min(50, data.photoPosition?.y || 0)) / 100;

  imageEl.setAttribute("width", String(renderW));
  imageEl.setAttribute("height", String(renderH));
  imageEl.setAttribute("x", String(box.x - slackX / 2 - px * slackX));
  imageEl.setAttribute("y", String(box.y - slackY / 2 - py * slackY));
  imageEl.setAttribute("preserveAspectRatio", "none");
}

// Carrega a base SVG de um template do Save the Date e preenche as zonas
// marcadas (foto + textos) com os dados do casal. Devolve o markup SVG já
// pronto a injetar no DOM — tanto para a pré-visualização como para a
// captura que gera o PDF.
export async function fillStdTemplate(svgUrl: string, data: StdTemplateData): Promise<string> {
  const svgText = await fetchSvgText(svgUrl);

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

  if (data.photoDataUrl && imageEl) {
    imageEl.setAttribute("href", data.photoDataUrl);
    imageEl.setAttributeNS(XLINK_NS, "href", data.photoDataUrl);
    placeholderEl?.setAttribute("opacity", "0");
    emptyLabelEl?.setAttribute("opacity", "0");
    applyPhotoFraming(imageEl, data);
  } else if (data.photoUrl && imageEl) {
    // Carregada via fetch→data URL: evita que a foto (normalmente noutra
    // origem, ex.: Supabase Storage) fique "tainted" ao capturar o cartão
    // para o PDF (o mesmo problema que corrigimos nos logótipos dos PDFs).
    const { dataUrl } = await loadImageForPdf(data.photoUrl);
    imageEl.setAttribute("href", dataUrl);
    imageEl.setAttributeNS(XLINK_NS, "href", dataUrl);
    placeholderEl?.setAttribute("opacity", "0");
    emptyLabelEl?.setAttribute("opacity", "0");
    applyPhotoFraming(imageEl, data);
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
