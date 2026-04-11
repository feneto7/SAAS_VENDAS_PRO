"use client";

import { useState, useEffect } from "react";
import { X, User, Save, Loader2, MapPin, Phone, CreditCard, Home, Map } from "lucide-react";
import type { Client } from "@/types/client.types";
import type { Route } from "@/types/route.types";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client;
  routes: Route[];
  serverUrl: string;
  tenantSlug: string;
}

export function ClientModal({ isOpen, onClose, onSuccess, client, routes, serverUrl, tenantSlug }: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    routeId: ""
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        cpf: client.cpf || "",
        phone: client.phone || "",
        street: client.street || "",
        number: client.number || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        routeId: client.routeId || ""
      });
    } else {
      setFormData({
        name: "",
        cpf: "",
        phone: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        routeId: ""
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = client 
        ? `${serverUrl}/api/clients/${client.id}` 
        : `${serverUrl}/api/clients`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao salvar cliente");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectionLabel = "text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6";
  const inputLabel = "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block";
  const inputClass = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-purple-500 focus:bg-white/[0.06] outline-none transition-all placeholder:text-gray-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-purple-500/20">
              <User className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {client ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {client ? `Código: ${String(client.code).padStart(4, '0')}` : "Cadastro de Consumidor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all outline-none">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col pb-28 sm:pb-0">
          <div className="px-6 py-4 sm:p-8 space-y-8 sm:space-y-10 flex-1">
            <section className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <h3 className={sectionLabel}><User size={14} /> Dados de Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={inputLabel}>Nome Completo</label>
                  <input required className={inputClass} placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className={inputLabel}>CPF / CNPJ</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3 text-gray-700" size={16} />
                    <input className={`${inputClass} pl-12`} placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={inputLabel}>Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3 text-gray-700" size={16} />
                    <input className={`${inputClass} pl-12`} placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <h3 className={sectionLabel}><Home size={14} /> Endereço de Entrega</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-3">
                  <label className={inputLabel}>Rua / Logradouro</label>
                  <input required className={inputClass} placeholder="Rua..." value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className={inputLabel}>Número</label>
                  <input className={inputClass} placeholder="Nº" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className={inputLabel}>Bairro</label>
                  <input className={inputClass} placeholder="Bairro" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className={inputLabel}>Cidade</label>
                  <input required className={inputClass} placeholder="Cidade" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className={inputLabel}>Estado</label>
                  <input required className={inputClass} placeholder="UF" maxLength={2} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className={inputLabel}>CEP</label>
                  <input className={inputClass} placeholder="00000-000" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <h3 className={sectionLabel}><Map size={14} /> Logística e Setor</h3>
              <div>
                <label className={inputLabel}>Rota de Venda</label>
                <CustomSelect
                  options={[
                    { value: "", label: "Selecione uma rota..." },
                    ...routes.map(r => ({ value: r.id, label: `${r.name} (Cod ${String(r.code).padStart(3, '0')})` }))
                  ]}
                  value={formData.routeId}
                  onChange={val => setFormData({ ...formData, routeId: val })}
                />
              </div>
            </section>
          </div>

          <footer className="fixed sm:relative bottom-0 left-0 right-0 p-6 sm:p-8 border-t border-white/5 bg-[#0c0c0c] sm:bg-black/20 flex gap-4 shrink-0">
            <button type="button" onClick={onClose} className="hidden sm:block flex-1 py-4 text-[10px] font-black text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl uppercase tracking-widest">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] sm:flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-purple-400 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {client ? "Salvar Alterações" : "Cadastrar Cliente"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
