"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface Guest {
  id: string;
  name: string;
  category: string;
  gender: string;
  side: string;
  status: string;
  group_id?: string;
  dietary_notes?: string;
}

interface GuestsModuleProps {
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  invitationId: string;
  groomName: string;
  brideName: string;
}

const suggestGender = (name: string) => {
  const first = name.trim().split(' ')[0].toLowerCase();
  if (!first) return 'masculino';
  const femaleEndings = ['a', 'ia', 'is', 'iz'];
  if (femaleEndings.some(end => first.endsWith(end)) || ['maria', 'alice', 'beatriz', 'matilde'].includes(first)) return 'feminino';
  return 'masculino';
};

const COLUMN_LABELS: Record<string, string> = {
  name: 'Nome do Convidado',
  category: 'Idade',
  group_id: 'Grupo',
  side: 'Lado',
  status: 'Estado (RSVP)'
};

export default function GuestsModule({ guests, setGuests, invitationId, groomName, brideName }: GuestsModuleProps) {
  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Cálculo Avançado de Estatísticas
  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    
    const adults = guests.filter(g => g.category === 'adult').length;
    const kidsAndBabies = guests.filter(g => g.category === 'child' || g.category === 'baby').length;

    const brideSide = guests.filter(g => g.side === 'noiva').length;
    const groomSide = guests.filter(g => g.side === 'noivo').length;
    const commonSide = guests.filter(g => g.side === 'comum').length;

    return { total, confirmed, pending, declined, adults, kidsAndBabies, brideSide, groomSide, commonSide };
  }, [guests]);

  const sortedGuests = useMemo(() => {
    let items = [...guests];
    items.sort((a, b) => {
      const aV = String(a[sortConfig.key] || "").toLowerCase();
      const bV = String(b[sortConfig.key] || "").toLowerCase();
      return sortConfig.direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
    return items;
  }, [guests, sortConfig]);

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMembers = newMembers.filter(m => m.name.trim() !== "");
    if (validMembers.length === 0) {
      alert("Por favor, introduza pelo menos um nome.");
      return;
    }

    const toInsert = validMembers.map(m => ({
      invitation_id: invitationId,
      group_id: groupTag.trim() || `SOLO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: m.name,
      category: m.category,
      gender: m.gender,
      side: m.side,
      status: 'pending'
    }));

    const { data, error } = await supabase.from("guests").insert(toInsert).select();

    if (error) {
      console.error("Erro Supabase:", error);
      alert(`Erro ao gravar: ${error.message}`);
    } else if (data) {
      setGuests([...guests, ...data]);
      setGroupTag("");
      setNewMembers([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#722F37] text-sm text-gray-800 px-0 py-2 transition-colors placeholder-gray-300";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      
      {/* 01. PAINEL DE ESTATÍSTICAS (ESTILO DASHBOARD PREMIUM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cartão de Confirmações (Barra de Progresso) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <p className={labelClass}>Presenças Confirmadas</p>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-5xl font-serif text-[#722F37] leading-none">{stats.confirmed}</span>
                    <span className="text-sm font-bold text-gray-400 mb-1">/ {stats.total} total</span>
                </div>
            </div>
            <div className="mt-8">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">
                    <span>{stats.pending} Pendentes</span>
                    <span>{stats.declined} Recusaram</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#722F37] transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}></div>
                </div>
            </div>
        </div>

        {/* Cartão de Demografia */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className={labelClass}>Faixa Etária</p>
            <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-sm text-gray-600 font-medium">Adultos</span>
                    <span className="font-serif text-2xl text-gray-800">{stats.adults}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-medium">Crianças & Bebés</span>
                    <span className="font-serif text-2xl text-gray-800">{stats.kidsAndBabies}</span>
                </div>
            </div>
        </div>

        {/* Cartão de Lados */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className={labelClass}>Convidados de...</p>
            <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#722F37]">{brideName}</span>
                    <span className="font-serif text-xl text-gray-800">{stats.brideSide}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#722F37]">{groomName}</span>
                    <span className="font-serif text-xl text-gray-800">{stats.groomSide}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Em Comum</span>
                    <span className="font-serif text-xl text-gray-400">{stats.commonSide}</span>
                </div>
            </div>
        </div>

      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* 02. FORMULÁRIO DE ADIÇÃO MINIMALISTA */}
        <aside className="lg:col-span-4 sticky top-24">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-100/50">
            <h3 className="font-serif text-2xl text-[#722F37] mb-6 border-b border-gray-50 pb-4">Adicionar Convidados</h3>
            
            <form onSubmit={handleSaveGroup} className="space-y-8">
              <div>
                <label className={labelClass}>Nome do Grupo (Opcional)</label>
                <input className={inputClass} placeholder="Ex: Família Silva" value={groupTag} onChange={e => setGroupTag(e.target.value)} />
              </div>

              <div className="space-y-4">
                  {newMembers.map((m, i) => (
                    <div key={i} className="p-5 bg-[#F8F9FA] rounded-2xl relative border border-gray-100 group transition-all">
                      {newMembers.length > 1 && (
                        <button type="button" onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-white text-red-500 shadow-sm w-6 h-6 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                      )}
                      
                      <div className="space-y-4">
                          <div>
                            <input className="w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#722F37] text-sm text-gray-900 px-0 py-1 font-bold placeholder-gray-400" placeholder="Nome Completo" value={m.name} onChange={e => {
                                const u = [...newMembers]; u[i].name = e.target.value; u[i].gender = suggestGender(e.target.value); setNewMembers(u);
                            }} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <select className="bg-transparent border-0 border-b border-gray-200 text-xs font-bold text-gray-600 focus:ring-0 px-0 py-1" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                            <option value="adult">Adulto</option><option value="child">Criança</option><option value="baby">Bebé</option>
                            </select>
                            <select className="bg-transparent border-0 border-b border-gray-200 text-xs font-bold text-gray-600 focus:ring-0 px-0 py-1" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                            <option value="masculino">Masc.</option><option value="feminino">Fem.</option>
                            </select>
                          </div>
                          <select className="w-full bg-transparent border-0 border-b border-gray-200 text-[10px] uppercase tracking-widest font-bold text-[#722F37] focus:ring-0 px-0 py-1" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                            <option value="comum">Em Comum</option>
                            <option value="noiva">Convidado de {brideName}</option>
                            <option value="noivo">Convidado de {groomName}</option>
                          </select>
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="space-y-3">
                  <button type="button" onClick={() => setNewMembers([...newMembers, { name: "", category: "adult", gender: "masculino", side: "comum" }])} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-[#722F37] hover:border-[#722F37] transition-colors">
                    + Adicionar Pessoa ao Grupo
                  </button>

                  <button type="submit" className="w-full bg-[#722F37] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform">
                    Gravar na Lista
                  </button>
              </div>
            </form>
          </div>
        </aside>

        {/* 03. TABELA DE CONVIDADOS */}
        <div className="lg:col-span-8 bg-white border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8F9FA] border-b border-gray-100">
                <tr>
                    {Object.keys(COLUMN_LABELS).map((k) => (
                    <th key={k} onClick={() => setSortConfig({key: k as keyof Guest, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="p-5 text-[10px] uppercase tracking-widest font-bold text-gray-400 cursor-pointer hover:text-[#722F37] transition-colors">
                        <div className="flex items-center gap-2">
                            {COLUMN_LABELS[k]} 
                            <span className="text-[8px] opacity-50">{sortConfig.key === k ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                        </div>
                    </th>
                    ))}
                    <th className="p-5"></th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {sortedGuests.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-5 font-bold text-gray-800 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-[#FDFBF7] border border-gray-100 flex items-center justify-center text-[10px] font-bold text-[#722F37]">
                               {g.name.charAt(0).toUpperCase()}
                           </div>
                           {g.name}
                        </td>
                        <td className="p-5">
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                                {g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé'}
                            </span>
                        </td>
                        <td className="p-5 text-xs text-gray-400 italic">
                            {g.group_id?.includes('SOLO-') ? '-' : g.group_id}
                        </td>
                        <td className="p-5 text-[10px] uppercase font-bold text-gray-500">
                            {g.side === 'noivo' ? groomName : g.side === 'noiva' ? brideName : 'Comum'}
                        </td>
                        <td className="p-5">
                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                g.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' : 
                                g.status === 'declined' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                            {g.status === 'pending' ? 'Pendente' : g.status === 'confirmed' ? 'Confirmado' : 'Recusado'}
                            </span>
                        </td>
                        <td className="p-5 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingGuest(g)} className="text-[10px] font-bold uppercase tracking-widest text-[#722F37] hover:underline">Editar</button>
                            <button onClick={async () => { if(confirm('Tem a certeza que deseja remover este convidado?')){ await supabase.from('guests').delete().eq('id', g.id); setGuests(guests.filter(x => x.id !== g.id)); } }} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600">Remover</button>
                        </td>
                    </tr>
                ))}
                {sortedGuests.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-400 font-medium">A sua lista de convidados está vazia.</td>
                    </tr>
                )}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 04. MODAL DE EDIÇÃO DE LUXO */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h3 className="font-serif text-3xl text-[#722F37] mb-6">Editar Convidado</h3>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input className={inputClass} value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Categoria</label>
                    <select className={inputClass} value={editingGuest.category} onChange={e => setEditingGuest({...editingGuest, category: e.target.value})}>
                    <option value="adult">Adulto</option><option value="child">Criança</option><option value="baby">Bebé</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Estado (RSVP)</label>
                    <select className={inputClass} value={editingGuest.status} onChange={e => setEditingGuest({...editingGuest, status: e.target.value})}>
                    <option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="declined">Recusado</option>
                    </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Notas e Restrições Alimentares</label>
                <textarea className={`${inputClass} border rounded-xl p-4 bg-gray-50 h-28 resize-none`} placeholder="O convidado é alérgico a..." value={editingGuest.dietary_notes || ""} onChange={e => setEditingGuest({...editingGuest, dietary_notes: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button onClick={() => setEditingGuest(null)} className="w-1/3 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black">Cancelar</button>
                <button onClick={async () => {
                  const { error } = await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                  if (error) alert(`Erro ao atualizar: ${error.message}`);
                  else {
                    setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                    setEditingGuest(null);
                  }
                }} className="w-2/3 py-4 bg-[#722F37] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform">
                  Guardar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}