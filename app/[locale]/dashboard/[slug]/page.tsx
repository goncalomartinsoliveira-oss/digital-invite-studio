"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";
import ContentModule from "@/components/dashboard/ContentModule";

import LuxuryTemplate from "../../templates/luxury-01/page"; 

type DashboardTab = 'design' | 'content' | 'guests';

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      const { data: invite } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (!invite) { router.push(`/${params.locale}/dashboard`); return; }
      setFormData(invite);
      const { data: gs } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
      setGuests(gs || []);
      setLoading(false);
    }
    loadData();
  }, [params.slug, params.locale, router]);

  const handleSaveDesign = async () => {
    setSaving(true);
    await supabase.from("invitations").update(formData).eq("id", formData.id);
    setSaving(false);
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

  if (loading || !formData) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="w-10 h-10 border-4 border-t-[#722F37] rounded-full animate-spin"></div>
    </div>
  );

  const tabsConfig = [
    { id: 'design', label: 'Modelos e identidade', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
    { id: 'content', label: 'Conteúdo do convite', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg> },
    { id: 'guests', label: 'Lista', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ] as { id: DashboardTab, label: string, icon: React.ReactNode }[];

  const previewScale = 0.31; 
  const desktopWidth = 1280; 
  const desktopHeight = 850; 
  const containerWidth = desktopWidth * previewScale;
  const containerHeight = desktopHeight * previewScale;

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2D3748] overflow-hidden font-sans">
      
      <aside className="w-64 bg-white border-r border-gray-100 hidden xl:flex flex-col z-30 shadow-sm">
        {/* LOGÓTIPO MAIOR COM DESTAQUE */}
        <div className="pt-10 pb-8 px-6 flex items-center justify-center border-b border-gray-50 mb-4">
            <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-52 h-auto drop-shadow-sm hover:scale-105 transition-transform duration-500" />
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {tabsConfig.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === tab.id ? 'bg-[#722F37] text-white shadow-lg shadow-[#722F37]/30' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex flex-col h-screen overflow-hidden border-r border-gray-100 bg-[#FDFBF7]">
          <header className="h-16 md:h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20">
            <h1 className="text-lg font-bold text-gray-800">{tabsConfig.find(t => t.id === activeTab)?.label}</h1>
            <div className="flex items-center gap-3">
               {activeTab !== 'guests' && (
                 <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="lg:hidden bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                   Ver Preview
                 </button>
               )}
               <button onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')} className="hidden md:block bg-gray-100 text-gray-600 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Abrir Convite
               </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scroll-smooth">
            <div className="max-w-5xl mx-auto">
              {activeTab === 'design' && <DesignModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} handleImageUpload={handleImageUpload} />}
              {activeTab === 'content' && <ContentModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} />}
              {activeTab === 'guests' && <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} groomName={formData.groom_name} brideName={formData.bride_name} />}
            </div>
          </main>
        </div>

        {activeTab !== 'guests' && (
          <div className={`
            ${showMobilePreview ? 'fixed inset-0 z-[200] bg-white' : 'hidden'} 
            lg:flex lg:relative lg:w-[420px] xl:w-[460px] bg-[#F1F3F5] flex-col items-center justify-center p-4 border-l border-gray-100
          `}>
            
            <div style={{ width: containerWidth, height: containerHeight }} className="relative flex items-center justify-center">
              <div 
                className="absolute top-0 left-0 bg-white rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col overflow-hidden origin-top-left"
                style={{ width: desktopWidth, height: desktopHeight, transform: `scale(${previewScale})` }}
              >
                <div className="h-12 bg-[#E5E7EB] border-b border-gray-300 flex items-center px-4 gap-2 flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                  
                  <div className="mx-auto w-[60%] h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                    <span className="text-[11px] font-medium text-gray-500 font-mono">
                      digitalinvitestudio.com/{formData.slug || 'casamento'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 w-full bg-white overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                    {/* @ts-ignore */}
                    <LuxuryTemplate data={formData} params={params} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Vista Desktop em Tempo Real</span>
            </div>

            {showMobilePreview && (
              <button onClick={() => setShowMobilePreview(false)} className="absolute top-8 right-8 bg-[#722F37] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-[210]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {!showMobilePreview && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 flex justify-around items-center z-[100] px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {tabsConfig.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#722F37]' : 'text-gray-300'}`}>
              {tab.icon}
              <span className="text-[10px] font-bold tracking-tight text-center leading-tight w-20">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}