// components/dashboard/GuestsModule.tsx
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
  name: 'Nome',
  gender: 'Gen',
  category: 'Categoria',
  group_id: 'Grupo',
  side: 'Lado',
  status: 'Estado'
};

export default function GuestsModule({ guests, setGuests, invitationId, groomName, brideName }: GuestsModuleProps) {
  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const stats = useMemo(() => {
    const calc = (key: keyof Guest, val: string) => ({
      total: guests.filter((g: Guest) => g[key] === val).length,
      confirmed: guests.filter((g: Guest) => g[key] === val && g.status === 'confirmed').length
    });
    return [
      { label: "Total", val: { total: guests.length, confirmed: guests.filter(g => g.status === 'confirmed').length }, dark: true },
      { label: "Adultos", val: calc('category', 'adult') },
      { label: "Crianças", val: calc('category', 'child') },
      { label: "Bebés", val: calc('category', 'baby') },
      { label: "Masc.", val: calc('gender', 'masculino') },
      { label: "Fem.", val: calc('gender', 'feminino') },
      { label: `Lado ${groomName}`, val: calc('side', 'noivo') },
      { label: `Lado ${brideName}`, val: calc('side', 'noiva') },
    ];
  }, [guests, groomName, brideName]);

  const sortedGuests = useMemo(() => {
    let items = [...guests];
    items.sort((a, b) => {
      const aV = String(a[sortConfig.key] || "").toLowerCase();
      const bV = String(b[sortConfig.key] || "").toLowerCase();
      return sortConfig.direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
    return items;
  }, [guests, sortConfig]);

  // CORREÇÃO: BOTÃO ADICIONAR COM TRATAMENTO DE ERROS
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
      alert("Convidados adicionados com sucesso!");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${s.dark ? 'bg-black text-white' : 'bg-white'} p-4 border shadow-sm rounded-sm text-center`}>
            <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold mb-1">{s.label}</p>
            <p className="text-lg font-serif">{s.val.confirmed}<span className="text-xs opacity-30 mx-1">/</span>{s.val.total}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10 text-left">
        {/* Formulário */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-6 border shadow-sm sticky top-24">
            <h3 className="font-serif text-lg border-b pb-4 mb-4 uppercase tracking-tighter">Registar</h3>
            
            <form onSubmit={handleSaveGroup} className="space-y-6">
              <input className="w-full border-b p-2 text-sm outline-none focus:border-black" placeholder="Grupo (ex: Família Silva)" value={groupTag} onChange={e => setGroupTag(e.target.value)} />

              {newMembers.map((m, i) => (
                <div key={i} className="p-4 bg-neutral-50 border border-dashed relative space-y-4 rounded-sm">
                  {newMembers.length > 1 && (
                    <button type="button" onClick={() => setNewMembers(newMembers.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">✕</button>
                  )}
                  
                  <input className="w-full border p-2 text-xs outline-none bg-white" placeholder="Nome" value={m.name} onChange={e => {
                    const u = [...newMembers]; u[i].name = e.target.value; u[i].gender = suggestGender(e.target.value); setNewMembers(u);
                  }} />

                  <div className="grid grid-cols-2 gap-2">
                    <select className="border text-[9px] p-2 font-bold bg-white" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                      <option value="adult">ADULTO</option><option value="child">CRIANÇA</option><option value="baby">BEBÉ</option>
                    </select>
                    <select className="border text-[9px] p-2 font-bold bg-white" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                      <option value="masculino">MASC</option><option value="feminino">FEM</option>
                    </select>
                  </div>
                  <select className="w-full border text-[9px] p-2 font-bold bg-white uppercase" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                    <option value="comum">AMIGOS EM COMUM</option>
                    <option value="noivo">LADO DO {groomName}</option>
                    <option value="noiva">LADO DA {brideName}</option>
                  </select>
                </div>
              ))}
              
              <button type="button" onClick={() => setNewMembers([...newMembers, { name: "", category: "adult", gender: "masculino", side: "comum" }])} className="w-full py-2 border-2 border-dashed border-neutral-200 text-[9px] uppercase font-bold text-neutral-400 hover:text-black hover:border-black transition-all">
                + Pessoa
              </button>

              <button type="submit" className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em]">
                Gravar na Lista
              </button>
            </form>
          </div>
        </aside>

        {/* Tabela */}
        <div className="lg:col-span-9 bg-white border shadow-sm overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-neutral-50 border-b">
              <tr>
                {Object.keys(COLUMN_LABELS).map((k) => (
                  <th key={k} onClick={() => setSortConfig({key: k as keyof Guest, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="p-4 uppercase font-bold opacity-50 cursor-pointer">
                    {COLUMN_LABELS[k]} {sortConfig.key === k ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
                  </th>
                ))}
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedGuests.map(g => (
                <tr key={g.id} className="hover:bg-neutral-50">
                  <td className="p-4 font-bold">{g.name}</td>
                  <td className="p-4 text-center opacity-40 font-bold">{g.gender === 'feminino' ? 'F' : 'M'}</td>
                  <td className="p-4 font-bold uppercase">{g.category === 'adult' ? 'Adulto' : g.category === 'child' ? 'Criança' : 'Bebé'}</td>
                  <td className="p-4 opacity-40 italic">{g.group_id?.includes('SOLO-') ? '-' : g.group_id}</td>
                  <td className="p-4 uppercase font-bold text-[8px]">{g.side === 'noivo' ? groomName : g.side === 'noiva' ? brideName : 'Amigos'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${g.status === 'confirmed' ? 'bg-green-100 text-green-700' : g.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {g.status === 'pending' ? 'Pendente' : g.status === 'confirmed' ? 'Confirmado' : 'Recusado'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => setEditingGuest(g)} className="text-neutral-400 hover:text-black font-bold uppercase text-[9px]">Edit</button>
                    <button onClick={async () => { if(confirm('Apagar?')){ await supabase.from('guests').delete().eq('id', g.id); setGuests(guests.filter(x => x.id !== g.id)); } }} className="text-red-200 hover:text-red-600">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-lg p-10 shadow-2xl space-y-4">
            <h3 className="font-serif text-2xl border-b pb-4">Editar Ficha</h3>
            <div className="space-y-4">
              <input className="w-full border p-3 text-sm" value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="border p-3 text-xs font-bold uppercase" value={editingGuest.category} onChange={e => setEditingGuest({...editingGuest, category: e.target.value})}>
                  <option value="adult">Adulto</option><option value="child">Criança</option><option value="baby">Bebé</option>
                </select>
                <select className="border p-3 text-xs font-bold uppercase" value={editingGuest.status} onChange={e => setEditingGuest({...editingGuest, status: e.target.value})}>
                  <option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="declined">Recusado</option>
                </select>
              </div>
              <textarea className="w-full border p-3 text-sm h-24 outline-none" placeholder="Notas/Dieta" value={editingGuest.dietary_notes || ""} onChange={e => setEditingGuest({...editingGuest, dietary_notes: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingGuest(null)} className="flex-1 py-4 border text-[10px] font-bold uppercase">Sair</button>
                <button onClick={async () => {
                  const { error } = await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                  if (error) alert(`Erro ao atualizar: ${error.message}`);
                  else {
                    setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                    setEditingGuest(null);
                    alert("Atualizado com sucesso!");
                  }
                }} className="flex-1 py-4 bg-black text-white text-[10px] font-bold uppercase shadow-lg">Gravar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}