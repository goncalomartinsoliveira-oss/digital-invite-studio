"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Download, ImagePlus, Loader2 } from "lucide-react";

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

  useEffect(() => { setIsMounted(true); }, []);

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start">

      {/* ── Controlos ── */}
      <div className={!canEdit ? "opacity-70 pointer-events-none" : ""}>
        <h2 className="font-serif text-3xl text-ink">{dict.title}</h2>
        <p className="text-gray-400 text-sm mt-1 mb-10">{dict.subtitle}</p>

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

        {/* Cartão (capturado para PDF) */}
        <div
          ref={cardRef}
          style={{
            width: 360,
            height: 640,
            background: "#FCFAF6",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}
        >
          {/* Foto em arco */}
          <div
            style={{
              position: "absolute", top: -22, right: -48, width: 312, height: 486,
              borderTopLeftRadius: 156, borderTopRightRadius: 156,
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              overflow: "hidden",
              background: std.photo_url
                ? undefined
                : "radial-gradient(120% 80% at 50% 20%, #cfc7bd 0%, #b7ada1 45%, #918a7d 100%)",
            }}
          >
            {std.photo_url ? (
              <img
                src={std.photo_url}
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt=""
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-jost)", fontSize: 10, letterSpacing: "0.4em", color: "rgba(255,255,255,0.85)",
              }}>
                {dict.photoEmpty}
              </div>
            )}
          </div>

          {/* SAVE the DATE vertical */}
          <div style={{
            position: "absolute", left: -78, top: 214, width: 220, textAlign: "center",
            transform: "rotate(-90deg)", transformOrigin: "center",
            fontFamily: "var(--font-cormorant)", color: "#232020", whiteSpace: "nowrap",
          }}>
            <span style={{ fontWeight: 300, fontSize: 34, letterSpacing: "0.22em", textTransform: "uppercase" }}>Save</span>
            <span style={{ fontWeight: 400, fontStyle: "italic", fontSize: 34, letterSpacing: "0.04em", margin: "0 8px" }}>the</span>
            <span style={{ fontWeight: 300, fontSize: 34, letterSpacing: "0.22em", textTransform: "uppercase" }}>Date</span>
          </div>

          {/* Nomes + data */}
          <div style={{ position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center", padding: "0 20px" }}>
            <p style={{ fontFamily: "'Beloved', cursive", fontSize: 60, color: "#232020", lineHeight: 1 }}>{names}</p>
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: 10.5, fontWeight: 400, letterSpacing: "0.26em",
              textTransform: "uppercase", color: "#8a8377", marginTop: 14,
            }}>{meta}</p>
          </div>
        </div>

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
