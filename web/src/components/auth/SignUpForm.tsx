"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, X, User } from "lucide-react";

interface SignUpFormProps {
  onClose: () => void;
  onSignInClick: () => void;
}

export function SignUpForm({ onClose, onSignInClick }: SignUpFormProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password matching validation
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
      
      // 1. Register Master User
      const regRes = await fetch(`${serverUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Erro ao criar conta");

      // 2. Login immediately to get token
      const logRes = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const logData = await logRes.json();
      if (!logRes.ok) throw new Error(logData.error || "Erro ao autenticar");

      login(logData.token, logData.user, logData.tenant);
      
      router.push("/setup/personal");
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      setError(err?.message || "Falha ao criar conta. Tente novamente.");
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
            <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Criar Conta Business</h2>
            <p className="text-gray-500 text-sm font-medium">Inicie sua jornada no VendasPro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome" 
                  className={inputClass + " pl-11"}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>E-mail profissional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className={inputClass + " pl-11"}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                <label className={labelClass}>Senha</label>
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
                <div>
                <label className={labelClass}>Confirmar</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                    <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className={inputClass + " pl-11 " + (confirmPassword && !passwordsMatch ? "border-red-500/50" : "")}
                    disabled={loading}
                    />
                </div>
                </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <p className="text-red-400 text-[11px] font-medium text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:grayscale mt-2 shadow-xl shadow-white/5 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Já tem uma conta?{" "}
              <button type="button" onClick={onSignInClick} className="text-white hover:text-purple-400 transition-colors">Entrar</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
