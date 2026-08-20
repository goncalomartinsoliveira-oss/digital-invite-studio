import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveBrandById, type WorkingBrand } from "@/lib/brands";
import { formatEventTime, timelineBlockEndTime, isPortalLinkExpired } from "@/lib/planner";

type TimelineRow = { event_time: string; duration_minutes: number | null; title: string; notes: string | null };

// Carregamento dos dados da página pública do fornecedor — corre sempre no
// servidor (Server Component), com a service_role key. É a única leitura de
// todo o módulo Wedding Planner que não passa pelas políticas de RLS: o
// token já é o controlo de acesso (ver 0005_vendor_portal.sql), por isso
// aqui é o próprio código que decide, à mão, exatamente que colunas devolver
// — nunca um `select("*")`.
//
// Nunca importar isto num componente "use client" (mesmo aviso de
// lib/supabaseAdmin.ts): a service_role key não pode ir parar ao bundle do
// browser. Só a página do fornecedor (Server Component) importa este ficheiro.

export type VendorPortalData = {
  vendorName: string;
  category: string;
  groomName: string;
  brideName: string;
  eventDate: string | null;
  brand: WorkingBrand | null;
  timeline: { start: string; end: string | null; title: string; notes: string | null }[];
  catering: { confirmedGuests: number; dietary: Record<string, number> } | null;
};

export async function loadVendorPortalData(token: string): Promise<VendorPortalData | null> {
  const { data: link } = await supabaseAdmin
    .from("vendor_portal_links")
    .select("cost_id, invitation_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!link || isPortalLinkExpired(link)) return null;

  const [{ data: cost }, { data: invitation }] = await Promise.all([
    supabaseAdmin.from("event_costs").select("category, vendor_id").eq("id", link.cost_id).maybeSingle(),
    supabaseAdmin.from("invitations").select("groom_name, bride_name, event_date, brand_id").eq("id", link.invitation_id).maybeSingle(),
  ]);
  if (!cost || !invitation) return null;

  const [{ data: vendor }, { data: timelineRows }, brand] = await Promise.all([
    cost.vendor_id
      ? supabaseAdmin.from("agency_vendors").select("name").eq("id", cost.vendor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("event_timeline")
      .select("event_time, duration_minutes, title, notes")
      .eq("invitation_id", link.invitation_id)
      .eq("visibility", "shared")
      .order("event_time"),
    resolveBrandById(supabaseAdmin, invitation.brand_id),
  ]);

  let catering: VendorPortalData["catering"] = null;
  if (cost.category === "catering") {
    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("dietary_notes")
      .eq("invitation_id", link.invitation_id)
      .eq("status", "confirmed");
    const dietary: Record<string, number> = {};
    (guests || []).forEach((g: { dietary_notes: string | null }) => {
      (g.dietary_notes || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((tag) => {
        dietary[tag] = (dietary[tag] || 0) + 1;
      });
    });
    catering = { confirmedGuests: (guests || []).length, dietary };
  }

  return {
    vendorName: vendor?.name || "Fornecedor",
    category: cost.category,
    groomName: invitation.groom_name,
    brideName: invitation.bride_name,
    eventDate: invitation.event_date,
    brand,
    timeline: ((timelineRows as TimelineRow[]) || []).map((b) => ({
      start: formatEventTime(b.event_time),
      end: timelineBlockEndTime(b),
      title: b.title,
      notes: b.notes,
    })),
    catering,
  };
}
