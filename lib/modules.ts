// Registo fixo dos módulos vendáveis da plataforma (fixo no código, não configurável).
// O valor de cada `id` é exatamente o que é guardado em invitations.unlocked_modules.
export type ModuleId = "save_the_date" | "invite" | "guests_seating" | "photo_sharing" | "guestbook";

export const ALL_MODULE_IDS: ModuleId[] = [
  "save_the_date",
  "invite",
  "guests_seating",
  "photo_sharing",
  "guestbook",
];

// A que módulo pertence cada separador do dashboard do evento.
export const TAB_MODULE: Record<string, ModuleId> = {
  design: "invite",
  content: "invite",
  savethedate: "save_the_date",
  guests: "guests_seating",
  seating: "guests_seating",
  photosharing: "photo_sharing",
  guestbook: "guestbook",
};

export function isModuleUnlocked(unlockedModules: string[] | null | undefined, moduleId: ModuleId): boolean {
  return !!unlockedModules?.includes(moduleId);
}

// O Smart RSVP do convite pesquisa e atualiza convidados já existentes em
// "guests" — sem esse módulo, um convidado nunca se consegue confirmar.
// Por isso "invite" nunca é vendido sozinho: comprá-lo desbloqueia sempre
// "guests_seating" também, sem custo extra. Não é recíproco — dá para
// vender gestão de convidados/mesas sem convite, como ferramenta interna.
export const MODULE_DEPENDENCIES: Partial<Record<ModuleId, ModuleId[]>> = {
  invite: ["guests_seating"],
};

export function expandWithDependencies(moduleIds: ModuleId[]): ModuleId[] {
  const result = new Set<ModuleId>(moduleIds);
  for (const m of moduleIds) {
    (MODULE_DEPENDENCIES[m] || []).forEach(dep => result.add(dep));
  }
  return Array.from(result);
}
