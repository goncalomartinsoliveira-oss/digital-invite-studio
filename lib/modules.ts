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
