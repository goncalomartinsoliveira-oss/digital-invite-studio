// components/invite/SmartRsvp.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface SmartRsvpProps {
  invitationId: string;
}

export default function SmartRsvp({ invitationId }: SmartRsvpProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [foundGuests, setFoundGuests] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [step, setStep] = useState(0); // 0: Busca, 1: Formulário, 2: Sucesso
  const [submitting, setSubmitting] = useState(false);

  // 1. Busca Dinâmica de Nomes
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
        .limit(5);

      if (!error && data) setFoundGuests(data);
      setLoadingSearch(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, invitationId]);

  // 2. Selecionar Convidado e Carregar Grupo
  const handleSelectGroup = async (guest: any) => {
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('group_id', guest.group_id);

    if (!error && data) {
      setGroupMembers(data);
      setStep(1);
      setSearchTerm("");
    }
    setLoadingSearch(false);
  };

  // 3. Gravar RSVP do Grupo
  const handleSubmitRSVP = async () => {
    setSubmitting(true);
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
    if (results.some(r => r.error)) {
      alert("Erro ao gravar algumas respostas.");
    } else {
      setStep(2);
    }
    setSubmitting(false);
  };

  return (
    <section id="rsvp" className="py-24 px-6 bg-white border-t border-neutral-100 font-sans">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block">RSVP</span>
          <h2 className="font-serif text-5xl uppercase tracking-tighter">Confirmar Presença</h2>
          <div className="h-px w-12 bg-neutral-200 mx-auto mt-6"></div>
        </header>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <p className="text-sm text-center text-neutral-600 italic">Pesquise o seu nome para encontrar o seu grupo familiar.</p>
              <div className="relative">
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escreva o seu nome..."
                  className="w-full border border-neutral-200 p-5 rounded-sm text-sm outline-none focus:border-black transition-colors bg-neutral-50"
                />
                {loadingSearch && <div className="absolute right-5 top-5 text-xs text-neutral-400 animate-pulse">A procurar...</div>}
              </div>

              {foundGuests.length > 0 && (
                <ul className="border border-neutral-100 divide-y rounded-sm bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {foundGuests.map(g => (
                    <li key={g.id} onClick={() => handleSelectGroup(g)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-all">
                      <span className="font-bold text-neutral-800">{g.name}</span>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400">Selecionar →</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <h3 className="font-serif text-2xl italic">Olá! Encontrámos o vosso grupo.</h3>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-2">Confirmem a presença de cada membro:</p>
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
                        className={`text-[10px] uppercase tracking-widest font-bold p-3 border rounded-sm outline-none transition-all ${member.status === 'confirmed' ? 'bg-black text-white' : 'bg-white'}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Vou!</option>
                        <option value="declined">Não vou</option>
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
                        className="w-full border-b border-neutral-200 bg-transparent py-3 text-xs outline-none focus:border-black transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSubmitRSVP}
                disabled={submitting || groupMembers.every(m => m.status === 'pending')}
                className="w-full bg-black text-white py-6 text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl disabled:bg-neutral-200 transition-all active:scale-[0.98]"
              >
                {submitting ? "A gravar respostas..." : "Confirmar Grupo"}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-6">
              <span className="text-6xl block mb-4">🥂</span>
              <h3 className="font-serif text-3xl uppercase tracking-tighter">Respostas Gravadas!</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto italic leading-relaxed">Obrigado por confirmarem. Mal podemos esperar por vos ver no grande dia!</p>
              <button onClick={() => setStep(0)} className="text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 pt-12 transition-all">Alterar respostas</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}