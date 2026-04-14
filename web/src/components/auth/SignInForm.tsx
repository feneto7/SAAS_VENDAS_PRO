"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, X } from "lucide-react";

interface SignInFormProps {
  onClose: () => void;
  onSignUpClick: () => void;
}

export function SignInForm({ onClose, onSignUpClick }: SignInFormProps) {
  const { login } = useAuth();
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
    setLoading(true);
    setError("");

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
      const res = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      login(data.token, data.user, data.tenant);
      
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      setError(err?.message || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 ml-1";
  const inputClass = "w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-700 disabled:opacity-50";

  if (!mounted) return null;

  return (
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
              className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-2 shadow-xl shadow-white/5"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
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
              <button type="button" onClick={onSignUpClick} className="text-white hover:text-purple-400 transition-colors">Cadastrar Empresa</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
