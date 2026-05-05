"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Importação dos Templates
import LuxuryTemplate from "../../templates/luxury-01/page";
import MinimalTemplate from "../../templates/minimal-01/page";

const TEMPLATE_COMPONENTS: any = {
  "luxury-01": LuxuryTemplate,
  "minimal-01": MinimalTemplate,
};

export default function DynamicInvite() {
  const params = useParams();
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvite() {
      if (!params.slug) return;
      const { data } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (data) setInviteData(data);
      setLoading(false);
    }
    fetchInvite();
  }, [params.slug]);

  if (loading) return <div className="h-screen flex items-center justify-center font-serif italic text-neutral-400 animate-pulse uppercase tracking-widest text-[10px]">A carregar o vosso convite...</div>;
  if (!inviteData) return <div className="h-screen flex items-center justify-center font-serif">Convite não encontrado.</div>;

  const SelectedTemplate = TEMPLATE_COMPONENTS[inviteData.template_id] || LuxuryTemplate;

  return (
    <main className="relative bg-[#FDFBF7]">
      {/* O Design Escolhido carrega tudo de forma autónoma, incluindo o novo rodapé escuro fotográfico! */}
      <SelectedTemplate data={inviteData} />
    </main>
  );
}