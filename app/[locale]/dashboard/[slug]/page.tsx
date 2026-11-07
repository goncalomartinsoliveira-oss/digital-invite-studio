"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  UserCircle,
  PenTool,
  FileText,
  Users,
  Grid,
  Camera,
  LayoutGrid,
  Mail,
  ChevronRight,
  ArrowLeft,
  CalendarHeart,
  AlertTriangle,
  Lock,
  MessageSquareHeart,
  HelpCircle,
  LifeBuoy,
  Wallet,
  ListChecks,
  Clock,
  ClipboardList,
  Share2,
  Images,
  Link2,
  Send, Loader2
} from "lucide-react";

import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";
import ContentModule from "@/components/dashboard/ContentModule";
import SeatingModule from "@/components/dashboard/SeatingModule";
import AccountModule from "@/components/dashboard/AccountModule";
import PhotoSharingModule from "@/components/dashboard/PhotoSharingModule";
import GuestbookModule from "@/components/dashboard/GuestbookModule";
import SaveTheDateModule from "@/components/dashboard/SaveTheDateModule";
import BudgetModule from "@/components/dashboard/BudgetModule";
import TasksModule from "@/components/dashboard/TasksModule";
import TimelineModule from "@/components/dashboard/TimelineModule";
import SharingModule from "@/components/dashboard/SharingModule";
import LinksHub from "@/components/dashboard/LinksHub";
import GuestLinksPanel from "@/components/dashboard/GuestLinksPanel";
import InviteAccessCard from "@/components/dashboard/InviteAccessCard";
import SetupChecklist, { type ChecklistItem } from "@/components/dashboard/SetupChecklist";
import HelpDrawer from "@/components/help/HelpDrawer";
import { TAB_HELP, CHECKLIST_HELP } from "@/lib/help";
import MoodboardModule from "@/components/dashboard/MoodboardModule";
import LockedModuleNotice from "@/components/dashboard/LockedModuleNotice";
import BundleOffers from "@/components/dashboard/BundleOffers";
import PublishPayerModal from "@/components/dashboard/PublishPayerModal";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import { useBrand, EventBrandProvider } from "@/components/site/BrandProvider";
import { resolveBrandById, type WorkingBrand } from "@/lib/brands";
import { TAB_MODULE, isModuleUnlocked } from "@/lib/modules";
import { fetchPlannerPlan, type PlannerPlan } from "@/lib/planner";
import { FULL_PLAN_ID } from "@/lib/pricing";
import { startBundleCheckout, formatPriceCents, fetchPlanQuote, type ClientPlanQuote } from "@/lib/checkout";
import { isArchivedEvent } from "@/lib/eventArchive";

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis para trás)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

type DashboardTab = 'design' | 'content' | 'savethedate' | 'guests' | 'seating' | 'photosharing' | 'guestbook' | 'budget' | 'tasks' | 'timeline' | 'sharing' | 'moodboard' | 'links' | 'account';
// Áreas do hub: uma por módulo vendável (mesmos ids de lib/modules.ts), para
// que o hub mostre claramente o que está desbloqueado/bloqueado por módulo.
// "management" é a exceção: não é um módulo à venda ao casal, é a área de
// gestão das contas de wedding planner (ver lib/planner.ts).
type EventGroup = 'save_the_date' | 'invite' | 'guests_seating' | 'photo_sharing' | 'guestbook' | 'links' | 'management' | 'account' | null;

const GROUP_TABS: Record<Exclude<EventGroup, null>, DashboardTab[]> = {
  save_the_date: ['savethedate'],
  invite: ['design', 'content'],
  guests_seating: ['guests', 'seating'],
  photo_sharing: ['photosharing'],
  guestbook: ['guestbook'],
  links: ['links'],
  management: ['budget', 'tasks', 'timeline', 'sharing', 'moodboard'],
  account: [],
};

