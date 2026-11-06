"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Trash2, Loader2, Users } from "lucide-react";

// Equipa de um parceiro (super admin › Parceiros › ficha): quem entra no
// painel com a marca do parceiro (brand_members). Adicionar um e-mail
// pré-autoriza o acesso; a pessoa entra quando fizer login com esse e-mail.

type Member = { id: string; brand_id: string; user_email: string; role: string };

export default function BrandMembersPanel({ brandId, locale }: { brandId: string; locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Partner team" : "Equipa do parceiro",
    hint: en ? "Adding an email pre-authorises access; the person gets in when they log in with that email. Admins also manage the partner's events as owners." : "Adicionar um e-mail pré-autoriza o acesso; a pessoa entra quando fizer login com esse e-mail. Os administradores gerem os eventos do parceiro como donos.",
    emailPh: en ? "email@example.com" : "email@exemplo.com",
    add: en ? "Add" : "Adicionar",
    admin: en ? "Admin" : "Administrador",
    staff: en ? "Staff" : "Colaborador",
    none: en ? "No one in this partner's team yet." : "Ainda não há ninguém na equipa deste parceiro.",
    remove: en ? "Remove" : "Remover",
    removeConfirm: en ? "Remove {e} from this partner's team?" : "Remover {e} da equipa deste parceiro?",
    alreadyMember: en ? "That email is already in the team." : "Esse e-mail já está na equipa.",
  };

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("brand_members").select("*").eq("brand_id", brandId).order("created_at", { ascending: true });
    setMembers((data as Member[]) || []);
    setLoading(false);
  }, [brandId]);
  useEffect(() => { load(); }, [load]);

  const normalize = (e: string) => e.trim().toLowerCase();
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const addMember = async () => {
    const email = normalize(newEmail);
    if (!validEmail(email)) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("brand_members").insert([{ brand_id: brandId, user_email: email, role: newRole }]);
    if (error) setMsg(error.code === "23505" ? t.alreadyMember : error.message);
    else { setNewEmail(""); setNewRole("staff"); await load(); }
    setBusy(false);
  };

  const updateRole = async (id: string, role: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    await supabase.from("brand_members").update({ role }).eq("id", id);
  };

  const removeMember = async (m: Member) => {
    if (!confirm(t.removeConfirm.replace("{e}", m.user_email))) return;
    setMembers(prev => prev.filter(x => x.id !== m.id));
    await supabase.from("brand_members").delete().eq("id", m.id);
  };

  const inputCls = "bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand";
  const label = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5";

  return (
    <div>
      <p className={label}><Users size={11} /> {t.title}</p>
      <p className="text-[11px] text-gray-500 mb-3">{t.hint}</p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-3">
        <input className={`${inputCls} flex-1`} type="email" placeholder={t.emailPh} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
        <select className={inputCls} value={newRole} onChange={e => setNewRole(e.target.value)} aria-label={t.title}>
          <option value="staff">{t.staff}</option>
          <option value="admin">{t.admin}</option>
        </select>
        <button onClick={addMember} disabled={busy || !validEmail(normalize(newEmail))} className="inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-40">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} {t.add}
        </button>
      </div>
      {msg && <p className="text-[11px] text-red-500 mb-2">{msg}</p>}
      {loading ? (
        <div className="py-3 flex justify-center"><Loader2 size={16} className="animate-spin text-brand/40" /></div>
      ) : members.length === 0 ? (
        <p className="text-[11px] text-gray-400">{t.none}</p>
      ) : (
        <ul className="divide-y divide-gray-50 border border-gray-100 rounded-2xl">
          {members.map(m => (
            <li key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-sm text-ink truncate">{m.user_email}</span>
              <div className="flex items-center gap-2 shrink-0">
                <select value={m.role} onChange={e => updateRole(m.id, e.target.value)} className={`${inputCls} py-1.5 text-xs`} aria-label={m.user_email}>
                  <option value="staff">{t.staff}</option>
                  <option value="admin">{t.admin}</option>
                </select>
                <button onClick={() => removeMember(m)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove} aria-label={t.remove}>
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
