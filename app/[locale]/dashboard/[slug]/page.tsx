"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DesignModule from "@/components/dashboard/DesignModule";
import GuestsModule from "@/components/dashboard/GuestsModule";

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'design' | 'guests'>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }
      const { data: invite } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (invite) {
        setFormData(invite);
        const { data: gs } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
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
    alert("Site publicado com sucesso!");
    setSaving(false);
  };

  if (loading || !formData) return <div className="p-20 text-center font-serif italic tracking-widest uppercase opacity-40">A carregar estúdio...</div>;

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-neutral-800 text-left">
      <header className="bg-white border-b px-8 py-6 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <h1 className="font-serif text-xl uppercase tracking-[0.3em]">Wedding Studio</h1>
        <button onClick={() => router.push(`/${params.locale}/invite/${params.slug}`)} className="bg-black text-white px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest">Ver Site</button>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-12">
        <div className="flex gap-12 border-b mb-12">
          <button onClick={() => setActiveTab('design')} className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-all ${activeTab === 'design' ? 'border-b-2 border-black opacity-100' : 'opacity-30'}`}>01. Design & Conteúdo</button>
          <button onClick={() => setActiveTab('guests')} className={`pb-4 text-[12px] font-bold uppercase tracking-widest transition-all ${activeTab === 'guests' ? 'border-b-2 border-black opacity-100' : 'opacity-30'}`}>02. Lista de Convidados</button>
        </div>

        {activeTab === 'design' ? (
          <DesignModule formData={formData} setFormData={setFormData} handleImageUpload={handleImageUpload} handleSaveDesign={handleSaveDesign} saving={saving} />
        ) : (
          <GuestsModule guests={guests} setGuests={setGuests} invitationId={formData.id} groomName={formData.groom_name} brideName={formData.bride_name} />
        )}
      </main>
    </div>
  );
}