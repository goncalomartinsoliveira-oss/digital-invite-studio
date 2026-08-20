"use client";
import React, { useEffect, useState } from "react";
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
  Wallet,
  ListChecks,
  Clock,
  ClipboardList,
  Share2
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
import LockedModuleNotice from "@/components/dashboard/LockedModuleNotice";
import BundleOffers from "@/components/dashboard/BundleOffers";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import { useBrand, EventBrandProvider } from "@/components/site/BrandProvider";
import { resolveBrandById, type WorkingBrand } from "@/lib/brands";
import { TAB_MODULE, isModuleUnlocked } from "@/lib/modules";
import { fetchPlannerPlan, type PlannerPlan } from "@/lib/planner";
import { fetchPricingOverrides, effectiveModulePriceCents, EMPTY_PRICING_OVERRIDES, type PricingOverrides } from "@/lib/pricing";
import { startModuleCheckout, formatPriceCents } from "@/lib/checkout";

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis para trás)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

type DashboardTab = 'design' | 'content' | 'savethedate' | 'guests' | 'seating' | 'photosharing' | 'guestbook' | 'budget' | 'tasks' | 'timeline' | 'sharing' | 'account';
// Áreas do hub: uma por módulo vendável (mesmos ids de lib/modules.ts), para
// que o hub mostre claramente o que está desbloqueado/bloqueado por módulo.
// "management" é a exceção: não é um módulo à venda ao casal, é a área de
// gestão das contas de wedding planner (ver lib/planner.ts).
type EventGroup = 'save_the_date' | 'invite' | 'guests_seating' | 'photo_sharing' | 'guestbook' | 'management' | 'account' | null;

