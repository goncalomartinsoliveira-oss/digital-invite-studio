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
  // Passos: 0: Busca, 1: Formulário de Grupo, 2: Sucesso, 3: Formulário de Pedido (Não encontro nome), 4: Sucesso do Pedido
  const [step, setStep] = useState(0); 
  const [submitting, setSubmitting] = useState(false);

  // Estados para o novo Pedido de Convidado
  const [requestName, setRequestName] = useState("");
  const [requestContact, setRequestContact] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // Tags disponíveis para os convidados escolherem (Agora inicia 100% vazio)
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 1. Busca Dinâmica de Nomes (Insensível a Acentos)
  useEffect(() => {
    if (searchTerm.length < 3) {
      setFoundGuests([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      
      // Busca todos os convidados válidos e faz o filtro inteligentemente no lado do cliente para contornar os acentos
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invitationId)
        .neq('status', 'requested');

      if (!error && data) {
        // Função para remover acentos e passar para minúsculas
        const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const searchNormalized = normalizeStr(searchTerm);
        
        const filtered = data.filter((g: any) => 
          normalizeStr(g.name).includes(searchNormalized)
        ).slice(0, 5); // Mantém o limite visual de 5 resultados
        
        setFoundGuests(filtered);
      }
      setLoadingSearch(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, invitationId]);

  // 1.1 Extrair APENAS as Tags que realmente existem na base de dados (Tabela Invitations)
  useEffect(() => {
    const fetchInvitationTags = async () => {
      if (!invitationId) return;
      const { data, error } = await supabase
        .from('invitations')
        .select('dietary_tags')
        .eq('id', invitationId)
        .single();
        
      if (!error && data && data.dietary_tags) {
        setAvailableTags(data.dietary_tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      }
    };
    fetchInvitationTags();
  }, [invitationId]);

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
          dietary_notes: member.status === 'confirmed' ? member.dietary_notes : null,
          notes: member.status === 'confirmed' ? member.notes : null // Grava o texto livre na nova coluna notes
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

  // 4. Gravar Pedido de Novo Convidado (Status: 'requested')
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;

    setSubmitting(true);
    
    // Agora gravamos o contacto e a mensagem na nova coluna "notes"
    const combinedNotes = `Contacto: ${requestContact} | Mensagem: ${requestMessage}`;

    const { error } = await supabase
      .from('guests')
      .insert([{
        invitation_id: invitationId,
        name: requestName,
        category: 'adult',
        gender: 'masculino',
        side: 'comum',
        status: 'requested',
        dietary_notes: null, // Deixamos as restrições vazias no pedido
        notes: combinedNotes, // Vai direto para as observações
        group_id: `REQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      }]);

    if (!error) {
      setStep(4);
      setRequestName("");
      setRequestContact("");
      setRequestMessage("");
    } else {
      alert("Ocorreu um erro ao enviar o pedido. Tente novamente.");
    }
    
    setSubmitting(false);
  };

  return (
    <section id="rsvp" className="py-24 px-6 bg-white border-t border-neutral-100 font-sans">
      <div className="max-w-xl mx-auto space-y-12">
        <header className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block">RSVP</span>
          {/* Ajuste do tamanho do título de text-5xl para text-4xl */}
          <h2 className="font-serif text-4xl uppercase tracking-tighter">Confirmar Presença</h2>
          <div className="h-px w-12 bg-neutral-200 mx-auto mt-6"></div>
        </header>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <p className="text-sm text-center text-neutral-600 italic">Pesquise pelo seu nome para confirmar a presença no evento.</p>
              <div>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escreva o seu nome (mínimo 3 letras)..."
                    className="w-full border border-neutral-200 p-5 rounded-sm text-sm outline-none focus:border-black transition-colors bg-neutral-50"
                  />
                  {loadingSearch && <div className="absolute right-5 top-5 text-xs text-neutral-400 animate-pulse">A procurar...</div>}
                </div>
                {/* Mensagem visual indicando a necessidade de 3 caracteres */}
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <p className="text-[10px] text-neutral-400 mt-2 px-1 text-center italic">
                    Insira pelo menos 3 caracteres para iniciar a pesquisa.
                  </p>
                )}
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

              {/* Botão para não encontrou o nome */}
              <div className="text-center pt-8">
                <button 
                  onClick={() => setStep(3)} 
                  className="text-xs text-neutral-400 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-200"
                >
                  Não encontra o seu nome na lista?
                </button>
              </div>
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
                      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pt-4 border-t border-neutral-200/50">
                        {/* Selector de Restrições por Tags */}
                        {availableTags.length > 0 && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-2">Restrições Alimentares</p>
                            <div className="flex flex-wrap gap-2">
                              {availableTags.map(tag => {
                                const currentTags = member.dietary_notes ? member.dietary_notes.split(',').filter(Boolean) : [];
                                const isSelected = currentTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      let newTags = [...currentTags];
                                      if (isSelected) newTags = newTags.filter(t => t !== tag);
                                      else newTags.push(tag);
                                      const updated = [...groupMembers];
                                      updated[idx].dietary_notes = newTags.join(',');
                                      setGroupMembers(updated);
                                    }}
                                    className={`px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase transition-colors border ${isSelected ? 'bg-black border-black text-white' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Campo dedicado a Notas / Observações */}
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">Observações Adicionais</p>
                          <input 
                            type="text"
                            placeholder="Ex: Precisa de cadeira de bebé..."
                            value={member.notes || ""}
                            onChange={(e) => {
                              const updated = [...groupMembers];
                              updated[idx].notes = e.target.value;
                              setGroupMembers(updated);
                            }}
                            className="w-full border-b border-neutral-200 bg-transparent py-2 text-xs outline-none focus:border-black transition-colors italic placeholder:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(0)}
                  className="w-1/3 border border-neutral-200 text-neutral-500 py-6 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-50 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleSubmitRSVP}
                  disabled={submitting || groupMembers.every(m => m.status === 'pending')}
                  className="w-2/3 bg-black text-white py-6 text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl disabled:bg-neutral-200 transition-all active:scale-[0.98]"
                >
                  {submitting ? "A gravar..." : "Confirmar"}
                </button>
              </div>
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

          {/* PASSO 3 - FORMULÁRIO DE PEDIDO DE ACESSO */}
          {step === 3 && (
            <motion.div key="request-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center border-b border-neutral-100 pb-6">
                <h3 className="font-serif text-2xl italic">Não encontrou o seu nome?</h3>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-2 leading-relaxed">Deixe os seus dados abaixo.<br/>Os noivos serão notificados do seu pedido.</p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">Nome Completo</label>
                  <input 
                    type="text" required
                    value={requestName} onChange={(e) => setRequestName(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">Telefone ou Email</label>
                  <input 
                    type="text" required
                    value={requestContact} onChange={(e) => setRequestContact(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1 block">Mensagem Breve (Opcional)</label>
                  <input 
                    type="text" placeholder="Ex: Sou acompanhante da Joana..."
                    value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full border-b border-neutral-200 bg-transparent py-3 text-sm outline-none focus:border-black transition-colors italic placeholder:text-neutral-300"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" onClick={() => setStep(0)}
                    className="w-1/3 border border-neutral-200 text-neutral-500 py-5 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" disabled={submitting || !requestName.trim()}
                    className="w-2/3 bg-black text-white py-5 text-[9px] uppercase tracking-[0.2em] font-bold shadow-xl disabled:bg-neutral-200 transition-all active:scale-[0.98]"
                  >
                    {submitting ? "A enviar..." : "Enviar Pedido"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* PASSO 4 - SUCESSO DO PEDIDO */}
          {step === 4 && (
            <motion.div key="request-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-6">
              <span className="text-6xl block mb-4">💌</span>
              <h3 className="font-serif text-3xl uppercase tracking-tighter">Pedido Enviado</h3>
              <p className="text-sm text-neutral-500 max-w-xs mx-auto italic leading-relaxed">A sua informação foi enviada para os noivos com sucesso. Em breve receberá uma atualização.</p>
              <button onClick={() => setStep(0)} className="text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 pt-12 transition-all">Voltar ao Início</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}