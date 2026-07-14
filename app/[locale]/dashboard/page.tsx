"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Calendar, LogOut, ArrowRight, Users, Loader2, ArrowLeft, LayoutGrid, Table, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useBrand } from "@/components/site/BrandProvider";
import { BRANDS } from "@/lib/brands";
import AdminManagementView from "@/components/dashboard/AdminManagementView";
import MembersManagementView from "@/components/dashboard/MembersManagementView";
import BrandsManagementView from "@/components/dashboard/BrandsManagementView";

// 1. IMPORTAR OS DICIONÁRIOS (3 níveis para trás a partir de app/[locale]/dashboard/)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function DashboardHub() {
  const router = useRouter();
  const params = useParams();
  
  const [invites, setInvites] = useState<any[]>([]);
  const [sharedInvites, setSharedInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const brand = useBrand();
  const [agencyInvites, setAgencyInvites] = useState<any[]>([]);
  const [isAgencyMember, setIsAgencyMember] = useState(false);
  const [agencyRole, setAgencyRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminInvites, setAdminInvites] = useState<any[]>([]);
  const [guestCounts, setGuestCounts] = useState<Record<string, { total: number; confirmed: number }>>({});
  const [dbBrands, setDbBrands] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'events' | 'admin' | 'members' | 'brands'>('events');

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.DashboardHub || dictionaries.pt.DashboardHub;

  // Função interna atualizada para usar a localização da língua
  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return dict.inviteState.dateUndefined;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      return dateStr.split('T')[0].split(' ')[0];
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    async function loadHub() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) { 
        router.push(`/${params.locale}/login`); 
        return; 
      }
      
      const email = session.user.email || "";
      setUserEmail(email);

      // É membro da agência (marca ativa)? → vê todos os eventos dessa marca.
      const { data: membership } = await supabase
        .from("brand_members")
        .select("role")
        .eq("brand_id", brand.id)
        .eq("user_email", email)
        .maybeSingle();
      const agencyMember = !!membership;
      setIsAgencyMember(agencyMember);
      setAgencyRole((membership as any)?.role ?? null);

      // Super-admin (DIS) → vê todas as marcas no painel de gestão.
      const { data: sa } = await supabase
        .from("super_admins")
        .select("user_email")
        .eq("user_email", email)
        .maybeSingle();
      const superAdmin = !!sa;
      setIsSuperAdmin(superAdmin);

      // Marcas de parceiros na BD (para o super-admin gerir / preencher seletores).
      if (superAdmin && brand.id === "dis") {
        const { data: bd } = await supabase.from("brands").select("id, name");
        setDbBrands(((bd as any[]) || []).map(b => ({ id: b.id, name: b.name })));
      }

      // Eventos próprios e partilhados — sempre isolados pela marca ativa.
      const [myData, collabs] = await Promise.all([
        supabase.from("invitations").select("*").eq("user_email", email).eq("brand_id", brand.id),
        supabase.from("invitation_collaborators").select("invitation_id").eq("user_email", email)
      ]);

      const myInvitesFound = myData.data || [];
      let sharedInvitesFound: any[] = [];

      if (collabs.data && collabs.data.length > 0) {
        const sharedIds = collabs.data.map(c => c.invitation_id);
        const { data: sharedData } = await supabase
          .from("invitations")
          .select("*")
          .in("id", sharedIds)
          .eq("brand_id", brand.id);

        sharedInvitesFound = sharedData || [];
      }

      // Membro da agência → carrega todos os eventos da marca (portfólio da agência).
      let agencyInvitesFound: any[] = [];
      if (agencyMember) {
        const { data: agencyData } = await supabase
          .from("invitations")
          .select("*")
          .eq("brand_id", brand.id);
        agencyInvitesFound = agencyData || [];
      }

      setInvites(myInvitesFound);
      setSharedInvites(sharedInvitesFound);
      setAgencyInvites(agencyInvitesFound);

      // Âmbito do painel de gestão: super-admin no DIS vê tudo; senão, a marca.
      let adminScope: any[] = [];
      if (superAdmin && brand.id === "dis") {
        // Super-admin no domínio DIS → visão global (todas as marcas).
        const { data: allData } = await supabase.from("invitations").select("*");
        adminScope = allData || [];
      } else if (superAdmin || agencyMember) {
        // Super-admin num domínio de parceiro, ou membro de agência → eventos da marca ativa.
        const { data: brandData } = await supabase.from("invitations").select("*").eq("brand_id", brand.id);
        adminScope = brandData || [];
      }
      setAdminInvites(adminScope);

      if (adminScope.length > 0) {
        const ids = adminScope.map((e: any) => e.id);
        const { data: gs } = await supabase.from("guests").select("invitation_id, status").in("invitation_id", ids);
        const counts: Record<string, { total: number; confirmed: number }> = {};
        (gs || []).forEach((g: any) => {
          const c = counts[g.invitation_id] || { total: 0, confirmed: 0 };
          c.total++;
          if (g.status === "confirmed") c.confirmed++;
          counts[g.invitation_id] = c;
        });
        setGuestCounts(counts);
      }

      const primaryCount = agencyMember ? agencyInvitesFound.length : myInvitesFound.length;
      if (primaryCount === 0 && sharedInvitesFound.length === 0) {
        router.push(`/${params.locale}/dashboard/new-invite`);
      } else {
        setLoading(false);
      }
    }

    loadHub();
  }, [params.locale, router, brand.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = `/${params.locale}/login`; 
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 border-t-brand animate-spin text-brand/20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{dict.loadingText}</p>
      </div>
    </div>
  );

  // Membro de agência vê o portfólio da marca; caso contrário, os seus eventos.
  const primaryInvites = isAgencyMember ? agencyInvites : invites;
  const primaryHeading = isAgencyMember
    ? (locale === 'en' ? `${brand.name} events` : `Eventos · ${brand.name}`)
    : dict.title;
  const primaryDesc = isAgencyMember
    ? (locale === 'en' ? 'All your agency events in one place.' : 'Todos os eventos da agência num só lugar.')
    : dict.desc;

  // Painel de gestão: disponível a super-admins e membros de agência.
  const canManage = isSuperAdmin || isAgencyMember;
  const showBrandColumn = isSuperAdmin && brand.id === "dis";

  // Gestão de membros/marcas: função central → só no site master (DIS) e a super-admins.
  const codeBrandList = Object.values(BRANDS).map(b => ({ id: b.id, name: b.name }));
  const manageableBrands = [...codeBrandList, ...dbBrands.filter(d => !BRANDS[d.id])];
  const canManageMembers = isSuperAdmin && brand.id === "dis";
  const canManageBrands = isSuperAdmin && brand.id === "dis";

  return (
    <div className="min-h-screen bg-cream font-montserrat flex flex-col">
      
      {/* HEADER MINIMALISTA */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}`} className="flex flex-col">
            <img src={brand.logo} alt={brand.logoAlt} className="w-32 sm:w-40 h-auto hover:opacity-80 transition-opacity" />
            {brand.poweredBy && (
              <span className="text-[7px] font-semibold uppercase tracking-[0.25em] text-gray-300 mt-0.5">powered by Digital Invite Studio</span>
            )}
          </Link>
          <Link
            href={`/${locale}`}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
          >
            <ArrowLeft size={12} />
            {dict.backToSite}
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* SEPARADOR: Eventos / Gestão (admins) */}
          {canManage && (
            <div className="flex items-center gap-1 bg-cream rounded-full p-1 border border-gold-soft/50">
              <button
                onClick={() => setViewMode('events')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'events' ? 'bg-brand text-white' : 'text-gray-400 hover:text-brand'}`}
              >
                <LayoutGrid size={12} /> <span className="hidden sm:inline">{locale === 'en' ? 'Events' : 'Eventos'}</span>
              </button>
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'admin' ? 'bg-brand text-white' : 'text-gray-400 hover:text-brand'}`}
              >
                <Table size={12} /> <span className="hidden sm:inline">{locale === 'en' ? 'Management' : 'Gestão'}</span>
              </button>
              {canManageMembers && (
                <button
                  onClick={() => setViewMode('members')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'members' ? 'bg-brand text-white' : 'text-gray-400 hover:text-brand'}`}
                >
                  <Users size={12} /> <span className="hidden sm:inline">{locale === 'en' ? 'Members' : 'Membros'}</span>
                </button>
              )}
              {canManageBrands && (
                <button
                  onClick={() => setViewMode('brands')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${viewMode === 'brands' ? 'bg-brand text-white' : 'text-gray-400 hover:text-brand'}`}
                >
                  <Building2 size={12} /> <span className="hidden sm:inline">{locale === 'en' ? 'Brands' : 'Marcas'}</span>
                </button>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userEmail}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">{dict.logoutBtn}</span>
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 sm:py-20">

        {viewMode === 'admin' && canManage ? (
          <AdminManagementView
            events={adminInvites}
            guestCounts={guestCounts}
            showBrand={showBrandColumn}
            locale={locale}
            onOpen={(slug) => router.push(`/${params.locale}/dashboard/${slug}`)}
          />
        ) : viewMode === 'members' && canManageMembers ? (
          <MembersManagementView
            brands={manageableBrands}
            isSuperAdmin={isSuperAdmin}
            currentEmail={userEmail}
            locale={locale}
          />
        ) : viewMode === 'brands' && canManageBrands ? (
          <BrandsManagementView locale={locale} />
        ) : (
        <>
        {/* SECÇÃO 1: OS MEUS PROJETOS */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-3">
            {primaryHeading}
          </h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
            {primaryDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* CARTÃO: CRIAR NOVO EVENTO */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/${params.locale}/dashboard/new-invite`)}
            className="bg-cream border-2 border-dashed border-gold-soft rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand hover:bg-white hover:shadow-xl transition-all h-[280px] group"
          >
            <div className="w-16 h-16 bg-gold-soft/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-gold-soft transition-colors text-brand">
              <Plus size={24} />
            </div>
            <h3 className="font-serif text-2xl text-ink mb-2 group-hover:text-brand transition-colors">{dict.newEvent.title}</h3>
            <p className="text-xs text-gray-400 font-medium">{dict.newEvent.subtitle}</p>
          </motion.div>

          {/* LISTA DE EVENTOS (próprios ou da agência) */}
          {primaryInvites.map((invite) => (
            <motion.div 
              key={invite.id}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/${params.locale}/dashboard/${invite.slug}`)}
              className="bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:shadow-brand/5 transition-all h-[280px] relative overflow-hidden group"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cream rounded-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white border border-gold-soft rounded-full flex items-center justify-center mb-6 text-brand shadow-sm">
                  <Calendar size={18} />
                </div>
                
                <h3 className="font-serif text-3xl text-brand mb-3 leading-tight pr-4">
                  {invite.groom_name && invite.bride_name 
                    ? `${invite.groom_name} & ${invite.bride_name}` 
                    : dict.inviteState.noName}
                </h3>
                
                <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-green-700">{dict.inviteState.activeOwner}</span>
                </div>
              </div>

              <div className="relative z-10 flex justify-between items-end pt-6 border-t border-gray-50 mt-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.inviteState.eventDateLabel}</p>
                  <p className="text-xs text-gray-700 font-semibold">{formatEventDate(invite.event_date)}</p>
                </div>
                <div className="bg-brand text-gold-soft w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SECÇÃO 2: EVENTOS PARTILHADOS */}
        {sharedInvites.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-12 border-t border-gray-100">
            <div className="mb-10 flex items-center gap-4">
              <Users className="text-brand" size={28} />
              <h2 className="font-serif text-3xl sm:text-4xl text-ink font-light italic">
                {dict.sharedSectionTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sharedInvites.map((invite) => (
                <motion.div 
                  key={invite.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/${params.locale}/dashboard/${invite.slug}`)}
                  className="bg-cream border border-gold-soft/50 rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all h-[280px] relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-sm border border-gray-100">
                      <Users size={18} />
                    </div>
                    
                    <h3 className="font-serif text-3xl text-ink mb-3 leading-tight pr-4">
                      {invite.groom_name && invite.bride_name 
                        ? `${invite.groom_name} & ${invite.bride_name}` 
                        : dict.inviteState.noName}
                    </h3>
                    
                    <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-700">{dict.inviteState.collaborator}</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-between items-end pt-6 border-t border-gold-soft/30 mt-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.inviteState.originalOwnerLabel}</p>
                      <p className="text-xs text-gray-700 font-medium truncate w-32">{invite.user_email}</p>
                    </div>
                    <div className="bg-ink text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        </>
        )}
      </main>
    </div>
  );
}