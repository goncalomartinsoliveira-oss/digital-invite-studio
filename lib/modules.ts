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
