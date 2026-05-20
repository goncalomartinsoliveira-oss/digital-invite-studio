"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Calendar, LogOut, ArrowRight, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

      const [myData, collabs] = await Promise.all([
        supabase.from("invitations").select("*").eq("user_email", email),
        supabase.from("invitation_collaborators").select("invitation_id").eq("user_email", email)
      ]);

      const myInvitesFound = myData.data || [];
      let sharedInvitesFound: any[] = [];

      if (collabs.data && collabs.data.length > 0) {
        const sharedIds = collabs.data.map(c => c.invitation_id);
        const { data: sharedData } = await supabase
          .from("invitations")
          .select("*")
          .in("id", sharedIds);
        
        sharedInvitesFound = sharedData || [];
      }

      setInvites(myInvitesFound);
      setSharedInvites(sharedInvitesFound);

      if (myInvitesFound.length === 0 && sharedInvitesFound.length === 0) {
        router.push(`/${params.locale}/dashboard/new-invite`);
      } else {
        setLoading(false);
      }
    }
    
    loadHub();
  }, [params.locale, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = `/${params.locale}/login`; 
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 border-t-[#630100] animate-spin text-[#630100]/20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{dict.loadingText}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-montserrat flex flex-col">
      
      {/* HEADER MINIMALISTA */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-32 sm:w-40 h-auto" />
        
        <div className="flex items-center gap-6">
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
        
        {/* SECÇÃO 1: OS MEUS PROJETOS */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-[#630100] font-light italic mb-3">
            {dict.title}
          </h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
            {dict.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* CARTÃO: CRIAR NOVO EVENTO */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/${params.locale}/dashboard/new-invite`)}
            className="bg-[#FDFBF7] border-2 border-dashed border-[#EFDFBB] rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#630100] hover:bg-white hover:shadow-xl transition-all h-[280px] group"
          >
            <div className="w-16 h-16 bg-[#EFDFBB]/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#630100] group-hover:text-[#EFDFBB] transition-colors text-[#630100]">
              <Plus size={24} />
            </div>
            <h3 className="font-serif text-2xl text-[#332E2B] mb-2 group-hover:text-[#630100] transition-colors">{dict.newEvent.title}</h3>
            <p className="text-xs text-gray-400 font-medium">{dict.newEvent.subtitle}</p>
          </motion.div>

          {/* LISTA DE EVENTOS EXISTENTES (DONO) */}
          {invites.map((invite) => (
            <motion.div 
              key={invite.id}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/${params.locale}/dashboard/${invite.slug}`)}
              className="bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:shadow-[#630100]/5 transition-all h-[280px] relative overflow-hidden group"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FDFBF7] rounded-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white border border-[#EFDFBB] rounded-full flex items-center justify-center mb-6 text-[#630100] shadow-sm">
                  <Calendar size={18} />
                </div>
                
                <h3 className="font-serif text-3xl text-[#630100] mb-3 leading-tight pr-4">
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
                <div className="bg-[#630100] text-[#EFDFBB] w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
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
              <Users className="text-[#630100]" size={28} />
              <h2 className="font-serif text-3xl sm:text-4xl text-[#332E2B] font-light italic">
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
                  className="bg-[#FDFBF7] border border-[#EFDFBB]/50 rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all h-[280px] relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-sm border border-gray-100">
                      <Users size={18} />
                    </div>
                    
                    <h3 className="font-serif text-3xl text-[#332E2B] mb-3 leading-tight pr-4">
                      {invite.groom_name && invite.bride_name 
                        ? `${invite.groom_name} & ${invite.bride_name}` 
                        : dict.inviteState.noName}
                    </h3>
                    
                    <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-700">{dict.inviteState.collaborator}</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-between items-end pt-6 border-t border-[#EFDFBB]/30 mt-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{dict.inviteState.originalOwnerLabel}</p>
                      <p className="text-xs text-gray-700 font-medium truncate w-32">{invite.user_email}</p>
                    </div>
                    <div className="bg-[#332E2B] text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}