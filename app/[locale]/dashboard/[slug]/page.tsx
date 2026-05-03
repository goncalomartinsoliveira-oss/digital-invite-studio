"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";
import EventModule from "@/components/dashboard/EventModule"; // Novo Import

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  // Atualizado para incluir o estado 'event'
  const [activeTab, setActiveTab] = useState<'design' | 'guests' | 'event'>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        router.push(`/${params.locale}/login`); 
        return; 
      }
      
      const { data: invite } = await supabase
        .from("invitations")
        .select("*")
        .eq("slug", params.slug)
        .single();

      if (invite) {
        setFormData(invite);
        const { data: gs } = await supabase
          .from("guests")
          .select("*")
          .eq("invitation_id", invite.id);
        setGuests(gs || []);
      }
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
    await supabase.from("invitations").update(formData).eq("id", formData.id);
    alert("Alterações gravadas com sucesso!");
    setSaving(false);
  };

  if (loading || !formData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="text-center font-serif italic tracking-[0.2em] uppercase opacity-40 animate-pulse">
          A abrir o vosso estúdio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-[#332E2B] text-left">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b px-8 py-6 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <img src="/logo-dis.svg" alt="Logo" className="h-10 w-auto" />
          <div className="h-8 w-px bg-neutral-200 hidden md:block"></div>
          <h1 className="font-serif text-lg uppercase tracking-[0.2em] hidden md:block">Dashboard</h1>
        </div>
        
        <button 
          onClick={() => window.open(`/${params.locale}/invite/${params.slug}`, '_blank')} 
          className="bg-[#72393F] text-[#F0E9E3] px-8 py-3 text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-[#332E2B] transition-all shadow-lg"
        >
          Visualizar Convite
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-12">
        
        {/* --- NAVEGAÇÃO DE TABS --- */}
        <div className="flex flex-wrap gap-8 md:gap-12 border-b border-neutral-200 mb-12">
          <button 
            onClick={() => setActiveTab('design')} 
            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'design' ? 'border-b-2 border-[#72393F] text-[#72393F]' : 'opacity-30 hover:opacity-100'}`}
          >
            01. Design & Capa
          </button>
          
          <button 
            onClick={() => setActiveTab('event')} 
            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'event' ? 'border-b-2 border-[#72393F] text-[#72393F]' : 'opacity-30 hover:opacity-100'}`}
          >
            02. Detalhes do Evento
          </button>

          <button 
            onClick={() => setActiveTab('guests')} 
            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'guests' ? 'border-b-2 border-[#72393F] text-[#72393F]' : 'opacity-30 hover:opacity-100'}`}
          >
            03. Lista de Convidados
          </button>
        </div>

        {/* --- CONTEÚDO DINÂMICO --- */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          {activeTab === 'design' && (
            <DesignModule 
              formData={formData} 
              setFormData={setFormData} 
              handleImageUpload={handleImageUpload} 
              handleSaveDesign={handleSaveDesign} 
              saving={saving} 
            />
          )}

          {activeTab === 'event' && (
            <EventModule 
              formData={formData} 
              setFormData={setFormData} 
              handleSaveDesign={handleSaveDesign} 
              saving={saving} 
            />
          )}

          {activeTab === 'guests' && (
            <GuestsModule 
              guests={guests} 
              setGuests={setGuests} 
              invitationId={formData.id} 
              groomName={formData.groom_name} 
              brideName={formData.bride_name} 
            />
          )}
        </div>
      </main>

      <footer className="p-12 text-center opacity-20 text-[9px] uppercase tracking-[0.5em]">
        Digital Invite Studio — Professional Wedding Management
      </footer>
    </div>
  );
}