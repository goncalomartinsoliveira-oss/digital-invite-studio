"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Trash2, ShieldCheck, Loader2 } from "lucide-react";

// Equipa interna (super admin › Administração › Equipa interna): quem é super
// admin da Digital Invite Studio. A equipa de cada parceiro gere-se na ficha
// do parceiro (BrandMembersPanel).

export default function InternalTeamView({ currentEmail, locale }: { currentEmail: string; locale: string }) {
  const en = locale === "en";
  const t = {
    title: en ? "Internal team" : "Equipa interna",
    subtitle: en ? "Super admins see and manage every event, partner, commission and coupon. Partner teams are managed in each partner's file (Partners)." : "Os super admins veem e gerem todos os eventos, parceiros, comissões e cupões. A equipa de cada parceiro gere-se na ficha do parceiro (Parceiros).",
    list: en ? "Super admins" : "Super admins",
    emailPh: en ? "email@example.com" : "email@exemplo.com",
    add: en ? "Add" : "Adicionar",
    you: en ? "you" : "você",
    remove: en ? "Remove" : "Remover",
    removeConfirm: en ? "Remove super admin access from {e}?" : "Retirar o acesso de super admin a {e}?",
  };

  const [admins, setAdmins] = useState<string[] | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const normalize = (e: string) => e.trim().toLowerCase();
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const me = normalize(currentEmail);

  const load = useCallback(async () => {
    const { data } = await supabase.from("super_admins").select("user_email").order("created_at", { ascending: true });
    setAdmins((data || []).map((r: any) => r.user_email));
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const email = normalize(newEmail);
    if (!validEmail(email)) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("super_admins").insert([{ user_email: email }]);
    if (error) setMsg(error.message);
    else { setNewEmail(""); await load(); }
    setBusy(false);
  };

  const remove = async (email: string) => {
    if (email === me || !confirm(t.removeConfirm.replace("{e}", email))) return;
    await supabase.from("super_admins").delete().eq("user_email", email);
    await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm max-w-3xl">{t.subtitle}</p>
      </div>
      <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={18} className="text-brand" />
          <h2 className="font-serif text-2xl text-ink">{t.list}</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
          <input className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" type="email" placeholder={t.emailPh} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <button onClick={add} disabled={busy || !validEmail(normalize(newEmail))} className="inline-flex items-center justify-center gap-2 bg-ink text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} {t.add}
          </button>
        </div>
        {msg && <p className="text-[11px] text-red-500 mb-3">{msg}</p>}
        {!admins ? (
          <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
        ) : (
          <ul className="divide-y divide-gray-50 border-t border-gray-50">
            {admins.map(email => (
              <li key={email} className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-ink truncate">{email} {email === me && <span className="text-[10px] text-gray-400">({t.you})</span>}</span>
                {email !== me && (
                  <button onClick={() => remove(email)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove} aria-label={t.remove}><Trash2 size={16} /></button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
