import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_RE } from "@/lib/inviteAccess";
import { TRIAL_LIMIT } from "@/lib/trial";

// Fotos dos convidados (página /moments), sem sessão — migração 0019.
// Cada browser tem uma chave secreta (lib/uploaderKey.ts). O servidor só
// guarda o hash dela, em photo_uploads, ao lado do caminho de cada foto.
//   POST {action:"upload", inv, key, fileName} → caminho + link de envio temporário
//   POST {action:"mine",   inv, key}           → nomes das fotos enviadas deste browser
//   POST {action:"delete", inv, key, name}     → apaga UMA foto, se for deste browser
// O envio por link temporário não passa pelas regras do Storage, por isso o
// limite de experiência (5 fotos até pagar) e o prazo verificam-se aqui.

const KEY_RE = /^[0-9a-f]{64}$/;
const BUCKET = "fotos_evento";
const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });

async function loadInvite(inv: string) {
  const { data } = await supabaseAdmin.from("invitations").select("id, unlocked_modules, expires_at").eq("id", inv).maybeSingle();
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data as { id: string; unlocked_modules: string[] | null; expires_at: string | null };
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return bad("invalid_body"); }
  const { action, inv, key } = body || {};
  if (typeof inv !== "string" || !UUID_RE.test(inv) || typeof key !== "string" || !KEY_RE.test(key)) return bad("invalid_body");
  const invite = await loadInvite(inv);
  if (!invite) return bad("not_found", 404);
  const owner = hashKey(key);

  if (action === "mine") {
    const { data, error } = await supabaseAdmin.from("photo_uploads").select("path").eq("invitation_id", inv).eq("uploader_hash", owner);
    if (error) return NextResponse.json({ names: [] }, { headers: { "cache-control": "no-store" } });
    return NextResponse.json({ names: (data || []).map(r => String(r.path).split("/").pop()) }, { headers: { "cache-control": "no-store" } });
  }

  if (action === "upload") {
    if (!(invite.unlocked_modules || []).includes("photo_sharing")) {
      const { data: files } = await supabaseAdmin.storage.from(BUCKET).list(inv, { limit: 1000 });
      const used = (files || []).filter(f => f.name !== ".emptyFolderPlaceholder" && !f.name.startsWith("private_")).length;
      if (used >= TRIAL_LIMIT.photo_sharing) return bad("trial_limit", 403);
    }
    const original = typeof body.fileName === "string" ? body.fileName : "foto.jpg";
    const safe = original.replace(/[^a-zA-Z0-9.]/g, "_").slice(-60) || "foto.jpg";
    const name = `${Date.now()}-${randomBytes(3).toString("hex")}-${safe}`;
    const path = `${inv}/${name}`;
    const { error: recError } = await supabaseAdmin.from("photo_uploads").insert({ path, invitation_id: inv, uploader_hash: owner });
    if (recError) return bad("unavailable", 503); // migração 0019 por correr
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      await supabaseAdmin.from("photo_uploads").delete().eq("path", path);
      return bad("upload_failed", 500);
    }
    return NextResponse.json({ path, name, token: data.token }, { headers: { "cache-control": "no-store" } });
  }

  if (action === "delete") {
    const name = typeof body.name === "string" ? body.name : "";
    if (!name || name.includes("/") || name.startsWith("private_")) return bad("invalid_body");
    const path = `${inv}/${name}`;
    const { data: rec } = await supabaseAdmin.from("photo_uploads").select("uploader_hash").eq("path", path).maybeSingle();
    if (!rec || rec.uploader_hash !== owner) return bad("forbidden", 403);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) return bad("delete_failed", 500);
    await supabaseAdmin.from("photo_uploads").delete().eq("path", path);
    await supabaseAdmin.from("fotos_likes").delete().eq("foto_name", name).then(() => {}, () => {});
    return NextResponse.json({ ok: true });
  }

  return bad("invalid_action");
}
