"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";
import EventModule from "@/components/dashboard/EventModule"; 
import ContentModule from "@/components/dashboard/ContentModule";

type DashboardTab = 'design' | 'event' | 'content' | 'guests';

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      
      const { data: invite, error } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (error || !invite) { router.push(`/${params.locale}/dashboard`); return; }

      setFormData(invite);
      const { data: gs } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
      setGuests(gs || []);
      setLoading(false);
    }
    loadData();
  }, [params.slug, params.locale, router]);

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

  const handleSaveDesign = async () => {
    setSaving(true);
    const { error } = await supabase.from("invitations").update(formData).eq("id", formData.id);
    if (!error) alert("Alterações publicadas com sucesso!");
    setSaving(false);
  };

  if (loading || !formData) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#722F37] rounded-full animate-spin"></div>
    </div>
  );

  const tabsConfig = [
    { id: 'design', label: 'Design', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
    { id: 'event', label: 'Locais', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> },
    { id: 'content', label: 'Textos', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg> },
    { id: 'guests', label: 'Lista', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ] as { id: DashboardTab, label: string, icon: React.ReactNode }[];

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2D3748] overflow-hidden">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-30 shadow-xl shadow-black/5">
        <div className="p-8 font-serif text-xl font-bold tracking-tighter text-[#722F37]">WeddingStudio</div>
        <nav className="flex-1 px-4 space-y-1">
          {tabsConfig.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-[13px] ${activeTab === tab.id ? 'bg-[#722F37] text-white shadow-lg shadow-[#722F37]/30' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 md:h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-lg font-bold text-gray-800 md:text-xl">{tabsConfig.find(t => t.id === activeTab)?.label}</h1>
          <button onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')} className="bg-[#722F37] text-white px-5 py-2 text-[10px] md:text-[11px] font-bold rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
             <span className="hidden sm:inline">Ver Convite</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'design' && <DesignModule formData={formData} setFormData={setFormData} handleImageUpload={handleImageUpload} handleSaveDesign={handleSaveDesign} saving={saving} />}
            {activeTab === 'event' && <EventModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} />}
            {activeTab === 'content' && <ContentModule formData={formData} setFormData={setFormData} handleSaveDesign={handleSaveDesign} saving={saving} />}
            {activeTab === 'guests' && <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} groomName={formData.groom_name} brideName={formData.bride_name} />}
          </div>
        </main>

        {/* BOTTOM NAVIGATION (Mobile) - ESSENCIAL PARA APARECER OS SEPARADORES */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-20 flex justify-around items-center z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4">
          {tabsConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all flex-1 py-2 ${isActive ? 'text-[#722F37]' : 'text-gray-300'}`}>
                 <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>{tab.icon}</div>
                 <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                 {isActive && <div className="w-1.5 h-1.5 bg-[#722F37] rounded-full mt-0.5"></div>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}