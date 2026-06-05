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

  const sectionLabel = "nm-heading flex items-center gap-2 mb-6";
  const inputLabel = "nm-input-group__label mb-1";
  const inputClass = "nm-input";

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div className="nm-modal nm-modal--lg" onClick={(e) => e.stopPropagation()}>

        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--lg">
              <User size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">
                {client ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                {client ? `Código: ${String(client.code).padStart(4, '0')}` : "Cadastro de Consumidor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="nm-modal__body">
          <div className="space-y-6">
            <section className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <section className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <section className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
        </form>

        <footer className="nm-modal__footer">
          <button type="button" onClick={onClose} className="nm-btn nm-btn--flat" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} type="button" disabled={loading} className="nm-btn nm-btn--accent" style={{ flex: 1 }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {client ? "Salvar Alterações" : "Cadastrar Cliente"}
          </button>
        </footer>
      </div>
    </div>
  );
}
