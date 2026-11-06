import type { SupabaseClient } from "@supabase/supabase-js";

// Limpeza do conteúdo de um evento expirado (60 dias depois do casamento),
// pedida à mão pelo super admin. Apaga:
//   - Storage `fotos_evento/<id>/…` (fotos, vídeos e áudios dos convidados);
//   - Storage `invites`: as imagens referenciadas no próprio evento (capa,
//     galeria, Save the Date…) e as que seguem o padrão exato de nome deste
//     evento (versões substituídas). Nunca por prefixo solto: "ana" não pode
//     apanhar ficheiros de "ana-e-rui";
//   - dados pessoais: convidados, mesas, links por família, mensagens do livro
//     de visitas, gostos nas fotos, código de acesso e o conteúdo do convite.
// Fica: o registo do evento (nomes, data, marca, módulos) e os pagamentos, e os
// dados do Planeamento da agência (orçamento, tarefas, contratos, moodboard).

const INVITES_PUBLIC = "/storage/v1/object/public/invites/";
const PAGE = 1000;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function listAll(sb: SupabaseClient, bucket: string, folder: string, search?: string): Promise<string[]> {
  const names: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb.storage.from(bucket).list(folder, { limit: PAGE, offset, ...(search ? { search } : {}) });
    if (error) throw new Error(`Storage (${bucket}): ${error.message}`);
    const files = (data || []).filter(f => f.id || f.metadata); // pastas não têm id
    names.push(...files.map(f => f.name));
    if (!data || data.length < PAGE) break;
  }
  return names;
}

export type CleanupPlan = {
  eventPhotos: string[];   // caminhos em fotos_evento
  inviteFiles: string[];   // caminhos em invites
  guests: number;
  messages: number;
};

export async function planEventCleanup(sb: SupabaseClient, inv: any): Promise<CleanupPlan> {
  const id: string = inv.id;
  const slug: string = inv.slug || "";

  const photoNames = await listAll(sb, "fotos_evento", id);
  const eventPhotos = photoNames.map(n => `${id}/${n}`);

  // Ficheiros de `invites` referenciados no registo do evento (capa, galeria,
  // Save the Date, foto de perfil das galerias…).
  const referenced = new Set<string>();
  const blob = JSON.stringify(inv);
  const re = new RegExp(escapeRegex(INVITES_PUBLIC) + "([^\"?\\s]+)", "g");
  for (const m of blob.matchAll(re)) {
    const path = decodeURIComponent(m[1]);
    if (!path.startsWith("brand-logos/") && !path.startsWith("event-documents/") && !path.startsWith("moodboard/")) referenced.add(path);
  }
  // Versões antigas com o nome exato deste evento.
  if (slug) {
    const patterns: [string, RegExp][] = [
      [`${slug}-`, new RegExp(`^${escapeRegex(slug)}-\\d{13}\\.[a-z0-9]+$`, "i")],
      [`std-${slug}-`, new RegExp(`^std-${escapeRegex(slug)}-\\d{13}\\.jpg$`, "i")],
      [`gal_profile_${id}_`, new RegExp(`^gal_profile_${escapeRegex(id)}_\\d+\\.[a-z0-9]+$`, "i")],
    ];
    for (const [search, rx] of patterns) {
      for (const name of await listAll(sb, "invites", "", search)) if (rx.test(name)) referenced.add(name);
    }
  }

  const [{ count: guests }, { count: messages }] = await Promise.all([
    sb.from("guests").select("id", { count: "exact", head: true }).eq("invitation_id", id),
    sb.from("guestbook").select("id", { count: "exact", head: true }).eq("invitation_id", id),
  ]);

  return { eventPhotos, inviteFiles: [...referenced], guests: guests || 0, messages: messages || 0 };
}

async function removeInChunks(sb: SupabaseClient, bucket: string, paths: string[]) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await sb.storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`Storage (${bucket}): ${error.message}`);
  }
}

export async function runEventCleanup(sb: SupabaseClient, inv: any, plan: CleanupPlan) {
  const id: string = inv.id;
  await removeInChunks(sb, "fotos_evento", plan.eventPhotos);
  await removeInChunks(sb, "invites", plan.inviteFiles);

  // Gostos das fotos são guardados pelo nome do ficheiro.
  const photoFileNames = plan.eventPhotos.map(p => p.split("/").pop()!).filter(Boolean);
  for (let i = 0; i < photoFileNames.length; i += 200) {
    await sb.from("fotos_likes").delete().in("foto_name", photoFileNames.slice(i, i + 200));
  }

  // Ordem: primeiro quem aponta para outros (convidados → mesas).
  const steps: [string, () => PromiseLike<{ error: any }>][] = [
    ["guest_links", () => sb.from("guest_links").delete().eq("invitation_id", id)],
    ["guests", () => sb.from("guests").delete().eq("invitation_id", id)],
    ["event_tables", () => sb.from("event_tables").delete().eq("invitation_id", id)],
    ["guestbook", () => sb.from("guestbook").delete().eq("invitation_id", id)],
    ["invite_access_attempts", () => sb.from("invite_access_attempts").delete().eq("invitation_id", id)],
    ["invite_access", () => sb.from("invite_access").delete().eq("invitation_id", id)],
  ];
  for (const [table, run] of steps) {
    const { error } = await run();
    // Uma tabela opcional que não exista (migração por aplicar) não trava o resto.
    if (error && !/does not exist|schema cache/i.test(error.message || "")) throw new Error(`${table}: ${error.message}`);
  }

  const { error } = await sb.from("invitations").update({
    content: {},
    main_image_url: null,
    content_purged_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) {
    if (/content_purged_at/.test(error.message || "")) throw new Error("Falta correr a migração 0014_event_cleanup.sql no Supabase.");
    throw new Error(`invitations: ${error.message}`);
  }
}
