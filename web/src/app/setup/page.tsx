"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Loader2, MapPin, Phone, Building, CheckCircle2 } from "lucide-react";

import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

export default function SetupPage() {
  const { user, isLoaded, step, refresh } = useOnboardingStatus();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [personalData, setPersonalData] = useState<{name: string, cpf: string, phone: string} | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact] = useState("");
  const [addressData, setAddressData] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Phone mask: (99) 99999-9999
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
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem("onboarding_personal");
        if (stored) {
            setPersonalData(JSON.parse(stored));
        } else if (isLoaded && step === 'personal' && !stored) {
            router.push("/setup/personal");
        }
    }
  }, [isLoaded, step]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !user || !personalData) return;

    setLoading(true);
    setError("");

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

    try {
      const response = await fetch(`${serverUrl}/auth/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          clerkId: user.id,
          addressData,
          contact: contact || personalData.phone,
          ownerName: personalData.name,
          ownerCpf: personalData.cpf
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar o banco de dados da empresa.");
      }

      const data = await response.json();
      localStorage.setItem("tenant_slug", data.slug);
      sessionStorage.removeItem("onboarding_personal");
      
      // Force refresh status hook
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 ml-1";
  const inputClass = "w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-700";
  const sectionTitleClass = "flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest mb-6";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center py-12 px-6 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[130px] rounded-full pointer-events-none z-0" />
      
      <div className="relative w-full max-w-2xl z-10">
        {/* Progress Display */}
        <div className="flex items-center justify-center gap-2 mb-12">
            <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400">
                1. Configuração de Conta
            </div>
            <ArrowRight size={12} className="text-gray-700" />
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-600">
                2. Dashboard
            </div>
        </div>

        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-8 animate-in zoom-in-95 duration-500">
            <Zap className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter">Prepare-se para <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Vencer.</span></h1>
          <p className="text-gray-400 sm:text-lg max-w-lg mx-auto font-medium">
            Seja bem-vindo, <span className="text-white font-bold">{user?.firstName || "Parceiro"}</span>! 
            Estamos a um passo de criar sua infraestrutura dedicada.
          </p>
        </div>

        <form onSubmit={handleCreateCompany} className="space-y-12 bg-white/[0.02] p-6 sm:p-10 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* Identification Section */}
          <section>
            <div className={sectionTitleClass}>
              <Building className="w-4 h-4" />
              <span>Sua Marca</span>
            </div>
            <div>
              <label className={labelClass}>Nome Fantasia / Empresa *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Alcantara Distribuidora"
                className={inputClass}
                disabled={loading}
              />
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <div className={sectionTitleClass}>
              <Phone className="w-4 h-4" />
              <span>Como te achamos?</span>
            </div>
            <div>
              <label className={labelClass}>WhatsApp Comercial *</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
                disabled={loading}
              />
            </div>
          </section>

          {/* Address Section */}
          <section>
            <div className={sectionTitleClass}>
              <MapPin className="w-4 h-4" />
              <span>Onde você está?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
              <div className="sm:col-span-4">
                <label className={labelClass}>Rua / Logradouro</label>
                <input
                  type="text"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  placeholder="Rua..."
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Número</label>
                <input
                  type="text"
                  value={addressData.number}
                  onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                  placeholder="123"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Bairro</label>
                <input
                  type="text"
                  value={addressData.neighborhood}
                  onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                  placeholder="Seu Bairro"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>CEP</label>
                <input
                  type="text"
                  value={addressData.zipCode}
                  onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                  placeholder="00000-000"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-4">
                <label className={labelClass}>Cidade</label>
                <input
                  type="text"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="Sua Cidade"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className={inputClass + " text-center uppercase"}
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
                type="submit"
                disabled={loading || !companyName}
                className="group relative w-full h-16 sm:h-20 bg-white text-black font-black uppercase tracking-[0.2em] rounded-[2rem] flex items-center justify-center gap-3 hover:bg-purple-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale shadow-2xl shadow-white/5"
            >
                {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                ) : (
                <>
                    Criar Minha Empresa
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </>
                )}
            </button>
          </div>
        </form>

        <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
           <div className="flex items-center gap-2 italic"> <CheckCircle2 size={12} /> Isolação Total </div>
           <div className="flex items-center gap-2 italic"> <CheckCircle2 size={12} /> Onboarding </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
