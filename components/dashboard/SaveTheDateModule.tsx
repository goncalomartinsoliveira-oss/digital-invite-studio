"use client";
import { useState, useEffect, useRef } from "react";
import { Cinzel } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { Download, ImagePlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { fillStdTemplate } from "@/lib/svgTemplate";
import { STD_TEMPLATES, DEFAULT_STD_TEMPLATE } from "@/lib/stdTemplates";
import { loadImageForPdf } from "@/lib/pdfLogo";

// Só usada no template "Moldura Preta" (nomes do casal); carregada aqui e
// exposta como variável CSS, referenciada diretamente no SVG do template.
const cinzelStd = Cinzel({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-cinzel-std" });

// Foto genérica só para as miniaturas do carrossel de modelos parecerem um
// cartão real antes de terem foto própria. Nunca é usada no PDF descarregado.
const CAROUSEL_FALLBACK_PHOTO = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800";

interface SaveTheDateModuleDict {
  title: string;
  subtitle: string;
  photoLabel: string;
  photoHint: string;
  uploadBtn: string;
  changePhoto: string;
  uploading: string;
  cityLabel: string;
  cityPlaceholder: string;
  autoNote: string;
  downloadBtn: string;
  generating: string;
  previewLabel: string;
  photoEmpty: string;
  templateLabel: string;
  repositionBtn: string;
  closeReposition: string;
  repositionHint: string;
  resetPosition: string;
}

type PhotoPosition = { x: number; y: number; zoom: number };
const DEFAULT_PHOTO_POSITION: PhotoPosition = { x: 0, y: 0, zoom: 1 };

// Mesma matemática usada em `lib/svgTemplate.ts` (applyPhotoFraming), mas em
// píxeis do controlo de arrastar — garante que o que se vê aqui corresponde
// ao que sai no cartão.
function computeFramedRect(containerW: number, containerH: number, naturalW: number, naturalH: number, pos: PhotoPosition) {
  const coverScale = Math.max(containerW / naturalW, containerH / naturalH);
  const scale = coverScale * Math.max(1, pos.zoom);
  const renderW = naturalW * scale;
  const renderH = naturalH * scale;
  const slackX = renderW - containerW;
  const slackY = renderH - containerH;
  const px = Math.max(-50, Math.min(50, pos.x)) / 100;
  const py = Math.max(-50, Math.min(50, pos.y)) / 100;
  return {
    width: renderW,
    height: renderH,
    left: -slackX / 2 - px * slackX,
    top: -slackY / 2 - py * slackY,
    slackX,
    slackY,
  };
}

interface SaveTheDateModuleProps {
  formData: any;
  setFormData: (data: any) => void;
  handleSaveDesign: () => Promise<void>;
  saving: boolean;
  canEdit: boolean;
  dict: SaveTheDateModuleDict;
}

export default function SaveTheDateModule({
  formData,
  setFormData,
  handleSaveDesign,
  canEdit,
  dict,
}: SaveTheDateModuleProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [templatePreviews, setTemplatePreviews] = useState<{ id: string; name: string; markup: string }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [repositioning, setRepositioning] = useState(false);
  const [dragPos, setDragPos] = useState<PhotoPosition>(DEFAULT_PHOTO_POSITION);
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; startPos: PhotoPosition } | null>(null);

  const dbContent = formData?.content || {};
  const content = dbContent.content || {};
  const std = content.save_the_date || {};

  const bride = formData?.bride_name || "";
  const groom = formData?.groom_name || "";
  const names = groom && bride ? `${groom} & ${bride}` : (groom || bride || "Os Noivos");

  const eventDate = formData?.event_date;
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".")
    : "";
  const meta = std.city ? `${dateStr}  |  ${std.city}` : dateStr;

  const activeTemplate = STD_TEMPLATES.find(t => t.id === std.template_id) || DEFAULT_STD_TEMPLATE;

  useEffect(() => { setIsMounted(true); }, []);

  // Converte a foto carregada para data URL uma única vez por foto (não uma
  // vez por template): antes, cada um dos 5 preenchimentos (4 do carrossel +
  // 1 da pré-visualização) voltava a fazer fetch + FileReader da mesma
  // imagem, o que tornava o módulo lento sempre que qualquer campo mudava.
  // Guarda também o tamanho real da foto — necessário para o enquadramento.
  const [photoAsset, setPhotoAsset] = useState<{ dataUrl: string; width: number; height: number } | null>(null);
  useEffect(() => {
    let alive = true;
    if (!std.photo_url) { setPhotoAsset(null); return; }
    loadImageForPdf(std.photo_url)
      .then(({ dataUrl, width, height }) => { if (alive) setPhotoAsset({ dataUrl, width, height }); })
      .catch(err => console.error("Erro ao carregar a foto:", err));
    return () => { alive = false; };
  }, [std.photo_url]);
  const photoDataUrl = photoAsset?.dataUrl;
  const photoPosition: PhotoPosition = std.photo_position || DEFAULT_PHOTO_POSITION;

  // Preenche cada template base (SVG) com o texto do casal, sempre que algo
  // muda — todos de uma vez, para o carrossel mostrar cada modelo já com os
  // dados reais. Usa uma foto genérica enquanto não há foto própria, só
  // para o carrossel parecer um cartão real (nunca é usada no PDF).
  useEffect(() => {
    let alive = true;
    if (std.photo_url && !photoDataUrl) return; // espera a conversão única da foto
    Promise.all(
      STD_TEMPLATES.map(t =>
        fillStdTemplate(t.svgUrl, {
          photoDataUrl,
          fallbackPhotoUrl: CAROUSEL_FALLBACK_PHOTO,
          photoBox: t.photoBox,
          photoNaturalSize: photoAsset ? { width: photoAsset.width, height: photoAsset.height } : undefined,
          photoPosition,
          names, meta,
          brideName: bride, groomName: groom, date: dateStr, city: std.city || "",
          photoEmptyLabel: dict.photoEmpty,
        }).then(markup => ({ id: t.id, name: t.name, markup }))
      )
    )
      .then(results => { if (alive) setTemplatePreviews(results); })
      .catch(err => console.error("Erro ao preparar o Save the Date:", err));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUrl, photoAsset, photoPosition, std.photo_url, names, meta, bride, groom, dateStr, std.city]);

  // Pré-visualização principal / fonte do PDF descarregado — sem foto
  // genérica: mostra "A VOSSA FOTO" até carregarem a foto real, para o PDF
  // nunca sair com a foto de outra pessoa por engano.
  const [activeMarkup, setActiveMarkup] = useState("");
  useEffect(() => {
    let alive = true;
    if (std.photo_url && !photoDataUrl) return; // espera a conversão única da foto
    fillStdTemplate(activeTemplate.svgUrl, {
      photoDataUrl,
      photoBox: activeTemplate.photoBox,
      photoNaturalSize: photoAsset ? { width: photoAsset.width, height: photoAsset.height } : undefined,
      photoPosition,
      names, meta,
      brideName: bride, groomName: groom, date: dateStr, city: std.city || "",
      photoEmptyLabel: dict.photoEmpty,
    })
      .then(markup => { if (alive) setActiveMarkup(markup); })
      .catch(err => console.error("Erro ao preparar o Save the Date:", err));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUrl, photoAsset, photoPosition, std.photo_url, names, meta, activeTemplate.svgUrl, bride, groom, dateStr, std.city]);

  const selectTemplateRelative = (dir: number) => {
    const idx = STD_TEMPLATES.findIndex(t => t.id === activeTemplate.id);
    const next = STD_TEMPLATES[(idx + dir + STD_TEMPLATES.length) % STD_TEMPLATES.length];
    setStd({ template_id: next.id });
  };

  // Autosave (mesmo padrão dos outros módulos)
  useEffect(() => {
    if (!isMounted || !canEdit) return;
    const timer = setTimeout(() => { handleSaveDesign(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const setStd = (patch: Record<string, any>) => {
    if (!canEdit) return;
    setFormData({
      ...formData,
      content: { ...dbContent, content: { ...content, save_the_date: { ...std, ...patch } } },
    });
  };

  // Reposicionar/ampliar a foto dentro da moldura do modelo escolhido.
  // Arrastar só atualiza o estado local (o painel responde de imediato);
  // só grava no evento (o que dispara o novo preenchimento dos SVGs e o
  // autosave) ao largar — evita recalcular tudo a cada píxel arrastado.
  const REPOSITION_FRAME_W = 220;
  const repositionBox = activeTemplate.photoBox;
  const repositionFrameH = repositionBox ? Math.round(REPOSITION_FRAME_W * (repositionBox.height / repositionBox.width)) : REPOSITION_FRAME_W;

  const openReposition = () => {
    setDragPos(photoPosition);
    setRepositioning(true);
  };

  const commitPosition = (pos: PhotoPosition) => {
    setDragPos(pos);
    setStd({ photo_position: pos });
  };

  const onFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!photoAsset) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startPos: dragPos };
  };
  const onFramePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (!ds || ds.pointerId !== e.pointerId || !photoAsset) return;
    const rect = computeFramedRect(REPOSITION_FRAME_W, repositionFrameH, photoAsset.width, photoAsset.height, ds.startPos);
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const nextX = rect.slackX > 0 ? ds.startPos.x - (dx / rect.slackX) * 100 : 0;
    const nextY = rect.slackY > 0 ? ds.startPos.y - (dy / rect.slackY) * 100 : 0;
    setDragPos({ ...ds.startPos, x: Math.max(-50, Math.min(50, nextX)), y: Math.max(-50, Math.min(50, nextY)) });
  };
  const onFramePointerUp = () => {
    if (!dragState.current) return;
    dragState.current = null;
    setStd({ photo_position: dragPos });
  };

  // Fotos tiradas diretamente do telemóvel vêm muitas vezes com vários MB
  // (4000×3000+) — sem isto, o upload demorava muito mais do que o
  // necessário, já que o cartão nunca mostra a foto acima de ~1600px.
  const compressImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1600;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.85);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const processed = await compressImage(file);
    const fileName = `std-${formData.slug}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("invites").upload(fileName, processed);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("invites").getPublicUrl(fileName);
      setStd({ photo_url: publicUrl });
    }
    setUploading(false);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#FCFAF6",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(`save-the-date-${formData.slug || "convite"}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block";
  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-brand text-sm text-ink font-semibold px-0 py-3 transition-colors placeholder-gray-300";

  return (
    <div className={`${cinzelStd.variable} grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start`}>

      {/* ── Controlos ── */}
      <div className={!canEdit ? "opacity-70 pointer-events-none" : ""}>
        <h2 className="font-serif text-3xl text-ink">{dict.title}</h2>
        <p className="text-gray-400 text-sm mt-1 mb-10">{dict.subtitle}</p>

        {/* Modelo — carrossel tipo telemóvel: o escolhido fica ao centro, os
            outros ficam parcialmente visíveis dos lados, com setas para
            navegar ou um clique direto num dos lados para o escolher. */}
        <div className="mb-10">
          <label className={labelClass}>{dict.templateLabel}</label>
          <div className="relative flex items-center justify-center gap-0 py-4 select-none">
            <button
              type="button"
              onClick={() => selectTemplateRelative(-1)}
              className="absolute left-0 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition-all"
              aria-label="Modelo anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center justify-center overflow-hidden w-full px-10">
              {STD_TEMPLATES.map(t => {
                const isActive = t.id === activeTemplate.id;
                const preview = templatePreviews.find(p => p.id === t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStd({ template_id: t.id })}
                    className="shrink-0 w-28"
                    style={{ marginLeft: -8, marginRight: -8 }}
                  >
                    {/* Largura fixa no botão (nunca anima) — só a escala e a opacidade
                        mudam. Animar "width" obriga o browser a recalcular o layout a
                        cada frame, o que pesa muito com 4 SVGs complexos; scale/opacity
                        são só composição, muito mais leves (sobretudo em mobile). */}
                    <div
                      className={`origin-center transition-[transform,opacity] duration-300 ease-out ${
                        isActive ? "scale-100 opacity-100 z-10" : "scale-[0.68] opacity-40"
                      }`}
                    >
                      {/* Sem moldura de telemóvel: o próprio cartão já tem a sua margem/borda,
                          e a proporção 340/640 evita distorcer a arte. O SVG tem de ser filho
                          direto para o [&>svg] resultar — daí não haver aqui uma div extra. */}
                      {preview && (
                        <div
                          className="rounded-[0.5rem] overflow-hidden shadow-lg aspect-[340/640] bg-white [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                          dangerouslySetInnerHTML={{ __html: preview.markup }}
                        />
                      )}
                    </div>
                    <p className={`text-center mt-2 uppercase tracking-wide truncate ${isActive ? "text-[9px] text-brand font-bold" : "text-[8px] text-gray-400"}`}>
                      {t.name}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => selectTemplateRelative(1)}
              className="absolute right-0 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition-all"
              aria-label="Próximo modelo"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Foto */}
        <div className="mb-10">
          <label className={labelClass}>{dict.photoLabel}</label>
          <div className="flex items-center gap-5">
            <div className="w-20 h-28 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
              {std.photo_url
                ? <img src={std.photo_url} className="w-full h-full object-cover" alt="" />
                : <ImagePlus size={22} className="text-gray-300" />}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {uploading ? dict.uploading : (std.photo_url ? dict.changePhoto : dict.uploadBtn)}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={!canEdit || uploading} />
              </label>
              <p className="text-[11px] text-gray-400 mt-2 max-w-xs">{dict.photoHint}</p>
              {std.photo_url && repositionBox && (
                <button
                  type="button"
                  onClick={() => (repositioning ? setRepositioning(false) : openReposition())}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
                >
                  {repositioning ? dict.closeReposition : dict.repositionBtn}
                </button>
              )}
            </div>
          </div>

          {/* Arrastar/ampliar a foto dentro da moldura do modelo escolhido —
              a mesma matemática de enquadramento usada no cartão real, para
              o que se vê aqui corresponder exatamente ao resultado final. */}
          {repositioning && photoAsset && repositionBox && (
            <div className="mt-5 flex flex-col items-center gap-3 bg-cream/60 border border-gray-100 rounded-2xl p-5">
              <p className="text-[11px] text-gray-400 text-center max-w-[220px]">{dict.repositionHint}</p>
              <div
                onPointerDown={onFramePointerDown}
                onPointerMove={onFramePointerMove}
                onPointerUp={onFramePointerUp}
                onPointerCancel={onFramePointerUp}
                style={{ width: REPOSITION_FRAME_W, height: repositionFrameH, touchAction: "none" }}
                className="relative overflow-hidden rounded-2xl border-2 border-white shadow-md cursor-grab active:cursor-grabbing bg-gray-100"
              >
                {(() => {
                  const rect = computeFramedRect(REPOSITION_FRAME_W, repositionFrameH, photoAsset.width, photoAsset.height, dragPos);
                  return (
                    <img
                      src={photoAsset.dataUrl}
                      draggable={false}
                      alt=""
                      style={{ position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height, maxWidth: "none" }}
                    />
                  );
                })()}
              </div>
              <div className="flex items-center gap-3 w-full max-w-[220px]">
                <span className="text-[11px] text-gray-400">−</span>
                <input
                  type="range"
                  min={100}
                  max={250}
                  step={1}
                  value={Math.round(dragPos.zoom * 100)}
                  onChange={e => commitPosition({ ...dragPos, zoom: Number(e.target.value) / 100 })}
                  className="w-full accent-brand"
                />
                <span className="text-[11px] text-gray-400">+</span>
              </div>
              <button
                type="button"
                onClick={() => commitPosition(DEFAULT_PHOTO_POSITION)}
                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
              >
                {dict.resetPosition}
              </button>
            </div>
          )}
        </div>

        {/* Cidade / Local */}
        <div className="mb-10 max-w-sm">
          <label className={labelClass}>{dict.cityLabel}</label>
          <input
            className={inputClass}
            value={std.city ?? ""}
            onChange={e => setStd({ city: e.target.value })}
            placeholder={dict.cityPlaceholder}
          />
        </div>

        <p className="text-[11px] text-gray-400 italic border-l-2 border-gold-soft pl-3">{dict.autoNote}</p>
      </div>

      {/* ── Preview + download ── */}
      <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{dict.previewLabel}</span>

        {/* Cartão (capturado para PDF) — preenchido a partir da base (template) SVG.
            340×640 é o tamanho real de todos os templates (viewBox), e o
            [&>svg] força o SVG injetado a preencher a caixa toda, sem
            deixar margens em branco caso um template futuro use outro
            tamanho. */}
        <div
          ref={cardRef}
          className="[&>svg]:w-full [&>svg]:h-full [&>svg]:block"
          style={{ width: 340, height: 640, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
          dangerouslySetInnerHTML={{ __html: activeMarkup }}
        />

        <button
          onClick={handleDownload}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-brand text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {generating ? dict.generating : dict.downloadBtn}
        </button>
      </div>
    </div>
  );
}
