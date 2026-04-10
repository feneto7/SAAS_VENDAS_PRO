"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Loader2, MapPin, Phone, Building } from "lucide-react";

export default function SetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !user) return;

    setLoading(true);
    setError("");

    // Check if the env var exists and isn't the string "undefined"
    const envUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    const serverUrl = (envUrl && envUrl !== "undefined") ? envUrl : "http://localhost:3001";

    try {
      const response = await fetch(`${serverUrl}/auth/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          clerkId: user.id,
          addressData,
          contact,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar o banco de dados da empresa.");
      }

      const data = await response.json();
      localStorage.setItem("tenant_slug", data.slug);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center py-12 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Configure sua Empresa</h1>
          <p className="text-gray-400">
            Olá, <span className="text-white">{user?.firstName || "empreendedor"}</span>! 
            Complete os dados abaixo para criarmos sua infraestrutura dedicada.
          </p>
        </div>

        <form onSubmit={handleCreateCompany} className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
          {/* Company Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              <Building className="w-4 h-4" />
              <span>Identificação</span>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Nome da Empresa *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Felipe Confecções"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              <MapPin className="w-4 h-4" />
              <span>Endereço</span>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-4">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Logradouro / Rua</label>
                <input
                  type="text"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  placeholder="Rua..."
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Número</label>
                <input
                  type="text"
                  value={addressData.number}
                  onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                  placeholder="123"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Bairro</label>
                <input
                  type="text"
                  value={addressData.neighborhood}
                  onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                  placeholder="Centro"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">CEP</label>
                <input
                  type="text"
                  value={addressData.zipCode}
                  onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                  placeholder="00000-000"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Cidade</label>
                <input
                  type="text"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              <Phone className="w-4 h-4" />
              <span>Contato</span>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">WhatsApp / Celular</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-purple-500/50 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-4 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !companyName}
            className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl shadow-white/5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Finalizar Configuração
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Ao finalizar, criaremos um banco de dados dedicado e isolado para sua empresa.
        </p>
      </div>
    </div>
  );
}
