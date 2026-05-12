"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

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
    
    // Define o URL dinâmico para mostrar no formulário (ex: localhost:3001/pt/invite/)
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
        alert("Este link de convite já está a ser utilizado. Por favor, adicione um número ou altere o link.");
        setLoading(false);
        return;
      }

      // 2. Cria o novo convite apenas com os campos que sabemos que existem na base de dados
      const { error } = await supabase.from("invitations").insert([{
        user_email: userEmail,
        slug: cleanSlug,
        groom_name: groomName,
        bride_name: brideName,
        event_date: eventDate
      }]);

      if (error) throw error;

      // 3. Sucesso! Redireciona o cliente para o seu novo painel de controlo
      router.push(`/${params.locale}/dashboard/${cleanSlug}`);

    } catch (error: any) {
      alert("Ocorreu um erro ao criar o evento: " + error.message);
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-[#630100] text-lg text-gray-800 px-0 py-3 transition-colors font-montserrat placeholder-gray-300";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 block font-montserrat";

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-montserrat flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-8 py-6 flex items-center sticky top-0 z-20">
        <button 
          onClick={() => router.push(`/${params.locale}/dashboard`)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#630100] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Hub
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-2xl w-full p-10 sm:p-16 rounded-[2.5rem] shadow-xl shadow-[#630100]/5 border border-gray-100"
        >
          <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl text-[#630100] font-light italic mb-4">
              Criar Novo Evento
            </h1>
            <p className="text-gray-500 text-sm">
              Vamos começar por definir os detalhes principais do vosso grande dia. Poderão personalizar tudo mais à frente.
            </p>
          </div>

          <form onSubmit={handleCreateInvite} className="space-y-10">
            
            {/* NOMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Nome do Noivo / Noiva 1</label>
                <input 
                  type="text" 
                  required
                  className={inputClass} 
                  placeholder="Ex: Gonçalo" 
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Nome da Noiva / Noivo 2</label>
                <input 
                  type="text" 
                  required
                  className={inputClass} 
                  placeholder="Ex: Márcia" 
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                />
              </div>
            </div>

            {/* DATA E LINK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Data do Casamento</label>
                <input 
                  type="date" 
                  required
                  className={inputClass} 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Link Personalizado</label>
                <div className="flex items-center border-b border-gray-300 focus-within:border-[#630100] transition-colors py-1 overflow-hidden">
                  <LinkIcon size={16} className="text-gray-400 mr-2 shrink-0" />
                  <span className="text-gray-400 text-[13px] font-medium whitespace-nowrap">{baseUrl}</span>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-transparent border-0 focus:ring-0 text-sm text-[#630100] font-bold px-1 py-2" 
                    placeholder="goncalo-e-marcia" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-2">Este será o endereço enviado aos convidados.</p>
              </div>
            </div>

            {/* BOTÃO */}
            <div className="pt-6 border-t border-gray-50">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#630100] text-[#EFDFBB] py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Gerar o meu Convite Digital"}
              </button>
            </div>

          </form>
        </motion.div>
      </main>
    </div>
  );
}