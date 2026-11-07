import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE, accessCookieName, verifyAccessCookie } from "@/lib/inviteAccess";

// Acesso público (sem sessão) aos convidados, só pelo servidor (migração 0018:
// a tabela guests deixou de ser legível/alterável com a chave pública).
// Usado pelo RSVP do link geral (api/rsvp) e pela página "Encontre a sua mesa"
// (api/seating). Os links personalizados têm a sua rota (api/guest-link).
// Só servidor: usa a service_role key.

export type PublicInvite = {
  id: string;
  unlocked_modules: string[] | null;
  expires_at: string | null;
  access_code_enabled: boolean | null;
  access_code_version: number | null;
};

export const normalizeName = (s: string) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Convite existe, não expirou, tem o módulo pedido e (se tiver código de
// acesso) quem pede já passou o código. Devolve null se algo falhar.
export async function loadPublicInvite(
  req: NextRequest,
  inv: string | null,
  module: "invite" | "guests_seating",
  opts: { requireAccessCode?: boolean } = {}
): Promise<PublicInvite | null> {
  if (!inv || !UUID_RE.test(inv)) return null;
  const { data } = await supabaseAdmin
    .from("invitations")
    .select("id, unlocked_modules, expires_at, access_code_enabled, access_code_version")
    .eq("id", inv)
    .maybeSingle();
  const invite = data as PublicInvite | null;
  if (!invite) return null;
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return null;
  if (!(invite.unlocked_modules || []).includes(module)) return null;
  if (opts.requireAccessCode && invite.access_code_enabled) {
    const ok = verifyAccessCookie(invite.id, invite.access_code_version ?? 1, req.cookies.get(accessCookieName(invite.id))?.value);
    if (!ok) return null;
  }
  return invite;
}

export const MAX_TEXT = 500;
export const clean = (v: unknown, max = MAX_TEXT) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

export const RSVP_STATUS = new Set(["pending", "confirmed", "declined"]);

export async function fetchAdminGuests(invitationId: string, columns: string) {
  const { data } = await supabaseAdmin.from("guests").select(columns).eq("invitation_id", invitationId);
  return ((data as any[]) || []);
}
