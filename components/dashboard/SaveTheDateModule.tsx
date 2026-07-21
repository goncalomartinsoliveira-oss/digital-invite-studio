"use client";
import { useState, useEffect, useRef } from "react";
import { Cinzel } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { Download, ImagePlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { fillStdTemplate } from "@/lib/svgTemplate";
import { STD_TEMPLATES, DEFAULT_STD_TEMPLATE } from "@/lib/stdTemplates";

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

  // Preenche cada template base (SVG) com o texto do casal, sempre que algo
  // muda — todos de uma vez, para o carrossel mostrar cada modelo já com os
  // dados reais. Usa uma foto genérica enquanto não há foto própria, só
  // para o carrossel parecer um cartão real (nunca é usada no PDF).
  useEffect(() => {
    let alive = true;
    Promise.all(
      STD_TEMPLATES.map(t =>
        fillStdTemplate(t.svgUrl, {
          photoUrl: std.photo_url,
          fallbackPhotoUrl: CAROUSEL_FALLBACK_PHOTO,
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
  }, [std.photo_url, names, meta, bride, groom, dateStr, std.city]);

  // Pré-visualização principal / fonte do PDF descarregado — sem foto
  // genérica: mostra "A VOSSA FOTO" até carregarem a foto real, para o PDF
  // nunca sair com a foto de outra pessoa por engano.
  const [activeMarkup, setActiveMarkup] = useState("");
  useEffect(() => {
    let alive = true;
    fillStdTemplate(activeTemplate.svgUrl, {
      photoUrl: std.photo_url,
      names, meta,
      brideName: bride, groomName: groom, date: dateStr, city: std.city || "",
      photoEmptyLabel: dict.photoEmpty,
    })
      .then(markup => { if (alive) setActiveMarkup(markup); })
      .catch(err => console.error("Erro ao preparar o Save the Date:", err));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [std.photo_url, names, meta, activeTemplate.svgUrl, bride, groom, dateStr, std.city]);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `std-${formData.slug}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("invites").upload(fileName, file);
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
                    className={`shrink-0 transition-all duration-300 ease-out ${
                      isActive ? "w-32 opacity-100 scale-100 z-10" : "w-20 opacity-40 scale-90"
                    }`}
                    style={{ marginLeft: -8, marginRight: -8 }}
                  >
                    {/* Sem moldura de telemóvel: o próprio cartão já tem a sua margem/borda,
                        e a proporção 340/640 evita distorcer a arte. */}
                    <div className="rounded-[0.5rem] overflow-hidden shadow-lg aspect-[340/640] bg-white [&>svg]:w-full [&>svg]:h-full [&>svg]:block">
                      {preview && <div dangerouslySetInnerHTML={{ __html: preview.markup }} />}
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
            </div>
          </div>
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
