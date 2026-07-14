"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Trash2, Loader2, ShieldCheck } from "lucide-react";

interface BrandOption { id: string; name: string; }

interface MembersManagementViewProps {
  brands: BrandOption[];       // marcas que este utilizador pode gerir
  isSuperAdmin: boolean;       // mostra a secção de super-admins
  currentEmail: string;        // para impedir auto-remoção de super-admin
  locale: string;
}

type Member = { id: string; brand_id: string; user_email: string; role: string };

export default function MembersManagementView({ brands, isSuperAdmin, currentEmail, locale }: MembersManagementViewProps) {
  const en = locale === "en";
  const t = {
    title: en ? "Members & roles" : "Membros e permissões",
    subtitle: en ? "Give people access to a brand and set their role." : "Dê acesso a uma marca e defina o papel de cada pessoa.",
    brand: en ? "Brand" : "Marca",
    addTitle: en ? "Add member" : "Adicionar membro",
    emailPh: en ? "email@example.com" : "email@exemplo.com",
    add: en ? "Add" : "Adicionar",
    role: en ? "Role" : "Papel",
    admin: en ? "Admin" : "Administrador",
    staff: en ? "Staff" : "Colaborador",
    members: en ? "Members" : "Membros",
    noMembers: en ? "No members yet." : "Ainda não há membros.",
    remove: en ? "Remove" : "Remover",
    superTitle: en ? "Super-admins (DIS)" : "Super-admins (DIS)",
    superSub: en ? "See and manage every brand." : "Veem e gerem todas as marcas.",
    you: en ? "you" : "você",
    hint: en ? "Adding an email pre-authorises access; the person gets in when they log in with that email." : "Adicionar um email pré-autoriza o acesso; a pessoa entra quando fizer login com esse email.",
    alreadyMember: en ? "That email is already a member." : "Esse email já é membro.",
  };

  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.id || "");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [newSuper, setNewSuper] = useState("");

  const loadMembers = useCallback(async (brandId: string) => {
    if (!brandId) return;
    setLoading(true);
    const { data } = await supabase.from("brand_members").select("*").eq("brand_id", brandId).order("created_at", { ascending: true });
    setMembers((data as Member[]) || []);
    setLoading(false);
  }, []);

  const loadSuperAdmins = useCallback(async () => {
    const { data } = await supabase.from("super_admins").select("user_email").order("created_at", { ascending: true });
    setSuperAdmins((data || []).map((r: any) => r.user_email));
  }, []);

  useEffect(() => { loadMembers(selectedBrand); }, [selectedBrand, loadMembers]);
  useEffect(() => { if (isSuperAdmin) loadSuperAdmins(); }, [isSuperAdmin, loadSuperAdmins]);

  const normalize = (e: string) => e.trim().toLowerCase();
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const addMember = async () => {
    const email = normalize(newEmail);
    if (!validEmail(email) || !selectedBrand) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("brand_members").insert([{ brand_id: selectedBrand, user_email: email, role: newRole }]);
    if (error) {
      setMsg(error.code === "23505" ? t.alreadyMember : error.message);
    } else {
      setNewEmail(""); setNewRole("staff");
      await loadMembers(selectedBrand);
    }
    setBusy(false);
  };

  const updateRole = async (id: string, role: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    await supabase.from("brand_members").update({ role }).eq("id", id);
  };

  const removeMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    await supabase.from("brand_members").delete().eq("id", id);
  };

  const addSuperAdmin = async () => {
    const email = normalize(newSuper);
    if (!validEmail(email)) return;
    await supabase.from("super_admins").insert([{ user_email: email }]);
    setNewSuper("");
    await loadSuperAdmins();
  };

  const removeSuperAdmin = async (email: string) => {
    if (email === normalize(currentEmail)) return; // não remover a si próprio
    await supabase.from("super_admins").delete().eq("user_email", email);
    await loadSuperAdmins();
  };

  const inputCls = "bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-ink focus:ring-0 focus:border-brand outline-none";
  const selectCls = "bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-ink focus:ring-0 focus:border-brand outline-none cursor-pointer";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">{t.title}</h1>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Seletor de marca (quando há mais do que uma) */}
      {brands.length > 1 && (
        <div className="mb-8 flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.brand}</label>
          <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className={selectCls}>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {/* Adicionar membro */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <h2 className="font-serif text-2xl text-ink mb-1">{t.addTitle}</h2>
        <p className="text-[11px] text-gray-400 mb-5">{t.hint}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input className={`${inputCls} flex-1`} type="email" placeholder={t.emailPh} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <select className={selectCls} value={newRole} onChange={e => setNewRole(e.target.value)}>
            <option value="staff">{t.staff}</option>
            <option value="admin">{t.admin}</option>
          </select>
          <button onClick={addMember} disabled={busy || !validEmail(normalize(newEmail))} className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} {t.add}
          </button>
        </div>
        {msg && <p className="text-[11px] text-red-500 mt-3">{msg}</p>}
      </div>

      {/* Lista de membros */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-cream/50">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.members}</span>
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">{t.noMembers}</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {members.map(m => (
              <li key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <span className="text-sm text-ink truncate">{m.user_email}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <select value={m.role} onChange={e => updateRole(m.id, e.target.value)} className={selectCls}>
                    <option value="staff">{t.staff}</option>
                    <option value="admin">{t.admin}</option>
                  </select>
                  <button onClick={() => removeMember(m.id)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Super-admins (só para super-admins) */}
      {isSuperAdmin && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mt-10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-brand" />
            <h2 className="font-serif text-2xl text-ink">{t.superTitle}</h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-5">{t.superSub}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
            <input className={`${inputCls} flex-1`} type="email" placeholder={t.emailPh} value={newSuper} onChange={e => setNewSuper(e.target.value)} />
            <button onClick={addSuperAdmin} disabled={!validEmail(normalize(newSuper))} className="inline-flex items-center justify-center gap-2 bg-ink text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50">
              <UserPlus size={14} /> {t.add}
            </button>
          </div>
          <ul className="divide-y divide-gray-50 border-t border-gray-50">
            {superAdmins.map(email => (
              <li key={email} className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-ink truncate">
                  {email} {email === normalize(currentEmail) && <span className="text-[10px] text-gray-400">({t.you})</span>}
                </span>
                {email !== normalize(currentEmail) && (
                  <button onClick={() => removeSuperAdmin(email)} className="text-gray-300 hover:text-red-500 transition-colors" title={t.remove}>
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
