"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { UserPlus, Trash2, ShieldCheck, Mail, Loader2, LogOut, Key, User } from "lucide-react";

interface AccountModuleProps {
  userEmail: string;
  invitationId: string;
}

export default function AccountModule({ userEmail, invitationId }: AccountModuleProps) {
  const router = useRouter();
  const params = useParams();

  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState("editor"); // NOVO: Estado para a permissão
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchCollaborators();
  }, [invitationId]);

  async function fetchCollaborators() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invitation_collaborators")
      .select("*")
      .eq("invitation_id", invitationId);

    if (!error) setCollaborators(data || []);
    setLoading(false);
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) return;
    if (collaboratorEmail.toLowerCase() === userEmail.toLowerCase()) {
      alert("Você já é o dono deste projeto.");
      return;
    }

    setAdding(true);
    const { error } = await supabase
      .from("invitation_collaborators")
      .insert([{ 
        invitation_id: invitationId, 
        user_email: collaboratorEmail.toLowerCase().trim(), 
        role: collaboratorRole // NOVO: Envia a permissão selecionada
      }]);

    if (error) {
      alert("Erro ao adicionar: " + error.message);
    } else { 
      setCollaboratorEmail(""); 
      fetchCollaborators(); 
    }
    setAdding(false);
  };

  const removeCollaborator = async (id: string) => {
    if (!confirm("Remover o acesso deste utilizador?")) return;
    const { error } = await supabase.from("invitation_collaborators").delete().eq("id", id);
    if (!error) fetchCollaborators();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("Erro: " + error.message);
    else { alert("Password atualizada com sucesso!"); setNewPassword(""); }
    setSavingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${params.locale}`);
  };

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block";
  const inputClass = "w-full bg-[#FDFBF7] border border-gray-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#630100]/20 focus:border-[#630100] outline-none transition-all font-montserrat";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 font-montserrat pb-20">
      
      {/* 01. PERFIL & LOGOUT */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#630100]/5 rounded-2xl flex items-center justify-center text-[#630100]">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#332E2B]">A Minha Conta</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gestão de Perfil</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-500 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            <LogOut size={14} /> Terminar Sessão
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className={labelClass}>Email de Acesso</label>
              <input type="text" disabled className={inputClass + " opacity-60 cursor-not-allowed"} value={userEmail} />
           </div>
           <form onSubmit={handleUpdatePassword} className="relative">
              <label className={labelClass}>Nova Password</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="Min. 6 caracteres"
                  className={inputClass} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={savingPass || newPassword.length < 6}
                  className="bg-[#332E2B] text-white px-5 rounded-2xl hover:bg-black disabled:opacity-30 transition-all"
                >
                  {savingPass ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                </button>
              </div>
           </form>
        </div>
      </section>

      {/* 02. PROPRIEDADE DO EVENTO */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#630100]/5 rounded-2xl flex items-center justify-center text-[#630100]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#332E2B]">Propriedade do Evento</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Administração do Projeto</p>
          </div>
        </div>

        <div className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#EFDFBB]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-green-500">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Dono Original</p>
              <p className="text-sm font-bold text-[#332E2B]">{userEmail}</p>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Proprietário</span>
        </div>
      </section>

      {/* 03. COLABORADORES */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#630100]/5 rounded-2xl flex items-center justify-center text-[#630100]">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#332E2B]">Colaboradores</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Partilhe o acesso com os noivos ou planners</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddCollaborator} className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-grow">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="email" 
              required
              placeholder="email@exemplo.com"
              className={inputClass + " pl-12"}
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
            />
          </div>
          
          {/* NOVO: Menu para selecionar a permissão */}
          <select 
            className="bg-[#FDFBF7] border border-gray-200 rounded-2xl px-4 py-4 sm:py-0 text-[11px] font-bold text-gray-600 uppercase tracking-wider outline-none focus:border-[#630100] font-montserrat h-[54px]"
            value={collaboratorRole}
            onChange={(e) => setCollaboratorRole(e.target.value)}
          >
            <option value="editor">Pode Editar</option>
            <option value="viewer">Apenas Leitura</option>
          </select>

          <button 
            type="submit"
            disabled={adding}
            className="bg-[#630100] text-[#EFDFBB] h-[54px] px-8 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Convidar
          </button>
        </form>

        <div className="space-y-3">
          {loading ? (
             <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-200" /></div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400">
               <p className="text-xs">Este projeto ainda não tem colaboradores externos.</p>
            </div>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-[#630100]/20 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{collab.user_email}</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* NOVO: Mostra a permissão correta baseada no banco de dados */}
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${collab.role === 'viewer' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                    {collab.role === 'viewer' ? 'Apenas Leitura' : 'Editor'}
                  </span>
                  <button onClick={() => removeCollaborator(collab.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}