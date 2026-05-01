"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      alert("Erro no login: " + error.message);
      setLoading(false);
    } else {
      // Login com sucesso! Redireciona para o dashboard
      // Vamos redirecionar para o slug que criámos (pedro-e-marta)
      router.push(`/${params.locale}/dashboard/pedro-e-marta`);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7] font-sans px-4">
      <div className="bg-white p-10 shadow-sm border border-neutral-200 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl uppercase tracking-tighter">Studio Login</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-40">Introduza as suas credenciais</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-[0.3em] opacity-50">Email</label>
            <input 
              type="email" 
              required
              className="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition-colors"
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-[0.3em] opacity-50">Password</label>
            <input 
              type="password" 
              required
              className="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition-colors"
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-black text-white py-4 uppercase tracking-[0.3em] text-[10px] font-bold hover:bg-neutral-800 transition-all disabled:bg-neutral-400"
          >
            {loading ? "A entrar..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}