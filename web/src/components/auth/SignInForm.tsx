"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, X } from "lucide-react";

interface SignInFormProps {
  onClose: () => void;
  onSignUpClick: () => void;
}

export function SignInForm({ onClose, onSignUpClick }: SignInFormProps) {
  const { isLoaded, signIn, setActive } = useSignIn() as any;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    if (!isLoaded) return;
    try {
      signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Erro ao iniciar login com Google:", err);
    }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 ml-1";
  const inputClass = "w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-700 disabled:opacity-50";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Bem-vindo de Volta</h2>
            <p className="text-gray-500 text-sm font-medium">Acesse sua conta VendasPro</p>
          </div>

          <div className="space-y-4 mb-8">
            <button 
              onClick={loginWithGoogle}
              className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/[0.1] transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-200" alt="Google" />
              Continuar com Google
            </button>
          </div>

          <div className="relative flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">ou E-mail</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Seu E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com" 
                  className={inputClass + " pl-11"}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className={inputClass + " pl-11"}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <p className="text-red-400 text-[11px] font-medium text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 mt-2 shadow-xl shadow-white/5"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar na Plataforma
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Não tem uma conta?{" "}
              <button onClick={onSignUpClick} className="text-white hover:text-purple-400 transition-colors">Cadastrar Empresa</button>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
