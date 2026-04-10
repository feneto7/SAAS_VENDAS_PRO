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
      
      const method = "POST";

      const res = await fetch(url, {
        method,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c0c0c] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <header className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <User className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {client ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                {client ? `Código: ${String(client.code).padStart(4, '0')}` : "Cadastro de Consumidor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-10">
            
            {/* Essential Info */}
            <section>
              <h3 className={sectionLabel}><User size={14} /> Dados Essenciais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={inputLabel}>Nome Completo</label>
                  <input 
                    required
                    className={inputClass}
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={inputLabel}>CPF / CNPJ</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 text-gray-700" size={18} />
                    <input 
                      className={`${inputClass} pl-12`}
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={inputLabel}>Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-700" size={18} />
                    <input 
                      className={`${inputClass} pl-12`}
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Address */}
            <section>
              <h3 className={sectionLabel}><Home size={14} /> Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className={inputLabel}>Rua / Logradouro</label>
                  <input 
                    required
                    className={inputClass}
                    placeholder="Ex: Av. Atlântica"
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div>
                  <label className={inputLabel}>Número</label>
                  <input 
                    className={inputClass}
                    placeholder="Ex: 101"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={inputLabel}>Bairro</label>
                  <input 
                    className={inputClass}
                    placeholder="Ex: Centro"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={inputLabel}>Cidade</label>
                  <input 
                    required
                    className={inputClass}
                    placeholder="Ex: Balneário Camboriú"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className={inputLabel}>Estado (UF)</label>
                  <input 
                    required
                    className={inputClass}
                    placeholder="Ex: SC"
                    maxLength={2}
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={inputLabel}>CEP</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 text-gray-700" size={18} />
                    <input 
                      className={`${inputClass} pl-12`}
                      placeholder="88330-000"
                      value={formData.zipCode}
                      onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Logistics */}
            <section>
              <h3 className={sectionLabel}><Map size={14} /> Logística</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={inputLabel}>Vincular à Rota</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Selecione uma rota..." },
                      ...routes.map(r => ({ 
                        value: r.id, 
                        label: `${r.name} (Código ${String(r.code).padStart(3, '0')})` 
                      }))
                    ]}
                    value={formData.routeId}
                    onChange={val => setFormData({ ...formData, routeId: val })}
                  />
                </div>
              </div>
            </section>

          </div>
        </form>

        <footer className="p-8 border-t border-white/5 bg-black/20 flex gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-4 text-xs font-black text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-4 bg-white text-black rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-purple-400 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {client ? "Salvar Alterações" : "Cadastrar Cliente"}
          </button>
        </footer>
      </div>
    </div>
  );
}
