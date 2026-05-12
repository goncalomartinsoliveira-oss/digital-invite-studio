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
  canEdit: boolean; // <--- ADICIONADO
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
  gender: 'Sexo',
  category: 'Idade',
  group_id: 'Grupo',
  side: 'Lado',
  status: 'Estado (RSVP)'
};

export default function GuestsModule({ guests, setGuests, invitationId, groomName, brideName, canEdit }: GuestsModuleProps) {
  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  const [customSides, setCustomSides] = useState<string[]>(["comum", "noiva", "noivo"]);
  const [newSideLabel, setNewSideLabel] = useState("");

  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    const adults = guests.filter(g => g.category === 'adult').length;
    const kidsAndBabies = guests.filter(g => g.category === 'child' || g.category === 'baby').length;
    const sidesCounts = guests.reduce((acc, guest) => {
      acc[guest.side] = (acc[guest.side] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, confirmed, pending, declined, adults, kidsAndBabies, sidesCounts };
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
    if (!canEdit) return; // Proteção
    const validMembers = newMembers.filter(m => m.name.trim() !== "");
    if (validMembers.length === 0) return;

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
    if (!error && data) {
      setGuests([...guests, ...data]);
      setGroupTag("");
      setNewMembers([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
    }
  };

  const handleAddSide = () => {
    if (!canEdit) return;
    const formatted = newSideLabel.trim().toLowerCase();
    if (formatted && !customSides.includes(formatted)) {
      setCustomSides([...customSides, formatted]);
      setNewSideLabel("");
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-[#630100] text-sm text-gray-800 px-0 py-2 transition-colors placeholder-gray-300 font-montserrat";
  const labelClass = "text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-montserrat";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20 px-4 md:px-0">
      
      {/* 01. PAINEL DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-montserrat">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <p className={labelClass}>Presenças Confirmadas</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-5xl font-serif text-[#630100] leading-none font-regular">{stats.confirmed}</span>
              <span className="text-sm font-bold text-gray-400 mb-1">/ {stats.total} total</span>
            </div>
          </div>
          <div className="mt-8">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-[#630100] transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <p className={labelClass}>Faixa Etária</p>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-sm text-gray-600 font-medium">Adultos</span>
              <span className="font-serif text-2xl text-gray-800 font-regular">{stats.adults}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Crianças & Bebés</span>
              <span className="font-serif text-2xl text-gray-800 font-regular">{stats.kidsAndBabies}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between font-montserrat">
          <p className={labelClass}>Convidados de...</p>
          <div className="space-y-2 mt-4 max-h-32 overflow-y-auto custom-scrollbar">
            {customSides.map(side => (
              <div key={side} className="flex justify-between items-center border-b border-gray-50 pb-1">
                <span className="text-[10px] font-bold uppercase text-[#630100]">
                  {side === 'noiva' ? brideName : side === 'noivo' ? groomName : side}
                </span>
                <span className="font-serif text-xl font-regular">{stats.sidesCounts[side] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* 02. FORMULÁRIO DE ADIÇÃO (BLOQUEADO SE VIEW-ONLY) */}
        <aside className="w-full lg:col-span-4 lg:sticky lg:top-24 order-first lg:order-none">
          <div className={`bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg ${!canEdit ? 'opacity-70 pointer-events-none' : ''}`}>
            <h3 className="font-serif text-2xl text-[#630100] mb-6 border-b border-gray-50 pb-4 font-regular italic">Adicionar Convidados</h3>
            
            <form onSubmit={handleSaveGroup} className="space-y-6 font-montserrat">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {newMembers.map((m, i) => (
                  <div key={i} className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-100 relative space-y-4">
                    {newMembers.length > 1 && (
                      <button type="button" onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-white text-[#630100] shadow-sm w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold">✕</button>
                    )}
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input className="w-full bg-transparent border-0 border-b border-gray-200 text-sm font-bold py-1 focus:ring-0 focus:border-[#630100]" placeholder="Nome Completo" value={m.name} onChange={e => {
                        const u = [...newMembers]; u[i].name = e.target.value; u[i].gender = suggestGender(e.target.value); setNewMembers(u);
                      }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Idade</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                          <option value="adult">Adulto</option>
                          <option value="child">Criança</option>
                          <option value="baby">Bebé</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Sexo</label>
                        <select className="w-full bg-transparent border-0 border-b border-gray-200 text-xs font-medium focus:ring-0" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Lado / Tag</label>
                      <select className="w-full bg-transparent border-0 border-b border-gray-200 text-[10px] font-semibold uppercase focus:ring-0" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                        {customSides.map(s => <option key={s} value={s}>{s === 'noiva' ? brideName : s === 'noivo' ? groomName : s.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-50">
                <label className={labelClass}>Nome do Grupo Familiar</label>
                <input className={inputClass} placeholder="Ex: Família Silva" value={groupTag} onChange={e => setGroupTag(e.target.value)} />
              </div>

              <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#EFDFBB]/50 space-y-3">
                <label className={labelClass}>Gerir Etiquetas (Lados)</label>
                <div className="flex gap-2 mb-2">
                  <input className="flex-grow bg-transparent border-0 border-b border-gray-200 text-xs py-1 focus:ring-0 focus:border-[#630100]" placeholder="Ex: Trabalho" value={newSideLabel} onChange={(e) => setNewSideLabel(e.target.value)} />
                  <button type="button" onClick={handleAddSide} className="text-[10px] font-semibold text-[#630100] uppercase">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {customSides.map(s => (
                        <span key={s} className="bg-white border border-[#EFDFBB]/50 text-[8px] font-bold uppercase px-2 py-1 rounded-md text-[#630100]">
                            {s}
                        </span>
                    ))}
                </div>
              </div>
              
              <button disabled={!canEdit} type="submit" className="w-full bg-[#630100] text-[#EFDFBB] py-4 rounded-xl text-[10px] font-semibold uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50">Gravar na Lista</button>
            </form>
          </div>
        </aside>

        {/* 03. TABELA DE CONVIDADOS */}
        <div className="w-full lg:col-span-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden font-montserrat">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8F9FA] border-b border-gray-100">
                <tr>
                  {Object.keys(COLUMN_LABELS).map((k) => (
                    <th key={k} onClick={() => setSortConfig({key: k as keyof Guest, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="p-5 text-[10px] uppercase font-bold text-gray-400 cursor-pointer hover:text-[#630100]">
                      <div className="flex items-center gap-2">
                        {COLUMN_LABELS[k]}
                        {sortConfig.key === k && <span className="text-[8px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                  ))}
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedGuests.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-5 font-bold text-gray-800">{g.name}</td>
                    <td className="p-5 text-[10px] uppercase font-medium text-gray-500">{g.gender === 'masculino' ? 'Masc.' : 'Fem.'}</td>
                    <td className="p-5 text-[10px] uppercase font-medium text-gray-500">
                      {g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé'}
                    </td>
                    <td className="p-5 text-xs text-gray-400">{g.group_id?.includes('SOLO-') ? '-' : g.group_id}</td>
                    <td className="p-5 text-[10px] uppercase font-bold text-[#630100]">
                      {g.side === 'noiva' ? brideName : g.side === 'noivo' ? groomName : (g.side ? g.side.toUpperCase() : '-')}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${g.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' : g.status === 'declined' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                        {g.status === 'confirmed' ? 'Confirmado' : g.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-5 text-right opacity-0 group-hover:opacity-100">
                      {canEdit && ( // SÓ APARECE O BOTÃO DE EDITAR SE TIVER PERMISSÃO
                        <button onClick={() => setEditingGuest(g)} className="text-[10px] font-semibold uppercase text-[#630100] mr-4 hover:underline">Editar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 04. MODAL DE EDIÇÃO COMPLETA */}
      {editingGuest && canEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300 font-montserrat">
            <h3 className="font-serif text-3xl text-[#630100] mb-8 font-regular italic">Editar Convidado</h3>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input className={inputClass} value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Categoria (Idade)</label>
                  <select className={inputClass} value={editingGuest.category} onChange={e => setEditingGuest({...editingGuest, category: e.target.value})}>
                    <option value="adult">Adulto</option>
                    <option value="child">Criança</option>
                    <option value="baby">Bebé</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sexo</label>
                  <select className={inputClass} value={editingGuest.gender} onChange={e => setEditingGuest({...editingGuest, gender: e.target.value})}>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Grupo Familiar</label>
                  <input className={inputClass} value={editingGuest.group_id} onChange={e => setEditingGuest({...editingGuest, group_id: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Lado / Etiqueta</label>
                  <select className={inputClass} value={editingGuest.side} onChange={e => setEditingGuest({...editingGuest, side: e.target.value})}>
                    {customSides.map(s => <option key={s} value={s}>{s === 'noiva' ? brideName : s === 'noivo' ? groomName : s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Estado (RSVP)</label>
                <select className={inputClass} value={editingGuest.status} onChange={e => setEditingGuest({...editingGuest, status: e.target.value})}>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Recusado</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button onClick={() => setEditingGuest(null)} className="w-1/3 text-[10px] font-semibold uppercase text-gray-500">Cancelar</button>
                <button onClick={async () => {
                  await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                  setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                  setEditingGuest(null);
                }} className="w-2/3 py-4 bg-[#630100] text-[#EFDFBB] rounded-xl text-[10px] font-semibold uppercase shadow-lg transition-transform active:scale-95">Guardar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}