// Quem gere o evento não deve ter de pôr o código do convite (opcional) para ver a
// pré-visualização ou abrir o convite: o servidor reconhece a sessão e dá-lhe o
// cookie de acesso. Devolve true se o evento tem código ligado e o cookie foi dado.
async function grantPreviewAccess(invitationId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const res = await fetch("/api/invite-access/preview", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ invitationId }),
    });
    if (!res.ok) return false;
    return !!(await res.json()).gated;
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('design');
  // null → mostra o hub com as áreas; caso contrário mostra o editor filtrado.
  const [group, setGroup] = useState<EventGroup>(null);
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showTour, setShowTour] = useState(false);
  // Estado da lista "O que falta fazer" (guardado no browser, como o tour).
  const [linkShared, setLinkShared] = useState(false);
  const [checklistHidden, setChecklistHidden] = useState(false);
  // Ajuda contextual: slug do artigo aberto na gaveta (null = fechada).
  const [helpSlug, setHelpSlug] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // true quando quem está a ver é staff do próprio parceiro (brand_members
  // da marca do evento) — ao contrário do casal, este vê preços e compra
  // normalmente, à sua tabela de preços (ver "Preços" na gestão de marcas).
  const [isAgencyStaff, setIsAgencyStaff] = useState(false);
  // Plano de wedding planner da marca deste evento (null = não é conta de
  // agência). É isto que faz aparecer a área de Gestão.
  const [plannerPlan, setPlannerPlan] = useState<PlannerPlan | null>(null);
  // Secção da Inspiração a destacar quando se lá chega a partir do Orçamento.
  const [moodboardFocus, setMoodboardFocus] = useState<string | null>(null);
  const [buyingModule, setBuyingModule] = useState<string | null>(null);
  const brand = useBrand();
  const [eventBrand, setEventBrand] = useState<WorkingBrand | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  // Preço do Plano Completo para este evento, calculado no servidor
  // (api/checkout/quote): preço normal, de parceiro ou de volume.
  const [planQuote, setPlanQuote] = useState<ClientPlanQuote | null>(null);
  const [savingPayer, setSavingPayer] = useState(false);
  // "Publicar convite" num evento de parceiro, para a equipa do parceiro: escolher quem paga primeiro.
  const [payerAsk, setPayerAsk] = useState<null | "choose" | "couple-done">(null);
  useEffect(() => {
    if (!formData?.id) return;
    fetchPlanQuote(formData.id).then(setPlanQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.id, formData?.paid_by, (formData?.unlocked_modules || []).join(",")]);

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.Dashboard || dictionaries.pt.Dashboard;

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      
      const email = session.user.email;
      setSessionEmail(email || "");
      // brand_members/super_admins/invitation_collaborators guardam o email
      // normalizado (trim+minúsculas); invitations.user_email não — por isso
      // há duas variantes, cada uma só contra a tabela com a mesma convenção.
      const normEmail = (email || "").trim().toLowerCase();

      const { data: invite } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (!invite) { router.push(`/${params.locale}/dashboard`); return; }

      const isOwner = invite.user_email === email;
      const { data: collab } = await supabase
        .from("invitation_collaborators")
        .select("id, role")
        .eq("invitation_id", invite.id)
        .eq("user_email", normEmail)
        .maybeSingle();

      // Super-admin → acesso total a qualquer evento.
      const { data: sa } = await supabase
        .from("super_admins")
        .select("user_email")
        .eq("user_email", normEmail)
        .maybeSingle();
      const isSuper = !!sa;
      setIsSuperAdmin(isSuper);

      // Acesso de agência: um membro da marca do evento pode geri-lo — testado
      // sempre, mesmo que também seja o "dono" da conta (ex.: o próprio
      // parceiro que criou o evento em nome do casal fica como user_email,
      // mas continua a ser staff da marca para efeitos de preços/checkout).
      let agencyRole: "owner" | "editor" | null = null;
      if (!isSuper && invite.brand_id) {
        const { data: member } = await supabase
          .from("brand_members")
          .select("role")
          .eq("brand_id", invite.brand_id)
          .eq("user_email", normEmail)
          .maybeSingle();
        if (member) agencyRole = member.role === "admin" ? "owner" : "editor";
      }
      setIsAgencyStaff(!!agencyRole);

      if (!isOwner && !collab && !agencyRole && !isSuper) {
        console.error("Acesso Negado.");
        router.push(`/${params.locale}/dashboard`);
        return;
      }

      if (isSuper || isOwner) {
        setUserRole("owner");
      } else if (collab) {
        setUserRole(collab.role as "editor" | "viewer");
      } else if (agencyRole) {
        setUserRole(agencyRole);
      }

      setFormData({
        ...invite,
        user_email: invite.user_email || email
      });

      // Código de acesso ligado → dar ao administrador o cookie e recarregar a pré-visualização.
      // Recomendação de parceiro (link /r/CODIGO, cookie): o dono do evento liga-a
      // ao evento, se ainda não tiver uma (api/referral/attach, lib/referrals.ts).
      if (isOwner && !invite.referred_by_brand_id) {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) return;
          fetch("/api/referral/attach", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ invitationId: invite.id }),
          }).catch(() => {});
        });
      }

      // Código de acesso ligado, ou convite ainda por publicar → quem gere o
      // evento recebe o cookie de pré-visualização e o iframe recarrega.
      if (invite.access_code_enabled || !(invite.unlocked_modules || []).includes('invite')) {
        grantPreviewAccess(invite.id).then(gated => { if (gated) setIframeKey(k => k + 1); });
      }

      // Marca do próprio evento → logo do parceiro no editor.
      setEventBrand(await resolveBrandById(supabase, invite.brand_id));
      // Preços diferenciados por parceiro (lib/pricing.ts) — sem override
      // para este brand_id, os ecrãs de compra usam sempre o preço global.
      // Conta de wedding planner? Desbloqueia a área de Gestão (orçamento e
      // tarefas) — ver lib/planner.ts.
      setPlannerPlan(await fetchPlannerPlan(supabase, invite.brand_id));

      const { data: gs } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
      setGuests(gs || []);
      setLoading(false);

      // Tour de boas-vindas: mostra-se sozinho uma vez por evento, na
      // primeira vez que o hub é aberto (guardado no browser, não na BD).
      const tourKey = `dis_tour_seen_${params.slug}`;
      if (typeof window !== "undefined" && !localStorage.getItem(tourKey)) {
        setShowTour(true);
      }
      if (typeof window !== "undefined") {
        setLinkShared(!!localStorage.getItem(`dis_link_shared_${params.slug}`));
        setChecklistHidden(!!localStorage.getItem(`dis_checklist_hidden_${params.slug}`));
      }
    }
    loadData();
  }, [params.slug, params.locale, router]);

  // Ligação direta a um separador (ex.: "Esta semana" abre `?tab=tasks`): depois
  // de carregar, entra na área certa em vez do hub. Só uma vez, e limpa o
  // parâmetro do URL para não "prender" o separador ao recarregar.
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  useEffect(() => {
    if (loading || deepLinkDone || typeof window === "undefined") return;
    setDeepLinkDone(true);
    const tab = new URLSearchParams(window.location.search).get("tab") as DashboardTab | null;
    if (!tab) return;
    const g = (Object.keys(GROUP_TABS) as Exclude<EventGroup, null>[]).find(k => GROUP_TABS[k].includes(tab));
    if (!g || (g === "management" && !(plannerPlan || isSuperAdmin))) return;
    setGroup(g);
    setActiveTab(tab);
    window.history.replaceState(null, "", window.location.pathname);
  }, [loading, deepLinkDone, plannerPlan, isSuperAdmin]);

  const dismissTour = () => {
    setShowTour(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`dis_tour_seen_${params.slug}`, "1");
    }
  };

  const markLinkShared = () => {
    setLinkShared(true);
    if (typeof window !== "undefined") localStorage.setItem(`dis_link_shared_${params.slug}`, "1");
  };

  const hideChecklist = () => {
    setChecklistHidden(true);
    if (typeof window !== "undefined") localStorage.setItem(`dis_checklist_hidden_${params.slug}`, "1");
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    // unlocked_modules e date_locked_at são geridos fora dos editores (Conta ›
    // Módulos do Evento e webhook do Stripe). Não os regravar a partir da cópia
    // local, que pode estar desatualizada e desfazia ativações.
    const { user_email, unlocked_modules, date_locked_at, paid_by, referred_by_brand_id, referred_at, content_purged_at, expiry_notice_sent_at, ...dataToSave } = formData;
    await supabase.from("invitations").update(dataToSave).eq("id", formData.id);
    setSaving(false);
    // Atualização "suave": o convite refaz só os dados (ver PreviewBridge) e mantém
    // o estado — envelope aberto, scroll. Sem iframe pronto, recarrega por completo.
    const target = previewRef.current?.contentWindow;
    if (target) target.postMessage("dis-preview-refresh", window.location.origin);
    else setIframeKey(prev => prev + 1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const fileName = `${params.slug}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('invites').upload(fileName, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('invites').getPublicUrl(fileName);
      setFormData({ ...formData, main_image_url: publicUrl });
    }
    setSaving(false);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/${params.locale}/invite/${formData.slug}`;
    navigator.clipboard.writeText(url);
    markLinkShared();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !formData) return (
    <div className="h-screen flex items-center justify-center bg-cream">
      <div className="w-10 h-10 border-4 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  const tabsConfig = [
    { id: 'design', label: dict.tabs.design, icon: <PenTool size={20} /> },
    { id: 'content', label: dict.tabs.content, icon: <FileText size={20} /> },
    { id: 'savethedate', label: dict.tabs.savethedate, icon: <CalendarHeart size={20} /> },
    { id: 'guests', label: dict.tabs.guests, icon: <Users size={20} /> },
    { id: 'seating', label: dict.tabs.seating, icon: <Grid size={20} /> },
    { id: 'photosharing', label: dict.tabs.photosharing, icon: <Camera size={20} /> },
    { id: 'guestbook', label: dict.tabs.guestbook, icon: <MessageSquareHeart size={20} /> },
    { id: 'links', label: dict.tabs.links, icon: <Link2 size={20} /> },
    { id: 'budget', label: 'Orçamento', icon: <Wallet size={20} /> },
    { id: 'tasks', label: 'Tarefas', icon: <ListChecks size={20} /> },
    { id: 'timeline', label: 'Cronograma', icon: <Clock size={20} /> },
    { id: 'sharing', label: 'Partilha', icon: <Share2 size={20} /> },
    { id: 'moodboard', label: 'Inspiração', icon: <Images size={20} /> }
  ] as { id: DashboardTab, label: string, icon: React.ReactNode }[];

  const isFullScreenTab = activeTab === 'guests' || activeTab === 'seating' || activeTab === 'photosharing' || activeTab === 'guestbook' || activeTab === 'account' || activeTab === 'savethedate' || activeTab === 'budget' || activeTab === 'tasks' || activeTab === 'timeline' || activeTab === 'sharing' || activeTab === 'moodboard' || activeTab === 'links';

  // "Copiar Link" / "Abrir Convite" apontam para o site do casal
  // (/invite/[slug]) — só fazem sentido nas áreas do próprio convite, não em
  // Planeamento (Orçamento, Tarefas, ...) nem em Minha Conta, que não têm
  // nada a ver com esse site.
  const showInviteActions = group !== 'management' && activeTab !== 'account' && activeTab !== 'links';

  // Área de Gestão: existe apenas em eventos de contas de wedding planner.
  // A equipa da agência vê tudo; o casal vê só o que estiver marcado como
  // partilhado (imposto pelo Supabase, não aqui).
  // O super-admin vê sempre a área de Planeamento, em qualquer evento — o plano
  // de wedding planner é da marca (ver lib/planner.ts) e a marca DIS nunca o tem.
  // A base de dados já lhe dá acesso (dis_is_super_admin) e os módulos tratam-no
  // como equipa (isAgency).
  const showManagement = !!plannerPlan || isSuperAdmin;
  const confirmedGuestsList = guests.filter((g: any) => g.status === 'confirmed');
  const confirmedGuests = confirmedGuestsList.length;
  // Por escalão etário — alimenta o Orçamento (preço por adulto/criança/bebé,
  // ver lib/planner.ts). A categoria já vem do RSVP, nada de novo a pedir ao casal.
  const confirmedGuestCounts = {
    adult: confirmedGuestsList.filter((g: any) => g.category === 'adult').length,
    child: confirmedGuestsList.filter((g: any) => g.category === 'child').length,
    baby: confirmedGuestsList.filter((g: any) => g.category === 'baby').length,
  };

  // O bloqueio real (contra escrita) já é imposto pelo Supabase (RLS); isto só
  // reflete esse estado na interface para os noivos perceberem porque ficou só-leitura.
  const isExpired = formData.expires_at ? new Date(formData.expires_at) < new Date() : false;
  const canEdit = (userRole === "owner" || userRole === "editor") && !isExpired;
  const expiredDateLabel = isExpired
    ? new Date(formData.expires_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : "";
  // Depois do casamento: aviso até quando o conteúdo fica disponível (expires_at,
  // 60 dias depois) e, se o super admin já o apagou, quando (migração 0014).
  const longDate = (d: string) => new Date(d).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  const statusBanner = (margin: string) => {
    if (formData.content_purged_at) {
      return (
        <div className={`${margin} bg-gray-100 border border-gray-200 text-gray-600 text-xs rounded-2xl px-5 py-3.5 flex items-center gap-2.5`}>
          <AlertTriangle size={16} className="shrink-0" />
          <span>{dict.purgedBanner.replace("{date}", longDate(formData.content_purged_at))}</span>
        </div>
      );
    }
    if (isExpired) {
      return (
        <div className={`${margin} bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-2xl px-5 py-3.5 flex items-center gap-2.5`}>
          <AlertTriangle size={16} className="shrink-0" />
          <span>{dict.expiredBanner.replace("{date}", expiredDateLabel)}</span>
        </div>
      );
    }
    if (formData.expires_at && isArchivedEvent(formData)) {
      return (
        <div className={`${margin} bg-gold-soft/30 border border-gold-soft text-ink text-xs rounded-2xl px-5 py-3.5 flex items-center gap-2.5`}>
          <AlertTriangle size={16} className="shrink-0 text-gold" />
          <span>{dict.availableUntilBanner.replace("{date}", longDate(formData.expires_at))}</span>
        </div>
      );
    }
    return null;
  };

  // Módulos: super-admin vê e edita sempre tudo. Contas de wedding planner
  // também — é a "inclusão total" do módulo (ver documento de estratégia):
  // as licenças completas do casal vêm de fábrica com o plano da agência,
  // não se vendem à parte. Para todos os outros, um separador cujo módulo
  // não esteja em unlocked_modules aparece bloqueado.
  const unlockedModules: string[] = formData.unlocked_modules || [];
  // "Grátis para preparar, paga-se para publicar" (nov. 2026): nada no painel
  // fica bloqueado antes do pagamento. O que o Plano Completo desbloqueia é o
  // lado dos convidados (convite publicado, RSVP), o Save the Date sem marca
  // d'água e as fotos / livro de visitas sem o limite de experiência.
  const isTabLocked = (_tabId: DashboardTab) => false;
  const invitePublished = isModuleUnlocked(unlockedModules, 'invite');
  const moduleNamesDict = dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames;
  const bundleOffersDict = dictionaries[locale]?.BundleOffers || dictionaries.pt.BundleOffers;
  const bundleNamesDict = Object.fromEntries(
    Object.entries(bundleOffersDict.bundles as Record<string, { name: string; desc: string }>).map(([id, b]) => [id, b.name])
  );

  // O casal nunca vê preços nem compra em eventos de parceiros — só um
  // contacto (o do próprio parceiro, nunca o da DIS). O staff do parceiro
  // (agência) é diferente: esse continua a comprar normalmente, à tabela de
  // preços própria desse parceiro (ver "Preços" na gestão de marcas).
  // Eventos de parceiros: por omissão é o parceiro que paga (paid_by vazio ou
  // 'partner'); se a agência escolher "pagam os noivos", o casal compra ao
  // preço normal como num evento DIS.
  const isPartnerEvent = !!formData.brand_id && formData.brand_id !== "dis";
  const isPartnerBrand = isPartnerEvent && !isAgencyStaff && formData.paid_by !== 'couple';
  const changePayer = async (payer: 'partner' | 'couple') => {
    setSavingPayer(true);
    const { error } = await supabase.from("invitations").update({ paid_by: payer }).eq("id", formData.id);
    if (error) alert(error.message);
    else setFormData((f: any) => ({ ...f, paid_by: payer }));
    setSavingPayer(false);
    return !error;
  };
  const partnerContactUrl = eventBrand?.contactUrl ?? brand.contactUrl ?? `/${locale}/contact`;
  const handleBuyModule = async (moduleId: string, couponCode?: string) => {
    setBuyingModule(moduleId);
    try {
      // Só se vende o Plano Completo (lib/pricing.ts): qualquer separador
      // bloqueado desbloqueia tudo de uma vez.
      await startBundleCheckout({ invitationId: formData.id, slug: formData.slug, locale, bundleId: FULL_PLAN_ID, couponCode });
    } catch (err: any) {
      alert(err.message || dict.moduleLockedMessage);
      setBuyingModule(null);
    }
  };
  // Publicar = ativar o Plano Completo. Eventos de parceiros publicam pelo
  // parceiro; o super admin ativa em Conta › Módulos do Evento.
  const handlePublish = () => {
    if (isSuperAdmin) { setGroup('account'); setActiveTab('account'); return; }
    if (isPartnerBrand) { window.open(partnerContactUrl, '_blank'); return; }
    if (isPartnerEvent && isAgencyStaff) { setPayerAsk('choose'); return; }
    handleBuyModule('invite');
  };
  const choosePayer = async (payer: 'partner' | 'couple') => {
    const current = formData.paid_by === 'couple' ? 'couple' : 'partner';
    if (payer !== current && !(await changePayer(payer))) return;
    if (payer === 'partner') { setPayerAsk(null); handleBuyModule('invite'); }
    else setPayerAsk('couple-done');
  };
  const payerModal = payerAsk && (
    <PublishPayerModal
      step={payerAsk}
      current={formData.paid_by === 'couple' ? 'couple' : 'partner'}
      partnerPrice={planQuote?.payer === 'partner' && planQuote.cents != null ? formatPriceCents(planQuote.cents, locale) : undefined}
      busy={savingPayer || buyingModule !== null}
      dict={dict.payer}
      onChoose={choosePayer}
      onClose={() => setPayerAsk(null)}
      onInviteCouple={() => {
        setPayerAsk(null);
        openGroup('account');
        setTimeout(() => document.getElementById('account-team')?.scrollIntoView({ behavior: 'smooth' }), 400);
      }}
    />
  );
  const publishButton = (compact: boolean) => (
    <button
      onClick={handlePublish}
      disabled={buyingModule !== null}
      className={`flex items-center gap-2 bg-brand text-gold-soft ${compact ? 'px-4 sm:px-5' : 'px-5'} py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-60`}
    >
      {buyingModule ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      <span className="hidden sm:inline">{dict.publishBtn}</span>
    </button>
  );
  const lockedNotice = (tabId: DashboardTab) => {
    const moduleId = TAB_MODULE[tabId];
    const moduleName = moduleId ? moduleNamesDict[moduleId] : "";
    // O RSVP do convite não funciona sem lista de convidados — por isso
    // comprar "invite" desbloqueia sempre "guests_seating" também (ver
    // lib/modules.ts). Deixar isso claro no ecrã de compra.
    const baseMessage = isPartnerBrand ? dict.moduleLockedMessagePartner : dict.moduleLockedMessage;
    const message = baseMessage;
    return (
      <LockedModuleNotice
        title={dict.moduleLockedTitle.replace("{module}", moduleName)}
        message={message}
        contactUrl={isPartnerBrand ? partnerContactUrl : (brand.contactUrl ?? `/${locale}/contact`)}
        contactLabel={dict.moduleLockedContactBtn}
        buyLabel={isPartnerBrand ? undefined : dict.moduleBuyBtn}
        priceLabel={!isPartnerBrand && moduleId && planQuote?.cents != null ? formatPriceCents(planQuote.cents, locale) : undefined}
        onBuy={!isPartnerBrand && moduleId ? (couponCode) => handleBuyModule(moduleId, couponCode) : undefined}
        buying={buyingModule === moduleId}
        couponToggleLabel={isPartnerBrand ? undefined : dict.couponToggleLabel}
        couponPlaceholder={isPartnerBrand ? undefined : dict.couponPlaceholder}
      />
    );
  };

  // Separadores visíveis consoante a área selecionada no hub.
  const visibleTabs = (group ? tabsConfig.filter(t => GROUP_TABS[group].includes(t.id)) : tabsConfig)
    // Orçamento, Tarefas, Cronograma e Partilha só existem em contas de wedding planner.
    .filter(t => showManagement || (t.id !== 'budget' && t.id !== 'tasks' && t.id !== 'timeline' && t.id !== 'sharing' && t.id !== 'moodboard'));

  // "Design" e "Conteúdo" são duas vistas do mesmo módulo (Convite): na navegação
  // aparecem como uma só entrada; a escolha entre as duas fica num seletor por
  // cima do editor (ver `inviteSections`). Os ids dos separadores não mudam.
  const navTabs = visibleTabs
    .filter(t => t.id !== 'content')
    .map(t => t.id === 'design' ? { ...t, label: dict.tabs.invite, icon: <Mail size={20} /> } : t);
  const isNavActive = (id: string) => id === 'design' ? (activeTab === 'design' || activeTab === 'content') : activeTab === id;
  const inviteSections: { id: 'design' | 'content'; label: string; icon: React.ReactNode }[] = [
    { id: 'design', label: dict.tabs.design, icon: <PenTool size={14} /> },
    { id: 'content', label: dict.tabs.content, icon: <FileText size={14} /> },
  ];

  // Abrir uma área a partir do hub → entra no editor no primeiro separador dessa área.
  const openGroup = (g: Exclude<EventGroup, null>) => {
    setGroup(g);
    if (g === 'account') {
      setActiveTab('account');
    } else {
      setActiveTab(GROUP_TABS[g][0]);
    }
  };

  // "O que falta fazer": só passos de módulos que o casal tem ativos, e só
  // para quem pode editar. Tudo é derivado dos dados do evento.
  const dbContent = formData.content?.content || {};
  const goTab = (g: Exclude<EventGroup, null>, tab: DashboardTab) => { setGroup(g); setActiveTab(tab); };
  const checklistDict = dictionaries[locale]?.SetupChecklist || dictionaries.pt.SetupChecklist;
  const checklistItems: ChecklistItem[] = canEdit ? [
    ...(!isTabLocked('design') ? [
      { id: 'basics', done: !!(formData.groom_name && formData.bride_name && formData.event_date), onGo: () => goTab('invite', 'design') },
      { id: 'photo', done: !!dbContent.hero?.main_image_url, onGo: () => goTab('invite', 'content') },
      { id: 'texts', done: !!dbContent.story?.paragraphs?.some((p: string) => p?.trim()), onGo: () => goTab('invite', 'content') },
    ] : []),
    ...(!isTabLocked('guests') ? [{ id: 'guests', done: guests.length > 0, onGo: () => goTab('guests_seating', 'guests') }] : []),
    { id: 'publish', done: invitePublished, onGo: handlePublish },
    ...(invitePublished ? [{ id: 'share', done: linkShared, onGo: () => goTab('links', 'links') }] : []),
  ].map(i => ({ ...i, helpSlug: CHECKLIST_HELP[i.id], label: checklistDict.items[i.id as keyof typeof checklistDict.items].label, hint: checklistDict.items[i.id as keyof typeof checklistDict.items].hint })) : [];

  const projectName = formData.groom_name && formData.bride_name
    ? `${formData.groom_name} & ${formData.bride_name}`
    : formData.slug;

  const groupCards = [
    { id: 'save_the_date' as const, icon: <CalendarHeart size={26} />, title: dict.groups.save_the_date.title, desc: dict.groups.save_the_date.desc },
    { id: 'invite' as const, icon: <Mail size={26} />, title: dict.groups.invite.title, desc: dict.groups.invite.desc },
    { id: 'guests_seating' as const, icon: <Users size={26} />, title: dict.groups.guests_seating.title, desc: dict.groups.guests_seating.desc },
    { id: 'photo_sharing' as const, icon: <Camera size={26} />, title: dict.groups.photo_sharing.title, desc: dict.groups.photo_sharing.desc },
    { id: 'guestbook' as const, icon: <MessageSquareHeart size={26} />, title: dict.groups.guestbook.title, desc: dict.groups.guestbook.desc },
    { id: 'links' as const, icon: <Link2 size={26} />, title: dict.groups.links.title, desc: dict.groups.links.desc },
    ...(showManagement ? [{
      id: 'management' as const,
      icon: <ClipboardList size={26} />,
      title: 'Planeamento',
      desc: 'Orçamento, custos por fornecedor e checklist do evento.',
    }] : []),
  ];

  // Cada grupo do hub mapeia para um único módulo (mesmo quando agrupa mais
  // do que um separador, como "invite" = design+content), por isso basta
  // verificar o bloqueio do seu primeiro separador.
  const isGroupLocked = (groupId: Exclude<EventGroup, null | 'account'>) => isTabLocked(GROUP_TABS[groupId][0]); // 'links' não tem módulo → nunca bloqueado

  // Gaveta de ajuda (partilhada pelo hub e pelo editor).
  const helpDrawer = (
    <HelpDrawer
      slug={helpSlug}
      locale={locale}
      brandId={isPartnerBrand ? "partner" : "dis"}
      onClose={() => setHelpSlug(null)}
      onNavigate={setHelpSlug}
    />
  );

  // ── HUB: página-base com as áreas do evento ──────────────────────────
  if (!group) {
    return (
      <div className="min-h-screen bg-cream text-[#2D3748] font-sans flex flex-col">
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand hover:text-white transition-all shrink-0"
              aria-label={dict.backToEvents}
            >
              <LayoutGrid size={16} />
            </Link>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">{dict.currentProject}</p>
              <h1 className="font-serif text-brand text-lg leading-tight truncate">{projectName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowTour(true)}
              aria-label={dict.tour?.reopenBtn}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-brand transition-all"
            >
              <HelpCircle size={16} />
            </button>
            <Link
              href={`/${locale}/help`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-white text-gray-500 border border-gray-200 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all"
            >
              <LifeBuoy size={14} /> {dict.helpCenter}
            </Link>
            {invitePublished ? (
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 sm:px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? dict.copied : dict.copyLink}</span>
              </button>
            ) : canEdit && publishButton(true)}
            <button
              onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${invitePublished ? 'bg-brand text-white shadow-md hover:bg-brand-dark' : 'bg-white text-gray-600 border border-gray-200 hover:text-brand'}`}
            >
              <span className="hidden sm:inline">{invitePublished ? dict.openInvite : dict.previewInvite}</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {showTour && dict.tour && <WelcomeTour dict={dict.tour} onClose={dismissTour} />}
        {helpDrawer}
        {payerModal}

        <main className="flex-1 px-6 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            {statusBanner("mb-10")}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="font-serif text-3xl sm:text-4xl text-ink">{dict.hubTitle}</h2>
              <p className="text-gray-400 text-sm mt-2">{dict.hubSubtitle}</p>
            </div>

            {!checklistHidden && <SetupChecklist items={checklistItems} dict={checklistDict} onDismiss={hideChecklist} onHelp={setHelpSlug} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => openGroup(card.id)}
                  className="group relative text-left bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-gold-soft hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {isGroupLocked(card.id) && (
                    <span className="absolute top-6 right-6 flex items-center gap-1.5 bg-gray-50 text-gray-400 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                      <Lock size={10} /> {dict.moduleLockedBadge}
                    </span>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-cream border border-gold-soft/70 flex items-center justify-center text-brand mb-6 group-hover:bg-brand group-hover:text-white transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="font-serif text-xl text-ink leading-snug mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1">{card.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand group-hover:gap-3 transition-all">
                    {dict.enterGroup} <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>

            {/* Eventos de parceiros: a equipa do parceiro escolhe quem paga a publicação. */}
            {isPartnerEvent && (isAgencyStaff || isSuperAdmin) && !invitePublished && (
              <div className="mt-14 max-w-xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{dict.payer.title}</p>
                <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label={dict.payer.title}>
                  {(['partner', 'couple'] as const).map(opt => {
                    const on = (formData.paid_by === 'couple' ? 'couple' : 'partner') === opt;
                    return (
                      <button
                        key={opt}
                        role="radio"
                        aria-checked={on}
                        disabled={savingPayer || on}
                        onClick={() => changePayer(opt)}
                        className={`text-left rounded-2xl border px-4 py-3 transition-colors ${on ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand'}`}
                      >
                        <span className={`block text-sm font-semibold ${on ? 'text-brand' : 'text-ink'}`}>{dict.payer[opt].label}</span>
                        <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{dict.payer[opt].desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <BundleOffers
              invitationId={formData.id}
              slug={formData.slug}
              locale={locale}
              unlockedModules={unlockedModules}
              isSuperAdmin={isSuperAdmin}
              isPartnerBrand={isPartnerBrand}
              quote={planQuote}
              moduleNames={moduleNamesDict}
              dict={dictionaries[locale]?.BundleOffers || dictionaries.pt.BundleOffers}
            />

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => openGroup('account')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white text-gray-500 text-[11px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all"
              >
                <UserCircle size={16} /> {dict.accountLabel}
              </button>
              <Link
                href={`/${locale}/help`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white text-gray-500 text-[11px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all"
              >
                <LifeBuoy size={16} /> {dict.helpCenter}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream text-[#2D3748] overflow-hidden font-sans">
      {helpDrawer}
      {payerModal}
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden xl:flex flex-col z-30 shadow-sm shrink-0">
        <div className="pt-10 pb-6 px-6 flex flex-col items-center gap-4 border-b border-gray-50 mb-4">
          <img src={eventBrand?.logo ?? brand.logo} alt={eventBrand?.name ?? brand.logoAlt} className="w-52 h-auto drop-shadow-sm hover:scale-105 transition-transform duration-500" />
          {(brand.poweredBy || !!eventBrand) && (
            <span className="text-[7px] font-semibold uppercase tracking-[0.25em] text-gray-300 mt-1">powered by Digital Invite Studio</span>
          )}
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
          >
            <LayoutGrid size={12} />
            {dict.backToEvents}
          </Link>
        </div>
        
        {/* CARTÃO DO PROJETO ATUAL */}
        <div className="px-4 mb-4">
          <div className="bg-cream border border-gold-soft/70 rounded-2xl px-4 py-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-1.5 font-montserrat">
              {dict.currentProject}
            </p>
            <p className="font-serif text-brand text-[15px] leading-snug">
              {formData.groom_name && formData.bride_name
                ? `${formData.groom_name} & ${formData.bride_name}`
                : formData.slug}
            </p>
            {formData.event_date && (
              <p className="text-[9px] text-gray-400 mt-1.5 font-montserrat">
                {new Date(formData.event_date).toLocaleDateString(
                  locale === 'en' ? 'en-US' : 'pt-PT',
                  { day: '2-digit', month: 'long', year: 'numeric' }
                )}
              </p>
            )}
          </div>
        </div>

        {/* Voltar às áreas do hub */}
        <div className="px-4 mb-3">
          <button
            onClick={() => setGroup(null)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={14} /> {dict.backToGroups}
          </button>
        </div>

        <nav className="px-4 space-y-2">
          {navTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${isNavActive(tab.id) ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label} {isTabLocked(tab.id) && <Lock size={11} className="ml-auto shrink-0 opacity-60" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-10 pt-4 border-t border-gray-50 space-y-1">
           <Link
             href={`/${locale}/help`}
             target="_blank"
             rel="noopener noreferrer"
             className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-[12px] text-gray-400 hover:bg-gray-50 hover:text-brand"
           >
              <LifeBuoy size={18} /> {dict.helpCenter}
           </Link>
           <button 
             onClick={() => setActiveTab('account')} 
             className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === 'account' ? 'bg-ink text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
           >
              <UserCircle size={20} /> {dict.accountLabel}
           </button>
        </div>
      </aside>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex flex-col h-screen overflow-hidden border-r border-gray-100 bg-cream">
          
          <header className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-3">
              {/* Botão voltar às áreas — só visível em mobile (xl tem sidebar) */}
              <button
                onClick={() => setGroup(null)}
                className="xl:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand hover:text-white transition-all"
                aria-label={dict.backToGroups}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-col justify-center">
                <h1 className="hidden sm:block text-lg font-bold text-gray-800 font-montserrat leading-tight">
                  {activeTab === 'account' ? dict.accountLabel : (activeTab === 'design' || activeTab === 'content') ? dict.tabs.invite : tabsConfig.find(t => t.id === activeTab)?.label}
                </h1>
                {/* Nome do projeto — visível em xs-lg; escondido em xl onde a sidebar já mostra */}
                <p className="xl:hidden text-[11px] font-serif italic text-brand leading-tight">
                  {formData.groom_name && formData.bride_name
                    ? `${formData.groom_name} & ${formData.bride_name}`
                    : formData.slug}
                </p>
              </div>
              {isExpired ? (
                <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md hidden sm:block">
                  {dict.expiredBadge}
                </span>
              ) : !canEdit && (
                <span className="bg-blue-50 text-blue-500 border border-blue-100 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md hidden sm:block">
                  {dict.readOnly}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
               {TAB_HELP[activeTab] && (
                 <button
                   onClick={() => setHelpSlug(TAB_HELP[activeTab])}
                   data-help-open
                   className="flex items-center gap-2 bg-white text-gray-500 border border-gray-200 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all"
                 >
                    <HelpCircle size={14} /> <span className="hidden sm:inline">{dict.helpHow}</span>
                 </button>
               )}

               <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  {saving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500">{dict.saving}</span>
                      </>
                  ) : (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500">{dict.saved}</span>
                      </>
                  )}
               </div>

               {showInviteActions && (invitePublished ? (
                 <button
                   onClick={copyInviteLink}
                   className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all active:scale-95"
                 >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? dict.copied : dict.copyLink}</span>
                 </button>
               ) : canEdit && publishButton(false))}

               {!isFullScreenTab && (
                 <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="lg:hidden bg-gray-100 text-gray-600 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                   {dict.mobilePreview}
                 </button>
               )}

               {showInviteActions && (
                 <button
                   onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')}
                   className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${invitePublished ? 'bg-brand text-white shadow-md hover:bg-brand-dark' : 'bg-white text-gray-600 border border-gray-200 hover:text-brand'}`}
                 >
                    <span className="hidden sm:inline">{invitePublished ? dict.openInvite : dict.previewInvite}</span>
                    <ExternalLink size={14} />
                 </button>
               )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scroll-smooth relative">
            <EventBrandProvider brandId={formData.brand_id}>
            <div className="max-w-5xl mx-auto">
              {statusBanner("mb-6")}
              {(activeTab === 'design' || activeTab === 'content') && !isTabLocked('design') && (
                <div role="tablist" className="mb-6 inline-flex items-center gap-1 bg-white border border-gray-100 rounded-full p-1 shadow-sm">
                  {inviteSections.map(sec => (
                    <button
                      key={sec.id}
                      role="tab"
                      aria-selected={activeTab === sec.id}
                      onClick={() => setActiveTab(sec.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === sec.id ? 'bg-brand text-white shadow' : 'text-gray-400 hover:text-brand'}`}
                    >
                      {sec.icon} {sec.label}
                    </button>
                  ))}
                </div>
              )}
              {activeTab === 'design' && (isTabLocked('design') ? lockedNotice('design') : <DesignModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} handleImageUpload={handleImageUpload} canEdit={canEdit} dict={dictionaries[locale]?.DesignModule || dictionaries.pt.DesignModule} />)}
              {activeTab === 'content' && (isTabLocked('content') ? lockedNotice('content') : <ContentModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} canEdit={canEdit} dict={dictionaries[locale]?.ContentModule || dictionaries.pt.ContentModule} />)}
              {activeTab === 'savethedate' && (isTabLocked('savethedate') ? lockedNotice('savethedate') : <SaveTheDateModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} canEdit={canEdit} watermark={!(isSuperAdmin || plannerPlan) && !isModuleUnlocked(unlockedModules, 'save_the_date') ? { text: dict.stdWatermark, note: dict.stdWatermarkNote, unlockLabel: isPartnerBrand ? undefined : dict.publishPlanBtn, onUnlock: isPartnerBrand ? undefined : () => handleBuyModule('save_the_date') } : undefined} dict={dictionaries[locale]?.SaveTheDateModule || dictionaries.pt.SaveTheDateModule} />)}
              {activeTab === 'guests' && (isTabLocked('guests') ? lockedNotice('guests') : <>
                {guests.length === 0 && (
                  <div data-guests-empty className="mb-6 bg-white border border-gold-soft/70 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="w-11 h-11 rounded-2xl bg-cream border border-gold-soft/70 flex items-center justify-center text-brand shrink-0"><Users size={18} /></span>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg text-ink">{dict.guestsEmptyTitle}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{dict.guestsEmptyDesc}</p>
                    </div>
                    <button onClick={() => setHelpSlug('add-guests')} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shrink-0">
                      <HelpCircle size={13} /> {dict.guestsEmptyBtn}
                    </button>
                  </div>
                )}
                <GuestLinksPanel
                  invitationId={formData.id}
                  slug={params.slug as string}
                  locale={params.locale as string}
                  guests={guests}
                  canEdit={canEdit}
                  coupleNames={[formData.bride_name, formData.groom_name].filter(Boolean).join(" & ")}
                  rsvpDeadline={(() => {
                    const r = formData.content?.content?.rsvp || {};
                    if (r.deadline_date) return new Date(r.deadline_date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'pt-PT', { day: 'numeric', month: 'long' });
                    return r.text_limit_date_fixed || null;
                  })()}
                  dict={dictionaries[locale]?.GuestLinksPanel || dictionaries.pt.GuestLinksPanel}
                />
                <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} slug={params.slug as string} groomName={formData.groom_name} brideName={formData.bride_name} canEdit={canEdit} dict={dictionaries[locale]?.GuestsModule || dictionaries.pt.GuestsModule} />
              </>)}
              {activeTab === 'seating' && (isTabLocked('seating') ? lockedNotice('seating') : <SeatingModule invitationId={formData.id} canEdit={canEdit} dict={dictionaries[locale]?.SeatingModule || dictionaries.pt.SeatingModule} />)}
              {activeTab === 'photosharing' && (
                <PhotoSharingModule
                  invitationId={formData.id}
                  slug={params.slug as string}
                  canEdit={canEdit}
                  unlockedModules={unlockedModules}
                  isSuperAdmin={isSuperAdmin}
                  isPartnerBrand={isPartnerBrand}
                  isPlannerAccount={!!plannerPlan}
                  dict={dictionaries[locale]?.PhotoSharingModule || dictionaries.pt.PhotoSharingModule}
                />
              )}
              {activeTab === 'budget' && showManagement && (
                <BudgetModule
                  invitationId={formData.id}
                  brandId={formData.brand_id}
                  canEdit={canEdit}
                  isAgency={isAgencyStaff || isSuperAdmin}
                  confirmedGuestCounts={confirmedGuestCounts}
                  locale={locale}
                  onOpenMoodboard={sectionId => { setMoodboardFocus(sectionId); setActiveTab('moodboard'); }}
                />
              )}
              {activeTab === 'tasks' && showManagement && (
                <TasksModule
                  invitationId={formData.id}
                  brandId={formData.brand_id ?? null}
                  eventDate={formData.event_date}
                  canEdit={canEdit}
                  isAgency={isAgencyStaff || isSuperAdmin}
                />
              )}
              {activeTab === 'timeline' && showManagement && (
                <TimelineModule
                  invitationId={formData.id}
                  brandId={formData.brand_id}
                  eventDate={formData.event_date}
                  groomName={formData.groom_name}
                  brideName={formData.bride_name}
                  canEdit={canEdit}
                  isAgency={isAgencyStaff || isSuperAdmin}
                  locale={locale}
                />
              )}
              {activeTab === 'sharing' && showManagement && (
                <SharingModule
                  invitationId={formData.id}
                  eventDate={formData.event_date}
                  groomName={formData.groom_name}
                  brideName={formData.bride_name}
                  canEdit={canEdit}
                  locale={locale}
                />
              )}
              {activeTab === 'moodboard' && showManagement && (
                <MoodboardModule
                  invitationId={formData.id}
                  canEdit={canEdit}
                  locale={locale}
                  onOpenSharing={() => setActiveTab('sharing')}
                  focusSectionId={moodboardFocus}
                />
              )}
              {activeTab === 'links' && canEdit && !isTabLocked('design') && (
                <InviteAccessCard
                  invitationId={formData.id}
                  inviteUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${params.locale}/invite/${formData.slug}`}
                  enabled={!!formData.access_code_enabled}
                  version={formData.access_code_version ?? 1}
                  setFormData={setFormData}
                  onChanged={() => { grantPreviewAccess(formData.id).then(gated => { if (gated) setIframeKey(k => k + 1); }); }}
                  dict={dictionaries[locale]?.InviteAccessCard || dictionaries.pt.InviteAccessCard}
                />
              )}
              {activeTab === 'links' && (
                <LinksHub
                  slug={formData.slug}
                  locale={params.locale as string}
                  // Fotos e livro de visitas funcionam antes de pagar (modo de
                  // experiência, lib/trial.ts); convite, RSVP e mesas só depois de publicar.
                  isLocked={moduleId => !(isSuperAdmin || plannerPlan) && moduleId !== 'photo_sharing' && moduleId !== 'guestbook' && !isModuleUnlocked(unlockedModules, moduleId)}
                  onCopy={key => { if (key === 'invite') markLinkShared(); }}
                  showVendors={showManagement}
                  onOpenVendors={() => { setGroup('management'); setActiveTab('sharing'); }}
                  dict={dictionaries[locale]?.LinksHub || dictionaries.pt.LinksHub}
                />
              )}
              {activeTab === 'guestbook' && (
                <GuestbookModule
                  invitationId={formData.id}
                  slug={params.slug as string}
                  canEdit={canEdit}
                  unlockedModules={unlockedModules}
                  isSuperAdmin={isSuperAdmin}
                  isPartnerBrand={isPartnerBrand}
                  isPlannerAccount={!!plannerPlan}
                  dict={dictionaries[locale]?.GuestbookModule || dictionaries.pt.GuestbookModule}
                />
              )}
              {activeTab === 'account' && (
                <AccountModule
                  invite={formData}
                  currentEmail={sessionEmail}
                  isSuperAdmin={isSuperAdmin}
                  isPartnerBrand={isPartnerBrand}
                  isPartnerStaff={isPartnerEvent && isAgencyStaff}
                  partnerName={isPartnerEvent ? eventBrand?.name : undefined}
                  partnerContactUrl={isPartnerBrand ? partnerContactUrl : undefined}
                  canManageTeam={canEdit}
                  quote={planQuote}
                  publishing={buyingModule !== null}
                  onPublish={handlePublish}
                  moduleNames={moduleNamesDict}
                  bundleNames={bundleNamesDict}
                  onModulesChange={(modules, lockedAt) => setFormData((f: any) => ({ ...f, unlocked_modules: modules, date_locked_at: lockedAt }))}
                  dict={dictionaries[locale]?.AccountModule || dictionaries.pt.AccountModule}
                />
              )}
            </div>
            </EventBrandProvider>
          </main>
        </div>

        {!isFullScreenTab && (
          <div className={`
            ${showMobilePreview ? 'fixed inset-0 z-[200] bg-[#F1F3F5] flex' : 'hidden'} 
            lg:flex lg:relative lg:w-[400px] xl:w-[460px] bg-[#F1F3F5] flex-col items-center justify-start pt-8 border-l border-gray-100 shrink-0 overflow-hidden
          `}>
            <div className="w-full flex items-center justify-center pt-2">
                <div style={{ width: '295px', height: '620px' }} className="relative shrink-0">
                    <div 
                        style={{ width: '410px', height: '860px', transform: 'scale(0.72)' }} 
                        className="absolute top-0 left-0 bg-[#1a1a1a] rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-gray-200 flex flex-col items-center justify-center origin-top-left"
                    >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-[#1a1a1a] rounded-b-3xl z-50 flex justify-center items-start pt-2">
                          <div className="w-12 h-1.5 bg-gray-800 rounded-full"></div>
                       </div>
                       <div style={{ width: '395px', height: '815px' }} className="bg-white rounded-[2.5rem] overflow-hidden relative">
                           <iframe 
                              key={iframeKey}
                              ref={previewRef}
                              src={`/${params.locale}/invite/${formData.slug}`}
                              className="w-full h-full border-none bg-cream"
                              title="Mobile Preview"
                           />
                       </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">{dict.mobilePreviewLabel}</span>
              <span className="text-[9px] text-gray-400 font-montserrat">{dict.mobilePreviewSub}</span>
            </div>
            {showMobilePreview && (
              <button onClick={() => setShowMobilePreview(false)} className="absolute top-8 right-8 bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-[210]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {!showMobilePreview && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 flex justify-around items-center z-[100] px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {[...navTabs, { id: 'account', label: dict.accountLabel, icon: <UserCircle size={20} /> }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DashboardTab)} className={`relative flex flex-col items-center gap-1 transition-all ${isNavActive(tab.id) ? 'text-brand' : 'text-gray-300'}`}>
              {tab.icon}
              {isTabLocked(tab.id as DashboardTab) && <Lock size={9} className="absolute -top-1 -right-1 opacity-70" />}
              <span className="text-[10px] font-bold tracking-tight text-center leading-tight w-20">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}