"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// Importação dos Templates (designs)
import LuxuryTemplate from "../../templates/luxury-01/page";
import MinimalTemplate from "../../templates/minimal-01/page";

// Mapa de Templates
const TEMPLATE_COMPONENTS: any = {
  "luxury-01": LuxuryTemplate,
  "minimal-01": MinimalTemplate,
};

// ==========================================================
// COMPONENTE SMART RSVP (Lógica de Grupo e Individualizada)
// ==========================================================
function SmartRSVPSection({ invitationId }: { invitationId: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [foundGuests, setFoundGuests] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [step, setStep] = useState(0); // 0: Busca, 1: Formulário de Grupo, 2: Sucesso
  const [submitting, setSubmitting] = useState(false);

  // 1. Lógica de Busca Dinâmica (Procura por nome individual)
  useEffect(() => {
    if (searchTerm.length < 3) {
      setFoundGuests([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invitationId)
        .ilike('name', `%${searchTerm}%`)
        .eq('status', 'pending')
        .limit(5);

      if (!error && data) setFoundGuests(data);
      setLoadingSearch(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, invitationId]);

  // 2. Selecionar um nome e PUXAR O GRUPO TODO
  const handleSelectGroup = async (guest: any) => {
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('group_id', guest.group_id); // Aqui está a magia: puxa todos os familiares

    if (!error && data) {
      setGroupMembers(data);
      setStep(1);
      setSearchTerm("");
    }
    setLoadingSearch(false);
  };

  // 3. Enviar RSVP de todos os membros do grupo
  const handleSubmitRSVP = async () => {
    setSubmitting(true);
    
    // Atualiza cada membro individualmente na base de dados
    const updates = groupMembers.map(member => 
      supabase
        .from('guests')
        .update({
          status: member.status,
          dietary_notes: member.status === 'confirmed' ? member.dietary_notes : null
        })
        .eq('id', member.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      alert("Ocorreu um erro ao gravar algumas respostas.");
    } else {
      setStep(2);
    }
    setSubmitting(false);
  };

  return (
    <section id="rsvp" className="py-24 px-6 bg-white border-t border-neutral-100 font-sans selection:bg-neutral-900 selection:text-white">
      <div className="max-w-xl mx-auto space-y-12">
        
        <header className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block">RSVP</span>
          <h2 className="font-serif text-5xl uppercase tracking-tighter">Confirmar Presença</h2>
          <div className="h-px w-12 bg-neutral-200 mx-auto mt-6"></div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* PASSO 0: BUSCA */}
          {step === 0 && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <p className="text-sm text-center text-neutral-600">Introduza o seu nome para encontrar o seu grupo familiar.</p>
              <div className="relative">
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escreva o seu nome..."
                  className="w-full border border-neutral-200 p-5 rounded-sm text-sm outline-none focus:border-neutral-900 transition-colors bg-neutral-50"
                />
                {loadingSearch && <div className="absolute right-5 top-5 text-xs text-neutral-400 animate-pulse">A procurar...</div>}
              </div>

              {foundGuests.length > 0 && (
                <ul className="border border-neutral-100 divide-y divide-neutral-100 rounded-sm bg-white shadow-lg">
                  {foundGuests.map(g => (
                    <li key={g.id} onClick={() => handleSelectGroup(g)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-all">
                      <span className="font-bold">{g.name}</span>
                      <span className="text-xs text-neutral-400 uppercase tracking-widest">Selecionar →</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {/* PASSO 1: FORMULÁRIO DE GRUPO */}
          {step === 1 && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <h3 className="font-serif text-2xl italic">Olá! Encontrámos o vosso grupo.</h3>
                <p className="text-xs text-neutral-400 uppercase tracking-widest mt-2">Por favor, confirmem a presença de cada membro:</p>
              </div>

              <div className="space-y-4">
                {groupMembers.map((member, idx) => (
                  <div key={member.id} className="p-6 border border-neutral-100 rounded-sm space-y-4 bg-neutral-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-neutral-900">{member.name}</p>
                        <p className="text-[9px] uppercase tracking-widest opacity-50">
                          {member.category === 'adult' ? '🧔 Adulto' : member.category === 'child' ? '👦 Criança' : '👶 Bebé'}
                        </p>
                      </div>
                      <select 
                        value={member.status}
                        onChange={(e) => {
                          const updated = [...groupMembers];
                          updated[idx].status = e.target.value;
                          setGroupMembers(updated);
                        }}
                        className={`text-[10px] uppercase tracking-widest font-bold p-2 border rounded-sm outline-none ${member.status === 'confirmed' ? 'bg-black text-white' : 'bg-white'}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="declined">Não vai</option>
                      </select>
                    </div>

                    {member.status === 'confirmed' && (
                      <input 
                        type="text"
                        placeholder="Restrições alimentares ou notas?"
                        value={member.dietary_notes || ""}
                        onChange={(e) => {
                          const updated = [...groupMembers];
                          updated[idx].dietary_notes = e.target.value;
                          setGroupMembers(updated);
                        }}
                        className="w-full border-b border-neutral-200 bg-transparent py-2 text-xs outline-none focus:border-black transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSubmitRSVP}
                disabled={submitting || groupMembers.every(m => m.status === 'pending')}
                className="w-full bg-black text-white py-5 text-[10px] uppercase tracking-[0.4em] font-bold shadow-xl disabled:bg-neutral-200 transition-all"
              >
                {submitting ? "A gravar..." : "Confirmar Grupo"}
              </button>
            </motion.div>
          )}

          {/* PASSO 2: SUCESSO */}
          {step === 2 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-6">
              <span className="text-5xl block">🥂</span>
              <h3 className="font-serif text-3xl uppercase">Respostas Gravadas!</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto italic">Obrigado por confirmarem. Mal podemos esperar por vos ver no grande dia!</p>
              <button onClick={() => setStep(0)} className="text-[9px] uppercase tracking-widest opacity-30 hover:opacity-100 pt-8">Mudar Respostas</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}

// ==========================================================
// PÁGINA PRINCIPAL
// ==========================================================
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

  if (loading) return <div className="h-screen flex items-center justify-center font-serif italic text-neutral-400 animate-pulse">A carregar o vosso convite...</div>;
  if (!inviteData) return <div className="h-screen flex items-center justify-center font-serif">Convite não encontrado.</div>;

  const SelectedTemplate = TEMPLATE_COMPONENTS[inviteData.template_id] || LuxuryTemplate;

  return (
    <main className="relative bg-[#FDFBF7]">
      <SelectedTemplate data={inviteData} />
      <SmartRSVPSection invitationId={inviteData.id} />
    </main>
  );
}