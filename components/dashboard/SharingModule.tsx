"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useBrand } from "@/components/site/BrandProvider";
import { loadImageForPdf, fitLogoBox } from "@/lib/pdfLogo";
import { Share2, Copy, Check, RefreshCw, Trash2, Loader2, Download, AlertTriangle } from "lucide-react";
import {
  generatePortalToken,
  portalLinkExpiry,
  formatEventTime,
  timelineBlockEndTime,
  VENDOR_PORTAL_KINDS,
  VENDOR_PORTAL_KIND_LABELS,
  VENDOR_PORTAL_KIND_DESCRIPTIONS,
  type VendorPortalKind,
  type VendorPortalLink,
} from "@/lib/planner";

// Página central de partilha com fornecedores — área de gestão, exclusiva de
// contas de agência. Ao contrário de Orçamento/Tarefas/Cronograma, o link não
// é por fornecedor: é por "tipo" de informação (ver lib/planner.ts), gerado
// aqui e enviado a quantos fornecedores fizer sentido — decisão consciente,
// trocada por simplicidade em vez de um link individual por fornecedor.

interface Props {
  invitationId: string;
  eventDate: string | null;
  groomName: string;
  brideName: string;
  canEdit: boolean;
  locale: string;
}

export default function SharingModule({ invitationId, eventDate, groomName, brideName, canEdit, locale }: Props) {
  const en = locale === "en";
  const brand = useBrand();
  const [links, setLinks] = useState<VendorPortalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [savingKind, setSavingKind] = useState<VendorPortalKind | null>(null);
  const [errorKind, setErrorKind] = useState<VendorPortalKind | null>(null);
  const [exportingKind, setExportingKind] = useState<VendorPortalKind | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("vendor_portal_links").select("*").eq("invitation_id", invitationId);
    setLinks((data as VendorPortalLink[]) || []);
    setLoading(false);
  }, [invitationId]);

  useEffect(() => { load(); }, [load]);

  const linkFor = (kind: VendorPortalKind) => links.find(l => l.kind === kind) || null;
  const linkUrl = (link: VendorPortalLink) => `${window.location.origin}/${locale}/fornecedor/${link.token}`;

  // "invitation_id + kind" é único: gerar quando não existe nenhum, ou trocar
  // o token quando já existe — o link antigo deixa de funcionar assim que o
  // novo token é gravado (afeta todos os que o receberam, não só um).
  const generate = async (kind: VendorPortalKind) => {
    if (!canEdit) return;
    setSavingKind(kind);
    setErrorKind(null);
    const { data, error } = await supabase
      .from("vendor_portal_links")
      .upsert(
        { invitation_id: invitationId, kind, token: generatePortalToken(), expires_at: portalLinkExpiry(eventDate) },
        { onConflict: "invitation_id,kind" }
      )
      .select("*")
      .single();
    if (error) {
      console.error("[SharingModule] Falha ao gerar link:", error.message);
      setErrorKind(kind);
    } else if (data) {
      setLinks(prev => [...prev.filter(l => l.kind !== kind), data as VendorPortalLink]);
    }
    setSavingKind(null);
  };

  const revoke = async (kind: VendorPortalKind) => {
    if (!canEdit) return;
    const link = linkFor(kind);
    if (!link) return;
    setLinks(prev => prev.filter(l => l.kind !== kind));
    await supabase.from("vendor_portal_links").delete().eq("id", link.id);
  };

  const copy = (link: VendorPortalLink) => {
    navigator.clipboard.writeText(linkUrl(link));
    setCopied(link.id);
    setTimeout(() => setCopied(prev => (prev === link.id ? null : prev)), 2000);
  };

  // Mesmo conteúdo que o link mostraria — útil para quem prefere entregar um
  // PDF ao fornecedor em vez de (ou a par de) um link. Não depende de haver
  // um link gerado: lê os dados diretamente com a sessão da agência/casal.
  const downloadPdf = async (kind: VendorPortalKind) => {
    setExportingKind(kind);
    const [{ data: timelineRows }, guestsResult] = await Promise.all([
      supabase
        .from("event_timeline")
        .select("event_time, duration_minutes, title, notes")
        .eq("invitation_id", invitationId)
        .eq("visibility", "shared")
        .order("event_time"),
      kind === "full"
        ? supabase.from("guests").select("dietary_notes").eq("invitation_id", invitationId).eq("status", "confirmed")
        : Promise.resolve({ data: null as { dietary_notes: string | null }[] | null }),
    ]);

    const doc = new jsPDF();
    let contentY = 32;
    try {
      const { dataUrl, width, height, format } = await loadImageForPdf(brand.logoRaster);
      const { width: logoWidth, height: logoHeight } = fitLogoBox(width, height);
      doc.addImage(dataUrl, format, 14, 10, logoWidth, logoHeight);
      contentY = 10 + logoHeight + 12;
    } catch {
      doc.setFontSize(16); doc.setTextColor(99, 1, 0); doc.setFont("helvetica", "bold");
      doc.text(brand.name.toUpperCase(), 14, 20);
      doc.setFont("helvetica", "normal"); contentY = 35;
    }

    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(kind === "full" ? (en ? "Event Information" : "Informação do Evento") : (en ? "Day Timeline" : "Cronograma do Dia"), 14, contentY);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    const dateLabel = eventDate ? new Date(eventDate).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "long", year: "numeric" }) : "";
    doc.text(`${groomName} & ${brideName}${dateLabel ? " | " + dateLabel : ""}`, 14, contentY + 6);
    let tableStartY = contentY + 14;

    if (kind === "full") {
      const guests = (guestsResult.data || []) as { dietary_notes: string | null }[];
      const dietary: Record<string, number> = {};
      guests.forEach(g => {
        (g.dietary_notes || "").split(",").map((t: string) => t.trim()).filter(Boolean).forEach((tag: string) => {
          dietary[tag] = (dietary[tag] || 0) + 1;
        });
      });
      doc.setFontSize(10); doc.setTextColor(50, 50, 50);
      doc.text(`${en ? "Confirmed guests" : "Convidados confirmados"}: ${guests.length}`, 14, tableStartY);
      tableStartY += 6;
      const dietaryLine = Object.entries(dietary).map(([tag, count]) => `${tag} (${count})`).join(", ");
      if (dietaryLine) {
        doc.setFontSize(9); doc.setTextColor(100, 100, 100);
        const wrapped = doc.splitTextToSize(`${en ? "Dietary notes" : "Alergias/Dietas"}: ${dietaryLine}`, 180);
        doc.text(wrapped, 14, tableStartY);
        tableStartY += wrapped.length * 4.5 + 4;
      }
    }

    const rows = (timelineRows || []).map(b => [
      formatEventTime(b.event_time),
      timelineBlockEndTime(b) || "",
      b.title || "-",
      b.notes || "-",
    ]);

    autoTable(doc, {
      startY: tableStartY + 4,
      head: [[en ? "Start" : "Início", en ? "End" : "Fim", en ? "Moment" : "Momento", en ? "Notes" : "Notas"]],
      body: rows,
      headStyles: { fillColor: [99, 1, 0] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 18 } },
    });

    doc.save(`${kind}-${groomName}-${brideName}.pdf`.toLowerCase().replace(/\s+/g, "-"));
    setExportingKind(null);
  };

  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400";

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <h3 className="font-serif text-3xl text-brand mb-2">{en ? "Share with Vendors" : "Partilha com Fornecedores"}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-8 font-bold">
          {en ? "Read-only links or PDF, no account needed" : "Links de leitura ou PDF, sem conta necessária"}
        </p>

        <div className="space-y-4">
          {VENDOR_PORTAL_KINDS.map(kind => {
            const link = linkFor(kind);
            const lang = en ? "en" : "pt";
            return (
              <div key={kind} className="bg-cream/50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{VENDOR_PORTAL_KIND_LABELS[kind][lang]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{VENDOR_PORTAL_KIND_DESCRIPTIONS[kind][lang]}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadPdf(kind)}
                      disabled={exportingKind === kind}
                      className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-50"
                    >
                      {exportingKind === kind ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PDF
                    </button>
                    {!link && canEdit && (
                      <button
                        onClick={() => generate(kind)}
                        disabled={savingKind === kind}
                        className="inline-flex items-center gap-1.5 bg-brand/5 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all disabled:opacity-50"
                      >
                        {savingKind === kind ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />} {en ? "Generate" : "Gerar"}
                      </button>
                    )}
                  </div>
                </div>

                {errorKind === kind && (
                  <p className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">
                    <AlertTriangle size={12} />
                    {en ? "Couldn't generate the link — try again in a moment." : "Não foi possível gerar o link — tente novamente."}
                  </p>
                )}

                {link && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                      <p className="flex-1 min-w-0 text-xs text-ink truncate font-mono">{linkUrl(link)}</p>
                      <button onClick={() => copy(link)} className="text-gray-400 hover:text-brand transition-colors shrink-0" aria-label="Copiar link">
                        {copied === link.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={labelCls}>
                        {en ? "Valid until " : "Válido até "}
                        {new Date(link.expires_at).toLocaleDateString(en ? "en-GB" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {canEdit && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => generate(kind)}
                            disabled={savingKind === kind}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={11} /> {en ? "Regenerate" : "Gerar novo"}
                          </button>
                          <button
                            onClick={() => revoke(kind)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={11} /> {en ? "Revoke" : "Revogar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
