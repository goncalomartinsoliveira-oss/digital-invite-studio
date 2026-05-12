"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Key, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // O Supabase lida com os tokens na URL automaticamente e guarda a sessão "temporária" de recuperação
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        console.log("Modo de recuperação ativado.");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${params.locale}/dashboard`);
      }, 3000);
      
    } catch (error: any) {
      setErrorMsg("Erro ao atualizar a password. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 focus:border-[#630100] text-base text-gray-800 rounded-xl px-4 py-3 transition-colors font-montserrat outline-none";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block font-montserrat";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] font-montserrat p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center"
      >
        <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-40 h-auto mx-auto mb-8" />

        {success ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-green-500/30">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="font-serif text-3xl text-gray-800">Password Atualizada!</h2>
            <p className="text-sm text-gray-500">A sua conta está segura. A redirecionar para o painel...</p>
          </div>
        ) : (
          <div className="text-left space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#630100] mb-2">Nova Password</h2>
              <p className="text-xs text-gray-500">Crie uma nova password para a sua conta.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs p-4 rounded-xl text-center font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className={labelClass}>Nova Password (Min. 6 Caracteres)</label>
                <input 
                  type="password" 
                  required 
                  minLength={6} 
                  className={inputClass} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || password.length < 6} 
                className="w-full bg-[#630100] text-[#EFDFBB] py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-[#4a0100] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Key size={16} /> Guardar Nova Password</>}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}