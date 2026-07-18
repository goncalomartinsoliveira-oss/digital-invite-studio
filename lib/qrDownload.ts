// Descarrega um <svg id="..."> (código QR) como PNG ou como SVG puro.
// Usado nas páginas de gestão que mostram QR codes (Photo Sharing, Guestbook).
export function downloadQRAsPng(elementId: string, fileName: string) {
  const svg = document.getElementById(elementId);
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    canvas.width = 1000;
    canvas.height = 1000;
    ctx!.fillStyle = "white";
    ctx!.fillRect(0, 0, 1000, 1000);
    ctx?.drawImage(img, 50, 50, 900, 900);
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(svgData);
}

export function downloadQRAsSvg(elementId: string, fileName: string) {
  const svg = document.getElementById(elementId);
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.svg`;
  link.click();
  window.URL.revokeObjectURL(url);
}
