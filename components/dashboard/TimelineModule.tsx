"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import SaveStatusBadge from "@/components/dashboard/SaveStatusBadge";
import { useSaveStatus } from "@/lib/useSaveStatus";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useBrand } from "@/components/site/BrandProvider";
import { loadImageForPdf, fitLogoBox } from "@/lib/pdfLogo";
import { Plus, Trash2, Eye, EyeOff, Loader2, Download, Clock } from "lucide-react";
import { formatEventTime, timelineBlockEndTime, type TimelineBlock } from "@/lib/planner";

// Cronograma do dia — parte da área de Planeamento, exclusiva de contas de
// agência, mas os blocos nascem partilhados com o casal (ao contrário de
// Orçamento/Tarefas): é o horário do próprio dia deles. A agência pode
// esconder um bloco específico (ex.: uma surpresa) trocando a visibilidade.

type Vendor = { id: string; name: string };

interface Props {
  invitationId: string;
  brandId: string;
  eventDate: string | null;
  groomName: string;
  brideName: string;
  canEdit: boolean;
  /** Equipa da agência vê tudo; o casal só vê os blocos partilhados. */
  isAgency: boolean;
  locale: string;
}

export default function TimelineModule({ invitationId, brandId, eventDate, groomName, brideName, canEdit, isAgency, locale }: Props) {
  const en = locale === "en";
  const brand = useBrand();
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { status: saveStatus, track } = useSaveStatus("TimelineModule");
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const [b, v] = await Promise.all([
      supabase.from("event_timeline").select("*").eq("invitation_id", invitationId).order("event_time"),
      supabase.from("agency_vendors").select("id, name").eq("brand_id", brandId).order("name"),
    ]);
    setBlocks((b.data as TimelineBlock[]) || []);
    setVendors((v.data as Vendor[]) || []);
    setLoading(false);
  }, [invitationId, brandId]);

  useEffect(() => { load(); }, [load]);

  const vendorName = (id: string | null) => vendors.find(v => v.id === id)?.name || "";

  const addBlock = async () => {
    if (!canEdit) return;
    setAdding(true);
    const lastTime = blocks.length > 0 ? blocks[blocks.length - 1].event_time : "12:00:00";
    const { data } = await supabase
      .from("event_timeline")
      .insert([{
        invitation_id: invitationId,
        event_time: lastTime,
        title: "",
        // Partilhado por omissão — é o dia deles, não um documento interno.
        visibility: "shared",
        sort_order: blocks.length,
      }])
      .select("*")
      .single();
    if (data) setBlocks(prev => [...prev, data as TimelineBlock].sort((a, b) => a.event_time.localeCompare(b.event_time)));
    setAdding(false);
  };

  const patchBlock = async (id: string, patch: Partial<TimelineBlock>) => {
    if (!canEdit) return;
    setBlocks(prev => {
      const next = prev.map(b => (b.id === id ? { ...b, ...patch } : b));
      return patch.event_time ? [...next].sort((a, b) => a.event_time.localeCompare(b.event_time)) : next;
    });
    await track(supabase.from("event_timeline").update(patch).eq("id", id));
  };

  const removeBlock = async (id: string) => {
    if (!canEdit) return;
    setBlocks(prev => prev.filter(b => b.id !== id));
    await track(supabase.from("event_timeline").delete().eq("id", id));
  };

  const exportPDF = async () => {
    setExporting(true);
    const doc = new jsPDF();
    const websiteUrl = "https://www.digitalinvitestudio.com";
    let contentY = 32;
    try {
      const { dataUrl, width, height, format } = await loadImageForPdf(brand.logoRaster);
      const { width: logoWidth, height: logoHeight } = fitLogoBox(width, height);
      doc.addImage(dataUrl, format, 14, 10, logoWidth, logoHeight);
      doc.link(14, 10, logoWidth, logoHeight, { url: websiteUrl });
      contentY = 10 + logoHeight + 12;
    } catch {
      doc.setFontSize(16); doc.setTextColor(99, 1, 0); doc.setFont("helvetica", "bold");
      doc.text(brand.name.toUpperCase(), 14, 20);
      doc.setFont("helvetica", "normal"); contentY = 35;
    }

    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(en ? "Wedding Day Timeline" : "Cronograma do Dia", 14, contentY);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    const dateLabel = eventDate ? new Date(eventDate).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "long", year: "numeric" }) : "";
    doc.text(`${groomName} & ${brideName}${dateLabel ? " | " + dateLabel : ""}`, 14, contentY + 6);

    const rows = blocks.map(b => [
      formatEventTime(b.event_time),
      timelineBlockEndTime(b) || "",
      b.title || "-",
      vendorName(b.vendor_id) || "-",
      b.notes || "-",
    ]);

    autoTable(doc, {
      startY: contentY + 12,
      head: [[en ? "Start" : "Início", en ? "End" : "Fim", en ? "Moment" : "Momento", en ? "Vendor" : "Fornecedor", en ? "Notes" : "Notas"]],
      body: rows,
      headStyles: { fillColor: [99, 1, 0] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 16 } },
    });

    doc.save(`cronograma-${groomName}-${brideName}.pdf`.toLowerCase().replace(/\s+/g, "-"));
    setExporting(false);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors disabled:opacity-60";
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block";

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <SaveStatusBadge status={saveStatus} locale={locale} />

      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h3 className="font-serif text-3xl text-brand">{en ? "Day Timeline" : "Cronograma do Dia"}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">
              {en ? "Minute-by-minute schedule" : "Horário minuto a minuto"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {blocks.length > 0 && (
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-50"
              >
                {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PDF
              </button>
            )}
            {canEdit && (
              <button
                onClick={addBlock}
                disabled={adding}
                className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                <Plus size={14} /> {en ? "Add block" : "Adicionar bloco"}
              </button>
            )}
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            {en ? "No blocks yet — start with the ceremony." : "Ainda sem blocos. Comece pela cerimónia."}
          </p>
        ) : (
          <div className="relative space-y-1">
            {blocks.map((block, i) => {
              const last = i === blocks.length - 1;
              return (
                <div key={block.id} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0 pt-2">
                    <Clock size={14} className="text-brand" />
                    {!last && <div className="w-px flex-1 min-h-[2.5rem] bg-gray-100 mt-1" />}
                  </div>
                  <div className={`flex-1 min-w-0 bg-cream/50 border border-gray-100 rounded-2xl p-4 ${!canEdit ? "opacity-90" : ""} mb-3`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>{en ? "Start" : "Início"}</label>
                        <input
                          className={inputCls}
                          type="time"
                          disabled={!canEdit}
                          value={formatEventTime(block.event_time)}
                          onChange={e => patchBlock(block.id, { event_time: `${e.target.value}:00` })}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>{en ? "Duration (min)" : "Duração (min)"}</label>
                        <input
                          className={inputCls}
                          type="number"
                          min={0}
                          disabled={!canEdit}
                          defaultValue={block.duration_minutes ?? ""}
                          onBlur={e => patchBlock(block.id, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className={labelCls}>{en ? "Moment" : "Momento"}</label>
                        <input
                          className={inputCls}
                          disabled={!canEdit}
                          defaultValue={block.title}
                          placeholder={en ? "e.g. Ceremony" : "Ex: Cerimónia"}
                          onBlur={e => patchBlock(block.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>{en ? "Vendor" : "Fornecedor"}</label>
                        <select
                          className={inputCls}
                          disabled={!canEdit}
                          value={block.vendor_id || ""}
                          onChange={e => patchBlock(block.id, { vendor_id: e.target.value || null })}
                        >
                          <option value="">—</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <input
                        className={`${inputCls} bg-transparent border-none px-0 text-xs text-gray-500`}
                        disabled={!canEdit}
                        defaultValue={block.notes || ""}
                        placeholder={en ? "Notes (optional)" : "Notas (opcional)"}
                        onBlur={e => patchBlock(block.id, { notes: e.target.value || null })}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-gray-100">
                      {isAgency && (
                        <button
                          onClick={() => patchBlock(block.id, { visibility: block.visibility === "shared" ? "agency" : "shared" })}
                          disabled={!canEdit}
                          title={block.visibility === "shared" ? (en ? "Visible to the couple" : "Visível para o casal") : (en ? "Hidden from the couple" : "Escondido do casal")}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors disabled:opacity-50"
                        >
                          {block.visibility === "shared" ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => removeBlock(block.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          aria-label={en ? "Remove block" : "Remover bloco"}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
