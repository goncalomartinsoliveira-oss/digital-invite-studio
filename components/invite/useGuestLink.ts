"use client";
import { useEffect, useState } from "react";

// Lê o código do link personalizado (?c=...) e vai buscar ao servidor SÓ os
// dados do grupo. Sem ?c= (link geral) devolve "none" e nada muda — o convite e
// o RSVP comportam-se como sempre. Partilhado pela saudação do ecrã de entrada
// e pelo RSVP; o resultado fica em cache por código para não pedir duas vezes.

export type GuestLinkMember = {
  id: string;
  name: string;
  category: string;
  status: string;
  dietary_notes?: string | null;
  notes?: string | null;
};

export type GuestLinkData = {
  token: string;
  invitationId: string;
  displayName: string;
  seats: number;
  memberCount: number;
  members: GuestLinkMember[];
};

export type GuestLinkState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; data: GuestLinkData };

const cache = new Map<string, Promise<GuestLinkData | null>>();

function fetchLink(token: string, invitationId: string): Promise<GuestLinkData | null> {
  const key = `${invitationId}:${token}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/guest-link/${encodeURIComponent(token)}?inv=${encodeURIComponent(invitationId)}`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => (j ? ({ token, ...j } as GuestLinkData) : null))
      .catch(() => null);
    cache.set(key, p);
  }
  return p;
}

export function useGuestLink(invitationId: string): GuestLinkState {
  const [state, setState] = useState<GuestLinkState>({ status: "none" });

  useEffect(() => {
    if (!invitationId) return;
    const token = new URLSearchParams(window.location.search).get("c");
    if (!token) { setState({ status: "none" }); return; }
    let cancelled = false;
    setState({ status: "loading" });
    fetchLink(token, invitationId).then(data => {
      if (cancelled) return;
      setState(data ? { status: "ready", data } : { status: "invalid" });
    });
    return () => { cancelled = true; };
  }, [invitationId]);

  return state;
}

// Depois de gravar o RSVP o estado do grupo mudou — descarta a cache para que
// uma nova abertura mostre as respostas atuais.
export function invalidateGuestLink(token: string, invitationId: string) {
  cache.delete(`${invitationId}:${token}`);
}
