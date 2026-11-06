// Convidados fictícios do convite de exemplo (salas de demonstração em
// /preview/<modelo>). O SmartRsvp reconhece DEMO_INVITATION_ID e usa esta
// lista em vez da base de dados: o visitante experimenta o RSVP todo
// (pesquisar, confirmar, pedir acesso) e nada é gravado.

export const DEMO_INVITATION_ID = "preview";

export type DemoGuest = {
  id: string; name: string; group_id: string; category: "adult" | "child" | "baby";
  status: "pending" | "confirmed" | "declined"; dietary_notes: string | null; notes: string | null;
};

export const DEMO_GUESTS: DemoGuest[] = [
  { id: "demo-1", name: "Maria Silva", group_id: "silva", category: "adult", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-2", name: "José Silva", group_id: "silva", category: "adult", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-3", name: "Pedro Silva", group_id: "silva", category: "child", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-4", name: "Ana Costa", group_id: "costa", category: "adult", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-5", name: "Tiago Costa", group_id: "costa", category: "adult", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-6", name: "Marta Santos", group_id: "santos", category: "adult", status: "pending", dietary_notes: null, notes: null },
  { id: "demo-7", name: "Bruno Santos", group_id: "santos", category: "adult", status: "pending", dietary_notes: null, notes: null },
];

export const DEMO_DIETARY_TAGS: Record<"pt" | "en", string[]> = {
  pt: ["Vegetariano", "Sem glúten", "Sem lactose"],
  en: ["Vegetarian", "Gluten-free", "Lactose-free"],
};