const GROUP_TABS: Record<Exclude<EventGroup, null>, DashboardTab[]> = {
  save_the_date: ['savethedate'],
  invite: ['design', 'content'],
  guests_seating: ['guests', 'seating'],
  photo_sharing: ['photosharing'],
  guestbook: ['guestbook'],
  management: ['budget', 'tasks', 'timeline', 'sharing'],
  account: [],
};

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

  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // true quando quem está a ver é staff do próprio parceiro (brand_members
  // da marca do evento) — ao contrário do casal, este vê preços e compra
  // normalmente, à sua tabela de preços (ver "Preços" na gestão de marcas).
  const [isAgencyStaff, setIsAgencyStaff] = useState(false);
  // Plano de wedding planner da marca deste evento (null = não é conta de
  // agência). É isto que faz aparecer a área de Gestão.
  const [plannerPlan, setPlannerPlan] = useState<PlannerPlan | null>(null);
  const [buyingModule, setBuyingModule] = useState<string | null>(null);
  const brand = useBrand();
  const [eventBrand, setEventBrand] = useState<WorkingBrand | null>(null);
  const [pricingOverrides, setPricingOverrides] = useState<PricingOverrides>(EMPTY_PRICING_OVERRIDES);

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.Dashboard || dictionaries.pt.Dashboard;

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      
      const email = session.user.email;
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

      // Marca do próprio evento → logo do parceiro no editor.
      setEventBrand(await resolveBrandById(supabase, invite.brand_id));
      // Preços diferenciados por parceiro (lib/pricing.ts) — sem override
      // para este brand_id, os ecrãs de compra usam sempre o preço global.
      setPricingOverrides(await fetchPricingOverrides(supabase, invite.brand_id));
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
    }
    loadData();
  }, [params.slug, params.locale, router]);

  const dismissTour = () => {
    setShowTour(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`dis_tour_seen_${params.slug}`, "1");
    }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    const { user_email, ...dataToSave } = formData;
    await supabase.from("invitations").update(dataToSave).eq("id", formData.id);
    setSaving(false);
    setIframeKey(prev => prev + 1); 
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
    { id: 'budget', label: 'Orçamento', icon: <Wallet size={20} /> },
    { id: 'tasks', label: 'Tarefas', icon: <ListChecks size={20} /> },
    { id: 'timeline', label: 'Cronograma', icon: <Clock size={20} /> },
    { id: 'sharing', label: 'Partilha', icon: <Share2 size={20} /> }
  ] as { id: DashboardTab, label: string, icon: React.ReactNode }[];

  const isFullScreenTab = activeTab === 'guests' || activeTab === 'seating' || activeTab === 'photosharing' || activeTab === 'guestbook' || activeTab === 'account' || activeTab === 'savethedate' || activeTab === 'budget' || activeTab === 'tasks' || activeTab === 'timeline' || activeTab === 'sharing';

  // Área de Gestão: existe apenas em eventos de contas de wedding planner.
  // A equipa da agência vê tudo; o casal vê só o que estiver marcado como
  // partilhado (imposto pelo Supabase, não aqui).
  const showManagement = !!plannerPlan;
  const confirmedGuests = guests.filter((g: any) => g.status === 'confirmed').length;

  // O bloqueio real (contra escrita) já é imposto pelo Supabase (RLS); isto só
  // reflete esse estado na interface para os noivos perceberem porque ficou só-leitura.
  const isExpired = formData.expires_at ? new Date(formData.expires_at) < new Date() : false;
  const canEdit = (userRole === "owner" || userRole === "editor") && !isExpired;
  const expiredDateLabel = isExpired
    ? new Date(formData.expires_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : "";

  // Módulos: super-admin vê e edita sempre tudo. Contas de wedding planner
  // também — é a "inclusão total" do módulo (ver documento de estratégia):
  // as licenças completas do casal vêm de fábrica com o plano da agência,
  // não se vendem à parte. Para todos os outros, um separador cujo módulo
  // não esteja em unlocked_modules aparece bloqueado.
  const unlockedModules: string[] = formData.unlocked_modules || [];
  const isTabLocked = (tabId: DashboardTab) => {
    const moduleId = TAB_MODULE[tabId];
    if (!moduleId) return false;
    if (isSuperAdmin || plannerPlan) return false;
    return !isModuleUnlocked(unlockedModules, moduleId);
  };
  const moduleNamesDict = dictionaries[locale]?.ModuleNames || dictionaries.pt.ModuleNames;
  const bundleOffersDict = dictionaries[locale]?.BundleOffers || dictionaries.pt.BundleOffers;
  const bundleNamesDict = Object.fromEntries(
    Object.entries(bundleOffersDict.bundles as Record<string, { name: string; desc: string }>).map(([id, b]) => [id, b.name])
  );

  // O casal nunca vê preços nem compra em eventos de parceiros — só um
  // contacto (o do próprio parceiro, nunca o da DIS). O staff do parceiro
  // (agência) é diferente: esse continua a comprar normalmente, à tabela de
  // preços própria desse parceiro (ver "Preços" na gestão de marcas).
  const isPartnerBrand = !!formData.brand_id && formData.brand_id !== "dis" && !isAgencyStaff;
  const partnerContactUrl = eventBrand?.contactUrl ?? brand.contactUrl ?? `/${locale}/contact`;
  const handleBuyModule = async (moduleId: string, couponCode?: string) => {
    setBuyingModule(moduleId);
    try {
      await startModuleCheckout({ invitationId: formData.id, slug: formData.slug, locale, moduleId, couponCode });
    } catch (err: any) {
      alert(err.message || dict.moduleLockedMessage);
      setBuyingModule(null);
    }
  };
  const lockedNotice = (tabId: DashboardTab) => {
    const moduleId = TAB_MODULE[tabId];
    const moduleName = moduleId ? moduleNamesDict[moduleId] : "";
    // O RSVP do convite não funciona sem lista de convidados — por isso
    // comprar "invite" desbloqueia sempre "guests_seating" também (ver
    // lib/modules.ts). Deixar isso claro no ecrã de compra.
    const baseMessage = isPartnerBrand ? dict.moduleLockedMessagePartner : dict.moduleLockedMessage;
    const message = moduleId === 'invite'
      ? `${baseMessage} ${dict.moduleLockedInviteNote}`
      : baseMessage;
    return (
      <LockedModuleNotice
        title={dict.moduleLockedTitle.replace("{module}", moduleName)}
        message={message}
        contactUrl={isPartnerBrand ? partnerContactUrl : (brand.contactUrl ?? `/${locale}/contact`)}
        contactLabel={dict.moduleLockedContactBtn}
        buyLabel={isPartnerBrand ? undefined : dict.moduleBuyBtn}
        priceLabel={!isPartnerBrand && moduleId ? formatPriceCents(effectiveModulePriceCents(moduleId, pricingOverrides), locale) : undefined}
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
    .filter(t => showManagement || (t.id !== 'budget' && t.id !== 'tasks' && t.id !== 'timeline' && t.id !== 'sharing'));

  // Abrir uma área a partir do hub → entra no editor no primeiro separador dessa área.
  const openGroup = (g: Exclude<EventGroup, null>) => {
    setGroup(g);
    if (g === 'account') {
      setActiveTab('account');
    } else {
      setActiveTab(GROUP_TABS[g][0]);
    }
  };

  const projectName = formData.groom_name && formData.bride_name
    ? `${formData.groom_name} & ${formData.bride_name}`
    : formData.slug;

  const groupCards = [
    { id: 'save_the_date' as const, icon: <CalendarHeart size={26} />, title: dict.groups.save_the_date.title, desc: dict.groups.save_the_date.desc },
    { id: 'invite' as const, icon: <Mail size={26} />, title: dict.groups.invite.title, desc: dict.groups.invite.desc },
    { id: 'guests_seating' as const, icon: <Users size={26} />, title: dict.groups.guests_seating.title, desc: dict.groups.guests_seating.desc },
    { id: 'photo_sharing' as const, icon: <Camera size={26} />, title: dict.groups.photo_sharing.title, desc: dict.groups.photo_sharing.desc },
    { id: 'guestbook' as const, icon: <MessageSquareHeart size={26} />, title: dict.groups.guestbook.title, desc: dict.groups.guestbook.desc },
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
  const isGroupLocked = (groupId: Exclude<EventGroup, null | 'account'>) => isTabLocked(GROUP_TABS[groupId][0]);

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
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 sm:px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all active:scale-95"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? dict.copied : dict.copyLink}</span>
            </button>
            <button
              onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')}
              className="flex items-center gap-2 bg-brand text-white px-4 sm:px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95"
            >
              <span className="hidden sm:inline">{dict.openInvite}</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {showTour && dict.tour && <WelcomeTour dict={dict.tour} onClose={dismissTour} />}

        <main className="flex-1 px-6 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            {isExpired && (
              <div className="mb-10 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-2xl px-5 py-3.5 flex items-center gap-2.5">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{dict.expiredBanner.replace("{date}", expiredDateLabel)}</span>
              </div>
            )}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="font-serif text-3xl sm:text-4xl text-ink">{dict.hubTitle}</h2>
              <p className="text-gray-400 text-sm mt-2">{dict.hubSubtitle}</p>
            </div>

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

            {/* Contas de wedding planner já têm as licenças todas incluídas —
                não faz sentido oferecer pacotes para comprar por cima. */}
            {!plannerPlan && (
              <BundleOffers
                invitationId={formData.id}
                slug={formData.slug}
                locale={locale}
                unlockedModules={unlockedModules}
                isSuperAdmin={isSuperAdmin}
                isPartnerBrand={isPartnerBrand}
                overrides={pricingOverrides}
                moduleNames={moduleNamesDict}
                dict={dictionaries[locale]?.BundleOffers || dictionaries.pt.BundleOffers}
              />
            )}

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => openGroup('account')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white text-gray-500 text-[11px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all"
              >
                <UserCircle size={16} /> {dict.accountLabel}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream text-[#2D3748] overflow-hidden font-sans">
      
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
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label} {isTabLocked(tab.id) && <Lock size={11} className="ml-auto shrink-0 opacity-60" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-10 pt-4 border-t border-gray-50">
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
                  {activeTab === 'account' ? dict.accountLabel : tabsConfig.find(t => t.id === activeTab)?.label}
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

               <button 
                 onClick={copyInviteLink} 
                 className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-brand transition-all active:scale-95"
               >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copied ? dict.copied : dict.copyLink}</span>
               </button>

               {!isFullScreenTab && (
                 <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="lg:hidden bg-gray-100 text-gray-600 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                   {dict.mobilePreview}
                 </button>
               )}
               
               <button 
                 onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')} 
                 className="flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all active:scale-95"
               >
                  <span className="hidden sm:inline">{dict.openInvite}</span>
                  <ExternalLink size={14} />
               </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scroll-smooth relative">
            <EventBrandProvider brandId={formData.brand_id}>
            <div className="max-w-5xl mx-auto">
              {isExpired && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-2xl px-5 py-3.5 flex items-center gap-2.5">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{dict.expiredBanner.replace("{date}", expiredDateLabel)}</span>
                </div>
              )}
              {activeTab === 'design' && (isTabLocked('design') ? lockedNotice('design') : <DesignModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} handleImageUpload={handleImageUpload} canEdit={canEdit} dict={dictionaries[locale]?.DesignModule || dictionaries.pt.DesignModule} />)}
              {activeTab === 'content' && (isTabLocked('content') ? lockedNotice('content') : <ContentModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} canEdit={canEdit} dict={dictionaries[locale]?.ContentModule || dictionaries.pt.ContentModule} />)}
              {activeTab === 'savethedate' && (isTabLocked('savethedate') ? lockedNotice('savethedate') : <SaveTheDateModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} canEdit={canEdit} dict={dictionaries[locale]?.SaveTheDateModule || dictionaries.pt.SaveTheDateModule} />)}
              {activeTab === 'guests' && (isTabLocked('guests') ? lockedNotice('guests') : <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} slug={params.slug as string} groomName={formData.groom_name} brideName={formData.bride_name} canEdit={canEdit} dict={dictionaries[locale]?.GuestsModule || dictionaries.pt.GuestsModule} />)}
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
                  overrides={pricingOverrides}
                  dict={dictionaries[locale]?.PhotoSharingModule || dictionaries.pt.PhotoSharingModule}
                />
              )}
              {activeTab === 'budget' && showManagement && (
                <BudgetModule
                  invitationId={formData.id}
                  brandId={formData.brand_id}
                  canEdit={canEdit}
                  isAgency={isAgencyStaff || isSuperAdmin}
                  confirmedGuests={confirmedGuests}
                  locale={locale}
                />
              )}
              {activeTab === 'tasks' && showManagement && (
                <TasksModule
                  invitationId={formData.id}
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
                  canEdit={canEdit}
                  locale={locale}
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
                  overrides={pricingOverrides}
                  dict={dictionaries[locale]?.GuestbookModule || dictionaries.pt.GuestbookModule}
                />
              )}
              {activeTab === 'account' && <AccountModule userEmail={formData.user_email} invitationId={formData.id} isSuperAdmin={isSuperAdmin} moduleNames={moduleNamesDict} bundleNames={bundleNamesDict} dict={dictionaries[locale]?.AccountModule || dictionaries.pt.AccountModule} />}
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
          {[...visibleTabs, { id: 'account', label: dict.accountLabel, icon: <UserCircle size={20} /> }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DashboardTab)} className={`relative flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-brand' : 'text-gray-300'}`}>
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