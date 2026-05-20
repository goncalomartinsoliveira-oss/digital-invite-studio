"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Copy, 
  Check, 
  ExternalLink, 
  UserCircle, 
  PenTool, 
  FileText, 
  Users, 
  Grid, 
  Camera 
} from "lucide-react";

import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";
import ContentModule from "@/components/dashboard/ContentModule";
import SeatingModule from "@/components/dashboard/SeatingModule";
import AccountModule from "@/components/dashboard/AccountModule";
import MomentsModule from "@/components/dashboard/MomentsModule"; 

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis para trás)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

type DashboardTab = 'design' | 'content' | 'guests' | 'seating' | 'moments' | 'account';

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("viewer");

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.Dashboard || dictionaries.pt.Dashboard;

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      
      const email = session.user.email;

      const { data: invite } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (!invite) { router.push(`/${params.locale}/dashboard`); return; }
      
      const isOwner = invite.user_email === email;
      const { data: collab } = await supabase
        .from("invitation_collaborators")
        .select("id, role")
        .eq("invitation_id", invite.id)
        .eq("user_email", email)
        .maybeSingle();

      if (!isOwner && !collab) {
        console.error("Acesso Negado.");
        router.push(`/${params.locale}/dashboard`);
        return;
      }

      if (isOwner) {
        setUserRole("owner");
      } else if (collab) {
        setUserRole(collab.role as "editor" | "viewer");
      }

      setFormData({
        ...invite,
        user_email: invite.user_email || email
      });

      const { data: gs } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
      setGuests(gs || []);
      setLoading(false);
    }
    loadData();
  }, [params.slug, params.locale, router]);

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
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="w-10 h-10 border-4 border-t-[#630100] rounded-full animate-spin"></div>
    </div>
  );

  const tabsConfig = [
    { id: 'design', label: dict.tabs.design, icon: <PenTool size={20} /> },
    { id: 'content', label: dict.tabs.content, icon: <FileText size={20} /> },
    { id: 'guests', label: dict.tabs.guests, icon: <Users size={20} /> },
    { id: 'seating', label: dict.tabs.seating, icon: <Grid size={20} /> },
    { id: 'moments', label: dict.tabs.moments, icon: <Camera size={20} /> } 
  ] as { id: DashboardTab, label: string, icon: React.ReactNode }[];

  const isFullScreenTab = activeTab === 'guests' || activeTab === 'seating' || activeTab === 'moments' || activeTab === 'account';

  const canEdit = userRole === "owner" || userRole === "editor";

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2D3748] overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden xl:flex flex-col z-30 shadow-sm shrink-0">
        <div className="pt-10 pb-8 px-6 flex items-center justify-center border-b border-gray-50 mb-4">
            <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-52 h-auto drop-shadow-sm hover:scale-105 transition-transform duration-500" />
        </div>
        
        <nav className="px-4 space-y-2">
          {tabsConfig.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === tab.id ? 'bg-[#630100] text-white shadow-lg shadow-[#630100]/30' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-10 pt-4 border-t border-gray-50">
           <button 
             onClick={() => setActiveTab('account')} 
             className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === 'account' ? 'bg-[#332E2B] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
           >
              <UserCircle size={20} /> {dict.accountLabel}
           </button>
        </div>
      </aside>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex flex-col h-screen overflow-hidden border-r border-gray-100 bg-[#FDFBF7]">
          
          <header className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block font-montserrat">
                {activeTab === 'account' ? dict.accountLabel : tabsConfig.find(t => t.id === activeTab)?.label}
              </h1>
              {!canEdit && (
                <span className="bg-blue-50 text-blue-500 border border-blue-100 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md hidden sm:block">
                  {dict.readOnly}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
               <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  {saving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-[#630100]/30 border-t-[#630100] rounded-full animate-spin"></div>
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
                 className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-[#630100] transition-all active:scale-95"
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
                 className="flex items-center gap-2 bg-[#630100] text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-[#4a0100] transition-all active:scale-95"
               >
                  <span className="hidden sm:inline">{dict.openInvite}</span>
                  <ExternalLink size={14} />
               </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scroll-smooth relative">
            <div className="max-w-5xl mx-auto">
              {activeTab === 'design' && <DesignModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} handleImageUpload={handleImageUpload} canEdit={canEdit} />}
              {activeTab === 'content' && <ContentModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} canEdit={canEdit} />}
              {activeTab === 'guests' && <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} groomName={formData.groom_name} brideName={formData.bride_name} canEdit={canEdit} />}
              {activeTab === 'seating' && <SeatingModule invitationId={formData.id} canEdit={canEdit} />}
              {activeTab === 'moments' && <MomentsModule invitationId={formData.id} slug={params.slug as string} canEdit={canEdit} />}
              {activeTab === 'account' && <AccountModule userEmail={formData.user_email} invitationId={formData.id} />}
            </div>
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
                              className="w-full h-full border-none bg-[#FDFBF7]"
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
              <button onClick={() => setShowMobilePreview(false)} className="absolute top-8 right-8 bg-[#630100] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-[210]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {!showMobilePreview && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 flex justify-around items-center z-[100] px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {[...tabsConfig, { id: 'account', label: dict.accountLabel, icon: <UserCircle size={20} /> }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DashboardTab)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#630100]' : 'text-gray-300'}`}>
              {tab.icon}
              <span className="text-[10px] font-bold tracking-tight text-center leading-tight w-20">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}