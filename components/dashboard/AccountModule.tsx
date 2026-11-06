"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { UserPlus, Trash2, ShieldCheck, Mail, Loader2, LogOut, Key, User, Package, Lock, Check, Receipt, Sparkles, Send, Users, ExternalLink, CircleDot } from "lucide-react";
import { ALL_MODULE_IDS, expandWithDependencies, isModuleUnlocked, type ModuleId } from "@/lib/modules";
import { formatPriceCents, type ClientPlanQuote } from "@/lib/checkout";

// Conta do evento, em quatro blocos com uma pergunta cada:
//   1. O vosso plano — está publicado? o que inclui? quanto custa / quem paga?
//   2. Pagamentos — o que já se pagou (escondido aos noivos quando paga o parceiro,
//      para não mostrar o preço de parceiro).
//   3. Equipa do evento — dono e colaboradores.
//   4. Os vossos dados — o e-mail de quem está a ver, password e sair.
// Super admin: bloco extra "Módulos do Evento" (ativar à mão, venda por fora).

type AccountDict = {
  nav: { plan: string; payments: string; team: string; profile: string };
  plan: {
    title: string; subtitle: string; published: string; unpublished: string;
    publishedDesc: string; unpublishedDesc: string; trialNote: string; includes: string;
    publishedOn: string; onlineUntil: string; oneTime: string; upgradeNote: string; publishBtn: string;
    partnerIncluded: string; partnerContact: string; couplePays: string;
    staffPartnerPays: string; staffCouplePays: string; payerHint: string; superAdminNote: string;
  };
  profile: {
    title: string; subtitle: string; logoutBtn: string; emailLabel: string;
    passwordLabel: string; passwordPlaceholder: string; passwordSuccess: string;
  };
  ownership: { title: string; subtitle: string; ownerLabel: string; ownerBadge: string };
  collaborators: {
    title: string; subtitle: string; emailPlaceholder: string;
    roleEditor: string; roleViewer: string; inviteBtn: string; emptyState: string;
    badgeEditor: string; badgeViewer: string; readOnlyNote: string;
    alertSelfInvite: string; alertAddError: string; alertRemoveConfirm: string; alertPasswordError: string;
  };
  modules: {
    title: string; subtitle: string;
    items: Record<ModuleId, string>;
    lockedNote: string; unlockedNote: string; dateLockedSince: string;
    paymentPrompt: string; saveError: string;
  };
  history: {
    title: string; subtitle: string; emptyState: string; receiptNote: string; partnerHandled: string;
    dateLabel: string; itemLabel: string; amountLabel: string; statusLabel: string;
    status: { paid: string; pending: string; failed: string; refunded: string; partially_refunded: string };
  };
};

interface AccountModuleProps {
  invite: {
    id: string; user_email?: string | null; unlocked_modules?: string[] | null;
    date_locked_at?: string | null; expires_at?: string | null; paid_by?: string | null;
  };
  currentEmail: string;          // quem está a ver (pode não ser o dono)
  isSuperAdmin?: boolean;
  isPartnerBrand?: boolean;      // noivos num evento pago pelo parceiro
  isPartnerStaff?: boolean;      // equipa do parceiro, num evento do parceiro
  partnerName?: string;
  partnerContactUrl?: string;
  canManageTeam?: boolean;
  quote?: ClientPlanQuote | null;
  publishing?: boolean;
  onPublish?: () => void;
  moduleNames?: Record<string, string>;
  bundleNames?: Record<string, string>;
  // Avisa o painel do evento quando os módulos mudam, para a cópia dele não ficar
  // desatualizada (senão o autosave voltava a gravar a lista antiga).
  onModulesChange?: (modules: string[], dateLockedAt: string | null) => void;
  dict: AccountDict;
}

