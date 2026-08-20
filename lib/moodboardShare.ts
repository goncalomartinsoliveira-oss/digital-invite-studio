import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveBrandById, type WorkingBrand } from "@/lib/brands";
import { isPortalLinkExpired } from "@/lib/planner";
import type { MoodboardItem, MoodboardSection } from "@/lib/moodboard";

// Leitura e escrita do link de partilha do Moodboard — corre sempre no
// servidor, com a service_role key, tal como lib/vendorPortal.ts. Aqui há
// uma diferença importante: este link também aceita ESCRITA (contribuir com
// imagens/links), não só leitura — por isso é usado tanto pela rota GET como
// pelas rotas POST em app/api/moodboard/public.
//
// Nunca importar isto num componente "use client": a service_role key não
// pode ir parar ao bundle do browser.

export type ResolvedMoodboardShareLink = { invitationId: string };

export async function resolveMoodboardShareLink(token: string): Promise<ResolvedMoodboardShareLink | null> {
  const { data: link } = await supabaseAdmin
    .from("moodboard_share_links")
    .select("invitation_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!link || isPortalLinkExpired(link)) return null;
  return { invitationId: link.invitation_id };
}

export type MoodboardShareData = {
  groomName: string;
  brideName: string;
  brand: WorkingBrand | null;
  sections: MoodboardSection[];
  items: MoodboardItem[];
};

export async function loadMoodboardShareData(invitationId: string): Promise<MoodboardShareData | null> {
  const { data: invitation } = await supabaseAdmin
    .from("invitations")
    .select("groom_name, bride_name, brand_id")
    .eq("id", invitationId)
    .maybeSingle();
  if (!invitation) return null;

  const [{ data: sections }, { data: items }, brand] = await Promise.all([
    supabaseAdmin.from("event_moodboard_sections").select("*").eq("invitation_id", invitationId).order("sort_order"),
    supabaseAdmin.from("event_moodboard_items").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false }),
    resolveBrandById(supabaseAdmin, invitation.brand_id),
  ]);

  return {
    groomName: invitation.groom_name,
    brideName: invitation.bride_name,
    brand,
    sections: (sections as MoodboardSection[]) || [],
    items: (items as MoodboardItem[]) || [],
  };
}
