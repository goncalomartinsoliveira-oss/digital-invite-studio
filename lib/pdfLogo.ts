// Carregamento de logótipos para PDFs (jsPDF).
//
// Porquê não usar apenas `new Image()` + `pdf.addImage(imgElement, ...)`:
// jsPDF lê os pixels da imagem via canvas para a embutir no PDF. Se a imagem
// vier de outra origem (ex.: Supabase Storage) sem `crossOrigin` definido, o
// canvas fica "tainted" e a leitura falha silenciosamente — o logo do
// parceiro desaparece do PDF sem aviso. Ao carregar a imagem via fetch() e
// convertê-la para data URL, evitamos por completo essa leitura de pixels:
// jsPDF recebe os bytes já prontos, sem tocar em canvas.
export async function loadImageForPdf(
  url: string
): Promise<{ dataUrl: string; width: number; height: number; format: "PNG" | "JPEG" }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar imagem (${res.status})`);
  const blob = await res.blob();
  const format: "PNG" | "JPEG" = blob.type.includes("jpeg") || blob.type.includes("jpg") ? "JPEG" : "PNG";

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });

  return { dataUrl, width, height, format };
}

// Caixa do logótipo no cabeçalho do PDF: mantém a proporção, sem esticar,
// e sem deixar logótipos quadrados (comuns em marcas parceiras) ficarem
// enormes — mas com espaço suficiente para logótipos largos (ex.: DIS)
// ficarem bem legíveis.
export function fitLogoBox(width: number, height: number, maxW = 55, maxH = 20) {
  const ratio = height / width;
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }
  return { width: w, height: h };
}
