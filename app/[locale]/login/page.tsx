"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 1. IMPORTAR OS DICIONÁRIOS (3 Níveis de recuo para app/[locale]/login/page.tsx)
import pt from "../../../dictionaries/pt";
import en from "../../../dictionaries/en";

const dictionaries = {
  pt: pt,
  en: en
};

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  
  // 2. DESCOBRIR A LÍNGUA ATUAL
  const locale = (params?.locale as 'en' | 'pt') || 'pt';
  const dict = dictionaries[locale]?.LoginPage || dictionaries.pt.LoginPage;

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push(`/${params.locale}/dashboard`);
        
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setErrorMsg(dict.errors.emailInUse);
        } else {
          router.push(`/${params.locale}/dashboard`);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message === "Invalid login credentials" ? dict.errors.invalidCredentials : dict.errors.genericAuth);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${params.locale}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: any) {
      setErrorMsg(dict.errors.resetMail);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-brand text-base text-gray-800 px-0 py-3 transition-colors font-montserrat placeholder-gray-300";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 block font-montserrat";

  return (
    <div className="min-h-screen flex bg-cream font-montserrat overflow-hidden">
      
      {/* LADO ESQUERDO: Apresentação da Marca */}
      <div className="hidden lg:flex w-1/2 bg-brand flex-col justify-between p-16 relative">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#8a0201] to-brand-dark opacity-30 blur-3xl"></div>
        
        {/* LOGOTIPO CLICÁVEL (DESKTOP) */}
        <div className="relative z-10">
          <Link href={`/${params.locale}`}>
            <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-48 h-auto filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
          </Link>
        </div>

        <div className="relative z-10 text-gold-soft space-y-6 max-w-md">
          <h1 className="font-serif text-5xl leading-tight font-light italic">{dict.hero.title}</h1>
          <p className="text-sm opacity-80 leading-relaxed font-light font-montserrat">{dict.hero.desc}</p>
        </div>
        <div className="relative z-10 text-[10px] uppercase tracking-widest text-gold-soft/50 font-bold font-montserrat">© {new Date().getFullYear()} {dict.hero.copyright}</div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative">
        <div className="absolute inset-0 bg-white/50 lg:hidden"></div>
        <div className="w-full max-w-md space-y-12 relative z-10 bg-white lg:bg-transparent p-10 lg:p-0 rounded-3xl lg:rounded-none shadow-xl lg:shadow-none border border-gray-100 lg:border-none">
          
          {/* LOGOTIPO CLICÁVEL (MOBILE) */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href={`/${params.locale}`}>
              <img src="/logo-dis.svg" alt="Digital Invite Studio" className="w-40 h-auto cursor-pointer hover:scale-105 transition-transform" />
            </Link>
          </div>

          {isForgotPassword ? (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button onClick={() => setIsForgotPassword(false)} className="flex items-center gap-2 text-gray-400 hover:text-brand text-[10px] font-bold uppercase tracking-widest mb-8 transition-colors">
                 <ArrowLeft size={14} /> {dict.reset.backToLogin}
              </button>
              
              <div className="space-y-3 text-center lg:text-left mb-8">
                <h2 className="font-serif text-4xl text-brand font-regular">{dict.reset.title}</h2>
                <p className="text-sm text-gray-500 font-montserrat">{dict.reset.desc}</p>
              </div>

              {resetSent ? (
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto">✓</div>
                  <h3 className="text-green-800 font-bold">{dict.reset.successTitle}</h3>
                  <p className="text-xs text-green-700 font-medium">{dict.reset.successDesc}</p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-8">
                  <AnimatePresence mode="wait">
                    {errorMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-100 text-red-500 text-xs p-4 rounded-xl text-center font-semibold font-montserrat">{errorMsg}</motion.div>}
                  </AnimatePresence>
                  <div>
                    <label className={labelClass}>{dict.reset.emailLabel}</label>
                    <input type="email" required className={inputClass} placeholder={dict.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-brand text-gold-soft py-4.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 font-montserrat">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>{dict.reset.btn} <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-500">
              <div className="space-y-3 text-center lg:text-left mb-8">
                <h2 className="font-serif text-4xl text-brand font-regular">{isLogin ? dict.auth.loginTitle : dict.auth.registerTitle}</h2>
                <p className="text-sm text-gray-500 font-montserrat">{isLogin ? dict.auth.loginDesc : dict.auth.registerDesc}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-8">
                <AnimatePresence mode="wait">
                  {errorMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-100 text-red-500 text-xs p-4 rounded-xl text-center font-semibold font-montserrat">{errorMsg}</motion.div>}
                </AnimatePresence>

                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>{dict.auth.emailLabel}</label>
                    <input type="email" required className={inputClass} placeholder={dict.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className={labelClass}>{dict.auth.passwordLabel}</label>
                      {isLogin && (
                        <button type="button" onClick={() => {setIsForgotPassword(true); setErrorMsg(""); setResetSent(false);}} className="text-[10px] font-bold text-gray-400 hover:text-brand transition-colors font-montserrat">{dict.auth.forgotPassword}</button>
                      )}
                    </div>
                    <input type="password" required minLength={6} className={inputClass} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-brand text-gold-soft py-4.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 font-montserrat">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isLogin ? dict.auth.loginBtn : dict.auth.registerBtn} <ArrowRight size={16} /></>}
                </button>
              </form>

              <div className="text-center pt-8 border-t border-gray-100 mt-8">
                <p className="text-xs text-gray-500 font-montserrat">
                  {isLogin ? dict.auth.noAccountPrompt : dict.auth.hasAccountPrompt}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); setPassword(""); }} className="font-bold text-brand hover:underline underline-offset-4 ml-1 transition-all">
                    {isLogin ? dict.auth.createAccountLink : dict.auth.loginLink}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}