"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, Loader2, User, FileText, Phone, CheckCircle2, ShieldCheck, LogOut } from "lucide-react";

export default function PersonalSetupPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState("");
  const [initTime] = useState(Date.now());

  console.log('[SetupPage] Rendering...', { 
    authLoading, 
    user: user?.email, 
    checkingStatus,
    timeSinceInit: Date.now() - initTime 
  });

  // Form states
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 15);
    }
    return value.substring(0, 15);
  };

  useEffect(() => {
    // Safety timeout: stop showing spinner after 5 seconds no matter what
    const timeout = setTimeout(() => {
      if (checkingStatus) {
        console.warn('[SetupPage] Safety timeout reached. Forcing checkingStatus to false.');
        setCheckingStatus(false);
      }
    }, 5000);

    if (!authLoading && user) {
        console.log('[SetupPage] Auth ready, user detected. Checking status...');
        setName(user.name || "");
        checkStatus();
    } else if (!authLoading && !user) {
        console.log('[SetupPage] Auth ready, NO user. Redirecting...');
        router.push("/");
    }

    return () => clearTimeout(timeout);
  }, [authLoading, user]);

  const checkStatus = async () => {
    if (!user) {
      console.warn('[SetupPage] checkStatus called without user.');
      setCheckingStatus(false);
      return;
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
    console.log('[SetupPage] Fetching status from:', `${serverUrl}/auth/status/${user.id}`);
    
    try {
        const res = await fetch(`${serverUrl}/auth/status/${user.id}`);
        console.log('[SetupPage] Status response:', res.status);
        
        if (res.ok) {
            const data = await res.json();
            console.log('[SetupPage] Status data:', data);
            
            if (data.onboardingStep === 'completed') {
                console.log('[SetupPage] Onboarding completed. Redirecting to dashboard...');
                if (data.tenant?.slug) {
                    localStorage.setItem("tenant_slug", data.tenant.slug);
                }
                router.push("/dashboard");
                return; // Keep checkingStatus true until redirect
            }
        } else {
          console.warn('[SetupPage] Status fetch failed with status:', res.status);
        }
    } catch (err) {
        console.error("[SetupPage] Status check error:", err);
    } finally {
        console.log('[SetupPage] Setting checkingStatus to false.');
        setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpf || !phone) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    // Save to temp state or proceed to next page
    // The requirement says: "quando clicar em cadastrar... levar o usuario para a tela de cadastro da empresa"
    // We will pass this data to the next step via URL params or sessionStorage
    
    sessionStorage.setItem("onboarding_personal", JSON.stringify({
        name,
        cpf,
        phone
    }));

    router.push("/setup");
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 ml-1";
  const inputClass = "w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-700";
  const sectionTitleClass = "flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest mb-6";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center py-12 px-6 overflow-x-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[130px] rounded-full pointer-events-none z-0" />
      
      <div className="relative w-full max-w-xl z-10">
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5"
            >
                <ArrowLeft size={14} />
                Voltar
            </button>

            <button 
                onClick={() => logout()}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5"
            >
                <LogOut size={14} />
                Sair
            </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-12">
            <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400">
                1. Cadastro
            </div>
            <ArrowRight size={12} className="text-purple-900" />
            <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                2. Perfil do Contratante
            </div>
            <ArrowRight size={12} className="text-gray-700" />
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-600">
                3. Empresa
            </div>
        </div>

        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-6 animate-in zoom-in-95 duration-500">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black mb-3 tracking-tighter">Dados do <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Contratante</span></h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto font-medium">
            Quase lá! Precisamos de alguns dados seus para configurar seu perfil de administrador e o primeiro vendedor da sua empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white/[0.02] p-6 sm:p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-200">
          
          <section>
            <div className={sectionTitleClass}>
              <User className="w-4 h-4" />
              <span>Identificação</span>
            </div>
            <div className="space-y-6">
                <div>
                <label className={labelClass}>Nome Completo *</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className={inputClass}
                />
                </div>
                <div>
                <label className={labelClass}>CPF *</label>
                <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className={inputClass}
                />
                </div>
            </div>
          </section>

          <section>
            <div className={sectionTitleClass}>
              <Phone className="w-4 h-4" />
              <span>Contato</span>
            </div>
            <div>
              <label className={labelClass}>WhatsApp / Celular *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
                type="submit"
                className="group relative w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-purple-500 hover:text-white transition-all active:scale-[0.98] shadow-2xl shadow-white/5"
            >
                Continuar para Empresa
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </form>

        <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
           <div className="flex items-center gap-2 italic"> <CheckCircle2 size={12} /> Segurança LGPD </div>
           <div className="flex items-center gap-2 italic"> <CheckCircle2 size={12} /> Dados Criptografados </div>
        </div>
      </div>
    </div>
  );
}
