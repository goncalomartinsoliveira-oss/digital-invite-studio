// Eventos arquivados: um casamento passa para "Arquivados" na lista de eventos
// no dia seguinte à data do evento (comparação por dia, no fuso do browser).
// Só separa visualmente — o convite continua online até expires_at (60 dias
// depois do casamento) e nada é apagado.

function localISODay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isArchivedEvent(ev: { event_date?: string | null }, today: Date = new Date()): boolean {
  if (!ev.event_date) return false;
  return ev.event_date.slice(0, 10) < localISODay(today);
}

export function isExpiredEvent(ev: { expires_at?: string | null }, now: Date = new Date()): boolean {
  return !!ev.expires_at && new Date(ev.expires_at).getTime() < now.getTime();
}
