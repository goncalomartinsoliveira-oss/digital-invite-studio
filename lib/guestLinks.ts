// Links personalizados por grupo de convidados (opcional) — lógica partilhada
// entre o painel (gerar/copiar/exportar), o convite (saudação) e o RSVP.
// Sem dependências de servidor: pode ser importado em componentes "use client".
//
// O nome mostrado e o número de lugares são SEMPRE calculados aqui a partir
// dos membros do grupo (uma só fonte de verdade); a tabela guest_links só
// guarda correções manuais (display_name / seats_override).

export type LinkMember = {
  id: string;
  name: string;
  category: string; // 'adult' | 'child' | 'baby'
};

export type GuestLinkRow = {
  id: string;
  invitation_id: string;
  group_id: string;
  token: string;
  display_name: string | null;
  seats_override: number | null;
  // "Quem já abriu" (migração 0011) — ausentes antes de correr a migração.
  first_opened_at?: string | null;
  last_opened_at?: string | null;
  open_count?: number | null;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // sem 0/O/1/l/I

// 10 caracteres de um alfabeto de 55 → ~58 bits de entropia, impossível de adivinhar.
export function generateGuestToken(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join("");
}

export const GUEST_TOKEN_RE = /^[A-Za-z0-9]{6,32}$/;

// "Ana", "Ana e Tiago", "Ana, Tiago e Rui". Só conta quem ocupa lugar (sem bebés)
// e usa o primeiro nome. Com mais de 3 nomes não tenta adivinhar ("Família ...")
// — devolve os três primeiros com reticências e o casal corrige à mão.
export function autoDisplayName(members: LinkMember[]): string {
  const firsts = members
    .filter(m => m.category !== "baby")
    .map(m => (m.name || "").trim().split(/\s+/)[0])
    .filter(Boolean);
  const names = firsts.length ? firsts : members.map(m => (m.name || "").trim().split(/\s+/)[0]).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} e ${names[2]}`;
  return `${names[0]}, ${names[1]}, ${names[2]}…`;
}

// Lugares reservados: adultos e crianças; bebés não ocupam lugar.
export function autoSeats(members: LinkMember[]): number {
  return members.filter(m => m.category !== "baby").length;
}

export type ResolvedGuestLink = {
  displayName: string;
  seats: number;
  // Quantas pessoas há no grupo (inclui bebés) — decide "si" vs "vocês".
  memberCount: number;
};

export function resolveGuestLink(
  members: LinkMember[],
  overrides: { display_name?: string | null; seats_override?: number | null } | null
): ResolvedGuestLink {
  const custom = overrides?.display_name?.trim();
  return {
    displayName: custom || autoDisplayName(members),
    seats: overrides?.seats_override ?? autoSeats(members),
    memberCount: members.length,
  };
}

export function buildGuestLinkUrl(origin: string, locale: string, slug: string, token: string): string {
  return `${origin}/${locale}/invite/${slug}?c=${token}`;
}

// Frase de lugares reservados. Convidado sozinho → "para si"; grupo → "para vocês".
export function seatsSentence(
  dict: { seatsOne: string; seatsMany: string; seatsSolo: string },
  r: ResolvedGuestLink
): string | null {
  if (r.seats <= 0) return null;
  if (r.memberCount === 1) return dict.seatsSolo;
  return (r.seats === 1 ? dict.seatsOne : dict.seatsMany).replace("{n}", String(r.seats));
}

// CSV (separador ";", com BOM) para abrir direto no Excel em PT.
export function guestLinksToCsv(rows: { name: string; seats: number; url: string }[], headers: [string, string, string]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(";"), ...rows.map(r => [r.name, r.seats, r.url].map(esc).join(";"))];
  return "﻿" + lines.join("\r\n");
}