export default function AccountModule({
  invite, currentEmail, isSuperAdmin, isPartnerBrand, isPartnerStaff, partnerName, partnerContactUrl,
  canManageTeam = true, quote, publishing, onPublish, moduleNames, bundleNames, onModulesChange, dict,
}: AccountModuleProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "pt";
  const invitationId = invite.id;
  const ownerEmail = invite.user_email || "";

  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState("editor");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [unlockedModules, setUnlockedModules] = useState<string[]>(invite.unlocked_modules || []);
  const [dateLockedAt, setDateLockedAt] = useState<string | null>(invite.date_locked_at || null);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    fetchCollaborators();
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  useEffect(() => {
    setUnlockedModules(invite.unlocked_modules || []);
    setDateLockedAt(invite.date_locked_at || null);
  }, [invite.unlocked_modules, invite.date_locked_at]);

  async function fetchPayments() {
    setPaymentsLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false });
    // Tentativas falhadas (checkout abandonado) só interessam ao super admin.
    if (!error) setPayments((data || []).filter((p: any) => isSuperAdmin || p.status !== "failed"));
    setPaymentsLoading(false);
  }

  const toggleModule = async (moduleId: ModuleId) => {
    const isUnlocked = unlockedModules.includes(moduleId);
    // Ao ligar, expandir dependências (ex.: "invite" traz sempre "guests_seating"
    // consigo, senão o RSVP fica quebrado). Ao desligar, só remove o próprio módulo.
    const next = isUnlocked
      ? unlockedModules.filter(m => m !== moduleId)
      : expandWithDependencies([...unlockedModules as ModuleId[], moduleId]);
    const newlyUnlocked = next.filter(m => !unlockedModules.includes(m));
    setTogglingModule(moduleId);
    const { data, error } = await supabase
      .from("invitations")
      .update({ unlocked_modules: next })
      .eq("id", invitationId)
      .select("unlocked_modules, date_locked_at")
      .single();
    if (!error && data) {
      setUnlockedModules(data.unlocked_modules || []);
      setDateLockedAt(data.date_locked_at || null);
      onModulesChange?.(data.unlocked_modules || [], data.date_locked_at || null);
    } else {
      console.error("toggleModule:", error);
      window.alert(dict.modules.saveError);
    }
    setTogglingModule(null);

    // Desbloqueio manual (parceiro pagou-nos por fora, ou oferta) — registar
    // opcionalmente o valor para a receita continuar correta no painel
    // "Visão geral". Deixar em branco não regista nada, só desbloqueia.
    if (!error && !isUnlocked && newlyUnlocked.length > 0) {
      const raw = window.prompt(dict.modules.paymentPrompt, "");
      const amount = raw ? Number(raw.replace(",", ".")) : 0;
      if (amount > 0) {
        await supabase.from("payments").insert({
          invitation_id: invitationId,
          stripe_session_id: `manual_${crypto.randomUUID()}`,
          stripe_payment_intent: null,
          module_ids: newlyUnlocked,
          bundle_id: null,
          amount_cents: Math.round(amount * 100),
          currency: "eur",
          status: "paid",
          customer_email: null,
          coupon_code: null,
          paid_at: new Date().toISOString(),
        });
        fetchPayments();
      }
    }
  };

  async function fetchCollaborators() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invitation_collaborators")
      .select("*")
      .eq("invitation_id", invitationId);
    if (!error) setCollaborators(data || []);
    setLoading(false);
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) return;
    if (collaboratorEmail.trim().toLowerCase() === ownerEmail.trim().toLowerCase()) {
      alert(dict.collaborators.alertSelfInvite);
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from("invitation_collaborators")
      .insert([{ invitation_id: invitationId, user_email: collaboratorEmail.toLowerCase().trim(), role: collaboratorRole }]);
    if (error) alert(dict.collaborators.alertAddError + error.message);
    else { setCollaboratorEmail(""); fetchCollaborators(); }
    setAdding(false);
  };

  const removeCollaborator = async (id: string) => {
    if (!confirm(dict.collaborators.alertRemoveConfirm)) return;
    const { error } = await supabase.from("invitation_collaborators").delete().eq("id", id);
    if (!error) fetchCollaborators();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(dict.collaborators.alertPasswordError + error.message);
    else { alert(dict.profile.passwordSuccess); setNewPassword(""); }
    setSavingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${params.locale}`);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale === "en" ? "en-IE" : "pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  const published = isModuleUnlocked(unlockedModules, "invite");
  const firstPaid = [...payments].filter(p => p.status === "paid").sort((a, b) => (a.paid_at || a.created_at).localeCompare(b.paid_at || b.created_at))[0];
  const publishedAt = firstPaid?.paid_at || firstPaid?.created_at || dateLockedAt;
  const partner = partnerName || "";
  const canBuy = !!quote?.canBuy && quote.cents != null && !isSuperAdmin && !isPartnerBrand;

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block";
  const inputClass = "w-full bg-cream border border-gray-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all font-montserrat";
  const sectionClass = "bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 scroll-mt-28";
  const header = (n: number, icon: React.ReactNode, title: string, subtitle: string, right?: React.ReactNode) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">{icon}</div>
        <div>
          <h3 className="font-serif text-2xl text-ink"><span className="text-gold mr-2 text-lg">{String(n).padStart(2, "0")}</span>{title}</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
  const navItems: { id: string; label: string }[] = [
    { id: "account-plan", label: dict.nav.plan },
    { id: "account-payments", label: dict.nav.payments },
    { id: "account-team", label: dict.nav.team },
    { id: "account-profile", label: dict.nav.profile },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 font-montserrat pb-20">

      <nav aria-label={dict.profile.subtitle} className="flex flex-wrap justify-center gap-2">
        {navItems.map(n => (
          <a key={n.id} href={`#${n.id}`} className="px-4 py-2 rounded-full bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand hover:border-gold-soft transition-all">
            {n.label}
          </a>
        ))}
      </nav>

      {/* 01. O VOSSO PLANO */}
      <section id="account-plan" className={sectionClass}>
        {header(1, <Sparkles size={24} />, dict.plan.title, dict.plan.subtitle,
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            <CircleDot size={11} /> {published ? dict.plan.published : dict.plan.unpublished}
          </span>
        )}

        <p className="text-sm text-gray-600 leading-relaxed">{published ? dict.plan.publishedDesc : dict.plan.unpublishedDesc}</p>
        {published && (publishedAt || invite.expires_at) && (
          <p className="text-xs text-gray-500 mt-2">
            {publishedAt && dict.plan.publishedOn.replace("{date}", fmtDate(publishedAt))}
            {publishedAt && invite.expires_at && " · "}
            {invite.expires_at && dict.plan.onlineUntil.replace("{date}", fmtDate(invite.expires_at))}
          </p>
        )}
        {!published && <p className="text-xs text-gray-400 mt-2">{dict.plan.trialNote}</p>}

        <p className={`${labelClass} mt-8`}>{dict.plan.includes}</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {ALL_MODULE_IDS.map(m => {
            const on = unlockedModules.includes(m);
            return (
              <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${on ? "bg-green-500 text-white" : "bg-cream border border-gold-soft text-brand"}`}><Check size={11} /></span>
                {moduleNames?.[m] ?? dict.modules.items[m]}
              </li>
            );
          })}
        </ul>

        {/* Quem paga / como publicar */}
        {!published && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            {isSuperAdmin ? (
              <p className="text-xs text-gray-500">{dict.plan.superAdminNote}</p>
            ) : isPartnerBrand ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-600">{dict.plan.partnerIncluded.replace("{partner}", partner)}</p>
                {partnerContactUrl && (
                  <a href={partnerContactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-brand shrink-0">
                    {dict.plan.partnerContact.replace("{partner}", partner)} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {isPartnerStaff
                      ? (quote?.payer === "couple" ? dict.plan.staffCouplePays : dict.plan.staffPartnerPays)
                      : partner && invite.paid_by === "couple" ? dict.plan.couplePays : ""}
                  </p>
                  {isPartnerStaff && <p className="text-[11px] text-gray-400 mt-1">{dict.plan.payerHint}</p>}
                  {canBuy && (
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="font-serif text-3xl text-brand">{formatPriceCents(quote!.cents!, locale)}</span>
                      <span className="text-[11px] text-gray-400">{quote!.isUpgrade ? dict.plan.upgradeNote : dict.plan.oneTime}</span>
                    </p>
                  )}
                </div>
                {canBuy && onPublish && (
                  <button onClick={onPublish} disabled={publishing} className="inline-flex items-center justify-center gap-2 bg-brand text-gold-soft px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60 shrink-0">
                    {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {dict.plan.publishBtn}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Super admin: ativar módulos à mão (venda por fora, oferta). */}
      {isSuperAdmin && (
        <section className={sectionClass}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand"><Package size={24} /></div>
            <div>
              <h3 className="font-serif text-2xl text-ink">{dict.modules.title}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{dict.modules.subtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_MODULE_IDS.map(moduleId => {
              const unlocked = unlockedModules.includes(moduleId);
              return (
                <button
                  key={moduleId}
                  onClick={() => toggleModule(moduleId)}
                  disabled={togglingModule === moduleId}
                  className={`flex items-center justify-between gap-3 p-5 rounded-2xl border text-left transition-all disabled:opacity-60 ${unlocked ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"}`}
                >
                  <span className={`text-sm font-bold ${unlocked ? "text-green-700" : "text-gray-500"}`}>{dict.modules.items[moduleId]}</span>
                  {togglingModule === moduleId ? (
                    <Loader2 size={16} className="animate-spin text-gray-300 shrink-0" />
                  ) : (
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${unlocked ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-transparent"}`}><Check size={14} /></span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-6">
            <Lock size={11} className="shrink-0" />
            {dateLockedAt
              ? `${dict.modules.lockedNote} ${dict.modules.dateLockedSince} ${new Date(dateLockedAt).toLocaleDateString()}.`
              : dict.modules.unlockedNote}
          </p>
        </section>
      )}

      {/* 02. PAGAMENTOS */}
      <section id="account-payments" className={sectionClass}>
        {header(2, <Receipt size={24} />, dict.history.title, dict.history.subtitle)}
        {isPartnerBrand ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-500">
            <p className="text-xs">{dict.history.partnerHandled.replace("{partner}", partner)}</p>
          </div>
        ) : paymentsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-200" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400">
            <p className="text-xs">{dict.history.emptyState}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {payments.map((payment) => {
                const itemLabel = payment.bundle_id
                  ? (bundleNames?.[payment.bundle_id] ?? payment.bundle_id)
                  : (payment.module_ids || []).map((m: string) => moduleNames?.[m] ?? m).join(", ");
                const statusStyles: Record<string, string> = {
                  paid: "bg-green-50 text-green-700",
                  pending: "bg-amber-50 text-amber-600",
                  failed: "bg-red-50 text-red-600",
                  refunded: "bg-gray-100 text-gray-500",
                  partially_refunded: "bg-gray-100 text-gray-500",
                };
                const statusLabel = (dict.history.status as Record<string, string>)[payment.status] ?? payment.status;
                return (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{itemLabel}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{fmtDate(payment.paid_at || payment.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-serif text-lg text-brand">{formatPriceCents(payment.amount_cents, locale)}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${statusStyles[payment.status] ?? "bg-gray-100 text-gray-500"}`}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-4">{dict.history.receiptNote}</p>
          </>
        )}
      </section>

      {/* 03. EQUIPA DO EVENTO */}
      <section id="account-team" className={sectionClass}>
        {header(3, <Users size={24} />, dict.collaborators.title, dict.collaborators.subtitle)}

        <div className="bg-cream p-5 rounded-3xl border border-gold-soft/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-500 shrink-0"><ShieldCheck size={18} /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{dict.ownership.ownerLabel}</p>
              <p className="text-sm font-bold text-ink truncate">{ownerEmail}</p>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{dict.ownership.ownerBadge}</span>
        </div>

        {canManageTeam ? (
          <form onSubmit={handleAddCollaborator} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-grow">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input type="email" required placeholder={dict.collaborators.emailPlaceholder} className={inputClass + " pl-12"} value={collaboratorEmail} onChange={(e) => setCollaboratorEmail(e.target.value)} />
            </div>
            <select className="bg-cream border border-gray-200 rounded-2xl px-4 py-4 sm:py-0 text-[11px] font-bold text-gray-600 uppercase tracking-wider outline-none focus:border-brand font-montserrat h-[54px]" value={collaboratorRole} onChange={(e) => setCollaboratorRole(e.target.value)}>
              <option value="editor">{dict.collaborators.roleEditor}</option>
              <option value="viewer">{dict.collaborators.roleViewer}</option>
            </select>
            <button type="submit" disabled={adding} className="bg-brand text-gold-soft h-[54px] px-8 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} {dict.collaborators.inviteBtn}
            </button>
          </form>
        ) : (
          <p className="text-[11px] text-gray-400 mb-6">{dict.collaborators.readOnlyNote}</p>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-200" /></div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400"><p className="text-xs">{dict.collaborators.emptyState}</p></div>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-brand/20 transition-colors shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0"><Mail size={14} /></div>
                  <span className="text-sm font-medium text-gray-700 truncate">{collab.user_email}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${collab.role === 'viewer' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                    {collab.role === 'viewer' ? dict.collaborators.badgeViewer : dict.collaborators.badgeEditor}
                  </span>
                  {canManageTeam && (
                    <button onClick={() => removeCollaborator(collab.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2" aria-label={dict.collaborators.alertRemoveConfirm}><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 04. OS VOSSOS DADOS */}
      <section id="account-profile" className={sectionClass}>
        {header(4, <User size={24} />, dict.profile.title, dict.profile.subtitle,
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-500 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <LogOut size={14} /> {dict.profile.logoutBtn}
          </button>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>{dict.profile.emailLabel}</label>
            <input type="text" disabled className={inputClass + " opacity-60 cursor-not-allowed"} value={currentEmail} />
          </div>
          <form onSubmit={handleUpdatePassword} className="relative">
            <label className={labelClass}>{dict.profile.passwordLabel}</label>
            <div className="flex gap-2">
              <input type="password" placeholder={dict.profile.passwordPlaceholder} className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="submit" disabled={savingPass || newPassword.length < 6} aria-label={dict.profile.passwordLabel} className="bg-ink text-white px-5 rounded-2xl hover:bg-black disabled:opacity-30 transition-all">
                {savingPass ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
