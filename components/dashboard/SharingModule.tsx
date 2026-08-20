"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Share2, Copy, Check, RefreshCw, Trash2, Loader2 } from "lucide-react";
import {
  generatePortalToken,
  portalLinkExpiry,
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
  canEdit: boolean;
  locale: string;
}

export default function SharingModule({ invitationId, eventDate, canEdit, locale }: Props) {
  const en = locale === "en";
  const [links, setLinks] = useState<VendorPortalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

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
    const { data } = await supabase
      .from("vendor_portal_links")
      .upsert(
        { invitation_id: invitationId, kind, token: generatePortalToken(), expires_at: portalLinkExpiry(eventDate) },
        { onConflict: "invitation_id,kind" }
      )
      .select("*")
      .single();
    if (data) setLinks(prev => [...prev.filter(l => l.kind !== kind), data as VendorPortalLink]);
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

  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-gray-400";

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">
        <h3 className="font-serif text-3xl text-brand mb-2">{en ? "Share with Vendors" : "Partilha com Fornecedores"}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-8 font-bold">
          {en ? "Read-only links, no account needed" : "Links de leitura, sem conta necessária"}
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
                  {!link && canEdit && (
                    <button
                      onClick={() => generate(kind)}
                      className="inline-flex items-center gap-1.5 bg-brand/5 text-brand px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand/10 transition-all shrink-0"
                    >
                      <Share2 size={13} /> {en ? "Generate" : "Gerar"}
                    </button>
                  )}
                </div>

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
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
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
