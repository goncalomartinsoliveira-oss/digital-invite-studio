"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AVAILABLE_TEMPLATES = [
  { id: 'luxury-01', name: 'Classic Luxury', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: 'minimal-01', name: 'Modern Minimal', preview: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400' },
];

const suggestGender = (name: string) => {
  const first = name.trim().split(' ')[0].toLowerCase();
  if (!first) return 'masculino';
  const femaleEndings = ['a', 'ia', 'is', 'iz'];
  if (femaleEndings.some(end => first.endsWith(end)) || first === 'maria' || first === 'alice' || first === 'beatriz') return 'feminino';
  return 'masculino';
};

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'design' | 'guests'>('design');
  const [formData, setFormData] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const [groupTag, setGroupTag] = useState("");
  const [newMembers, setNewMembers] = useState([{ name: "", category: "adult", gender: "masculino", side: "comum" }]);
  const [editingGuest, setEditingGuest] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${params.locale}/login`); return; }

      const { data: invite } = await supabase.from("invitations").select("*").eq("slug", params.slug).single();
      if (invite) {
        setFormData(invite);
        const { data: guestsData } = await supabase.from("guests").select("*").eq("invitation_id", invite.id);
        setGuests(guestsData || []);
      }
      setLoading(false);
    }
    loadData();
  }, [params.slug, params.locale, router]);

  const sortedGuests = useMemo(() => {
    let items = [...guests];
    if (sortConfig) {
      items.sort((a, b) => {
        const aV = (a[sortConfig.key] || "").toString().toLowerCase();
        const bV = (b[sortConfig.key] || "").toString().toLowerCase();
        if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [guests, sortConfig]);

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
    alert("Site atualizado com sucesso!");
    setSaving(false);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMembers.some(m => !m.name)) return alert("Introduza pelo menos um nome.");
    const guestsToInsert = newMembers.map(m => ({
      invitation_id: formData.id,
      group_id: groupTag.trim() || `Solo-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: m.name,
      category: m.category,
      gender: m.gender,
      side: m.side,
      status: 'pending'
    }));
    const { data, error } = await supabase.from("guests").insert(guestsToInsert).select();
    if (!error) { setGuests([...guests, ...data]); setGroupTag(""); setNewMembers([{ name: "", category: "adult", gender: "masculino", side: "comum" }]); }
  };

  if (loading || !formData) return <div className="p-20 text-center font-serif italic">A preparar estúdio...</div>;

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-neutral-800 text-left">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <h1 className="font-serif text-lg uppercase tracking-widest">WEDDING STUDIO</h1>
        <button onClick={() => router.push(`/${params.locale}/invite/${params.slug}`)} className="bg-black text-white px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Ver Site</button>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-12">
        <div className="flex gap-10 border-b mb-10">
          <button onClick={() => setActiveTab('design')} className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'design' ? 'border-b-2 border-black' : 'opacity-30'}`}>01. Design e Conteúdo</button>
          <button onClick={() => setActiveTab('guests')} className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'guests' ? 'border-b-2 border-black' : 'opacity-30'}`}>02. Lista de Convidados</button>
        </div>

        {activeTab === 'design' && (
          <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
            {/* COLUNA ESQUERDA: TEMPLATE E NOMES */}
            <div className="space-y-8">
              <section className="bg-white p-8 border shadow-sm space-y-6">
                <h3 className="font-serif text-xl border-b pb-4">Escolha o Template</h3>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_TEMPLATES.map(t => (
                    <div key={t.id} onClick={() => setFormData({...formData, template_id: t.id})} className={`cursor-pointer p-1 border-2 transition-all ${formData.template_id === t.id ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                      <img src={t.preview} className="w-full h-24 object-cover" />
                      <p className="text-[9px] uppercase text-center mt-2 tracking-widest">{t.name}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-8 border shadow-sm space-y-6">
                <h3 className="font-serif text-xl border-b pb-4">Dados do Casal</h3>
                <div className="grid gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest opacity-40">Noivo</label>
                    <input className="w-full border-b py-2 outline-none focus:border-black" value={formData.groom_name} onChange={e => setFormData({...formData, groom_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest opacity-40">Noiva</label>
                    <input className="w-full border-b py-2 outline-none focus:border-black" value={formData.bride_name} onChange={e => setFormData({...formData, bride_name: e.target.value})} />
                  </div>
                </div>
              </section>
            </div>

            {/* COLUNA DIREITA: IMAGEM E SAVE */}
            <div className="space-y-8">
              <section className="bg-white p-8 border shadow-sm space-y-6 text-left">
                <h3 className="font-serif text-xl border-b pb-4">Foto de Capa</h3>
                <div className="aspect-video bg-neutral-100 relative group overflow-hidden border">
                  {formData.main_image_url ? (
                    <img src={formData.main_image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase opacity-30">Sem Foto Selecionada</div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-[9px] uppercase font-bold transition-all">
                    Carregar Nova Foto
                    <input type="file" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                <p className="text-[9px] opacity-40 uppercase">Recomendado: Imagens horizontais (16:9)</p>
              </section>

              <button onClick={handleSaveDesign} disabled={saving} className="w-full bg-black text-white py-5 text-[10px] uppercase tracking-[0.4em] font-bold shadow-xl active:scale-[0.98] transition-all">
                {saving ? "A Guardar..." : "Publicar Alterações no Site"}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="grid lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
            {/* FORMULÁRIO DE CONVIDADOS */}
            <aside className="lg:col-span-3 space-y-6 h-fit sticky top-28">
              <section className="bg-white p-6 border shadow-sm space-y-6">
                <h3 className="font-serif text-lg border-b pb-4">Novo Convidado</h3>
                <form onSubmit={handleSaveGroup} className="space-y-4">
                  <input className="w-full border p-2 text-sm outline-none focus:border-black" placeholder="Grupo (Facultativo)" value={groupTag} onChange={e => setGroupTag(e.target.value)} />
                  {newMembers.map((m, i) => (
                    <div key={i} className="p-4 bg-neutral-50 border border-dashed space-y-3">
                      <input className="w-full border p-2 text-xs outline-none focus:border-black" placeholder="Nome" value={m.name} onChange={e => {
                        const updated = [...newMembers];
                        updated[i].name = e.target.value;
                        updated[i].gender = suggestGender(e.target.value);
                        setNewMembers(updated);
                      }} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="border text-[9px] p-2 font-bold uppercase" value={m.category} onChange={e => { const u = [...newMembers]; u[i].category = e.target.value; setNewMembers(u); }}>
                          <option value="adult">Adulto</option>
                          <option value="child">Criança</option>
                          <option value="baby">Bebé</option>
                        </select>
                        <select className="border text-[9px] p-2 font-bold uppercase" value={m.gender} onChange={e => { const u = [...newMembers]; u[i].gender = e.target.value; setNewMembers(u); }}>
                          <option value="masculino">Masc</option>
                          <option value="feminino">Fem</option>
                        </select>
                      </div>
                      <select className="w-full border text-[9px] p-2 font-bold uppercase" value={m.side} onChange={e => { const u = [...newMembers]; u[i].side = e.target.value; setNewMembers(u); }}>
                        <option value="comum">Amigos em Comum</option>
                        <option value="noivo">Convidado de {formData.groom_name}</option>
                        <option value="noiva">Convidado de {formData.bride_name}</option>
                      </select>
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewMembers([...newMembers, { name: "", category: "adult", gender: "masculino", side: "comum" }])} className="text-[9px] uppercase tracking-widest text-neutral-400">+ Pessoa</button>
                  <button className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase">Adicionar à Lista</button>
                </form>
              </section>
            </aside>

            {/* TABELA DE CONVIDADOS */}
            <section className="lg:col-span-9 bg-white border shadow-sm overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th onClick={() => setSortConfig({key: 'name', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})} className="p-4 uppercase font-bold opacity-50 cursor-pointer">Nome ⇅</th>
                    <th className="p-4 uppercase font-bold opacity-50 text-center">Gen</th>
                    <th onClick={() => setSortConfig({key: 'category', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})} className="p-4 uppercase font-bold opacity-50 cursor-pointer text-center">Cat ⇅</th>
                    <th onClick={() => setSortConfig({key: 'group_id', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})} className="p-4 uppercase font-bold opacity-50 cursor-pointer">Grupo ⇅</th>
                    <th onClick={() => setSortConfig({key: 'side', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})} className="p-4 uppercase font-bold opacity-50 cursor-pointer">Lado ⇅</th>
                    <th className="p-4 uppercase font-bold opacity-50">Obs</th>
                    <th className="p-4 uppercase font-bold opacity-50 text-center">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sortedGuests.map(g => (
                    <tr key={g.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-bold">{g.name}</td>
                      <td className="p-4 text-center opacity-40 font-bold">{g.gender === 'feminino' ? 'F' : 'M'}</td>
                      <td className="p-4 text-center font-bold">
                        {g.category === 'adult' ? 'ADULTO' : g.category === 'child' ? 'CRIANÇA' : 'BEBÉ'}
                      </td>
                      <td className="p-4 opacity-40 italic">{g.group_id?.includes('Solo-') ? '-' : g.group_id}</td>
                      <td className="p-4 font-bold text-[8px] uppercase">
                        {g.side === 'noivo' ? formData.groom_name : g.side === 'noiva' ? formData.bride_name : 'Amigos'}
                      </td>
                      <td className="p-4 opacity-50 italic max-w-[100px] truncate">{g.dietary_notes || "-"}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${g.status === 'confirmed' ? 'bg-green-100 text-green-700' : g.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>{g.status}</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => setEditingGuest(g)} className="text-neutral-400 hover:text-black font-bold uppercase text-[9px]">Edit</button>
                        <button onClick={async () => { if(confirm('Apagar?')){ await supabase.from('guests').delete().eq('id', g.id); setGuests(guests.filter(x => x.id !== g.id)); } }} className="text-red-200 hover:text-red-600 font-bold">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </main>

      {/* MODAL EDIÇÃO */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-md p-8 shadow-2xl space-y-6">
            <h3 className="font-serif text-2xl border-b pb-4">Editar Convidado</h3>
            <div className="space-y-4">
              <input className="w-full border p-3 text-sm outline-none focus:border-black" value={editingGuest.name} onChange={e => setEditingGuest({...editingGuest, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="border p-3 text-xs uppercase font-bold" value={editingGuest.category} onChange={e => setEditingGuest({...editingGuest, category: e.target.value})}>
                  <option value="adult">Adulto</option>
                  <option value="child">Criança</option>
                  <option value="baby">Bebé</option>
                </select>
                <select className="border p-3 text-xs uppercase font-bold" value={editingGuest.gender} onChange={e => setEditingGuest({...editingGuest, gender: e.target.value})}>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
              <textarea className="w-full border p-3 text-sm h-24 outline-none focus:border-black" placeholder="Restrições Alimentares" value={editingGuest.dietary_notes || ""} onChange={e => setEditingGuest({...editingGuest, dietary_notes: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingGuest(null)} className="flex-1 py-3 border text-[10px] uppercase font-bold hover:bg-neutral-50">Sair</button>
                <button 
                  onClick={async () => {
                    await supabase.from("guests").update(editingGuest).eq("id", editingGuest.id);
                    setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g));
                    setEditingGuest(null);
                  }}
                  className="flex-1 py-3 bg-black text-white text-[10px] uppercase font-bold shadow-lg"
                >Gravar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}