"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

// 1. IMPORTAR OS DICIONÁRIOS (4 níveis para trás a partir de app/[locale]/dashboard/new-invite/)
import pt from "../../../../dictionaries/pt";
import en from "../../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function NovoConvitePage() {
  const router = useRouter();
  const params = useParams();
  
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [slug, setSlug] = useState("");

  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  
  // 3. SELECIONAR OS TEXTOS CORRETOS
  const dict = dictionaries[locale]?.NovoConvitePage || dictionaries.pt.NovoConvitePage;

  // Carrega o email da sessão e o domínio base
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${params.locale}/login`);
        return;
      }
      setUserEmail(session.user.email || "");
    }
    getUser();
    
    setBaseUrl(`${window.location.host}/${params.locale}/invite/`);
  }, [params.locale, router]);

  // Gera o slug (link) automaticamente baseado nos nomes
  useEffect(() => {
    if (groomName || brideName) {
      const formatName = (name: string) => name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      
      let generatedSlug = "";
      if (groomName && brideName) generatedSlug = `${formatName(groomName)}-e-${formatName(brideName)}`;
      else if (groomName) generatedSlug = formatName(groomName);
      else if (brideName) generatedSlug = formatName(brideName);
      
      setSlug(generatedSlug);
    }
  }, [groomName, brideName]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
      // 1. Verifica se o slug já existe
      const { data: existing } = await supabase.from("invitations").select("id").eq("slug", cleanSlug).maybeSingle();
      
      if (existing) {
        alert(dict.alerts.slugExists);
        setLoading(false);
        return;
      }

      // 2. Cria o novo convite
      const { error } = await supabase.from("invitations").insert([{
        user_email: userEmail,
        slug: cleanSlug,
        groom_name: groomName,
        bride_name: brideName,
        event_date: eventDate
      }]);

      if (error) throw error;

      // 3. Sucesso! Redireciona para o painel de controlo
      router.push(`/${params.locale}/dashboard/${cleanSlug}`);

    } catch (error: any) {
      alert(dict.alerts.error + error.message);
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-brand text-lg text-gray-800 px-0 py-3 transition-colors font-montserrat placeholder-gray-300";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 block font-montserrat";

  return (
    <div className="min-h-screen bg-cream font-montserrat flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-8 py-6 flex items-center sticky top-0 z-20">
        <button 
          onClick={() => router.push(`/${params.locale}/dashboard`)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
        >
          <ArrowLeft size={16} /> {dict.backBtn}
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-2xl w-full p-10 sm:p-16 rounded-[2.5rem] shadow-xl shadow-brand/5 border border-gray-100"
        >
          <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl text-brand font-light italic mb-4">
              {dict.title}
            </h1>
            <p className="text-gray-500 text-sm">
              {dict.desc}
            </p>
          </div>

          <form onSubmit={handleCreateInvite} className="space-y-10">
            
            {/* NOMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>{dict.labels.groom}</label>
                <input 
                  type="text" 
                  required
                  className={inputClass} 
                  placeholder={dict.placeholders.groom} 
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{dict.labels.bride}</label>
                <input 
                  type="text" 
                  required
                  className={inputClass} 
                  placeholder={dict.placeholders.bride} 
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                />
              </div>
            </div>

            {/* DATA E LINK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>{dict.labels.date}</label>
                <input 
                  type="date" 
                  required
                  className={inputClass} 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{dict.labels.link}</label>
                <div className="flex items-center border-b border-gray-300 focus-within:border-brand transition-colors py-1 overflow-hidden">
                  <LinkIcon size={16} className="text-gray-400 mr-2 shrink-0" />
                  <span className="text-gray-400 text-[13px] font-medium whitespace-nowrap">{baseUrl}</span>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-transparent border-0 focus:ring-0 text-sm text-brand font-bold px-1 py-2" 
                    placeholder={dict.placeholders.link} 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-2">{dict.linkHelp}</p>
              </div>
            </div>

            {/* BOTÃO */}
            <div className="pt-6 border-t border-gray-50">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand text-gold-soft py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : dict.submitBtn}
              </button>
            </div>

          </form>
        </motion.div>
      </main>
    </div>
  );
}