"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, User, Smartphone, Key, Hash, ChevronDown, Check, Map, Globe } from 'lucide-react';
import { Employee } from '@/types/employee.types';

const ROUTE_COLORS = [
  'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  'border-orange-500/30 text-orange-400 bg-orange-500/10',
  'border-purple-500/30 text-purple-400 bg-purple-500/10',
  'border-blue-500/30 text-blue-400 bg-blue-500/10',
  'border-red-500/30 text-red-400 bg-red-500/10',
  'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
];

const getRouteColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ROUTE_COLORS[hash % ROUTE_COLORS.length];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
  serverUrl: string;
  tenantSlug: string;
}

interface Route {
  id: string;
  name: string;
}

export default function EmployeeModal({ isOpen, onClose, onSuccess, employee, serverUrl, tenantSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState({
    name:     employee?.name || '',
    appCode:  employee?.appCode || '',
    password: '', // Don't fill password for security
    confirmPassword: '',
    phone:    employee?.phone || '',
    email:    employee?.email || '',
    role:     employee?.role || 'seller',
    webAccess: employee?.webAccess || false,
    routeIds: employee?.routeIds || []
  });
  const [isRouteSelectOpen, setIsRouteSelectOpen] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [tenantSlug]);

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/routes?limit=100`, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      const data = await res.json();
      setRoutes(data.items || []);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    setLoading(true);
    try {
      const url = employee 
        ? `${serverUrl}/api/employees/${employee.id}` 
        : `${serverUrl}/api/employees`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar funcionário');
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoute = (id: string) => {
    setFormData(prev => ({
      ...prev,
      routeIds: prev.routeIds.includes(id)
        ? prev.routeIds.filter(rid => rid !== id)
        : [...prev.routeIds, id]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div className="nm-modal nm-modal--lg" onClick={(e) => e.stopPropagation()}>

        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
             <div className="nm-icon-circle nm-icon-circle--success nm-icon-circle--lg">
                <User size={20} />
             </div>
             <div>
               <h2 className="nm-modal__title">
                {employee ? 'Editar Cadastro' : 'Novo Funcionário'}
               </h2>
               <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                 Configure o acesso mobile.
               </p>
             </div>
          </div>
          <button type="button" onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="nm-modal__body custom-scrollbar">
          <div className="space-y-6">
            <div className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
               <div className="flex items-center gap-2 mb-4">
                <User size={16} className="nm-text-accent" />
                <span className="nm-heading">Identificação</span>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="nm-input-group__label mb-1">
                    Nome Completo <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="nm-input"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="nm-input-group__label mb-1">
                      Perfil de Acesso
                    </label>
                    <div 
                      className="nm-input" 
                      style={{ padding: "0.25rem", display: "flex", gap: "0.25rem" }}
                    >
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'seller' })}
                        style={{
                           flex: 1,
                           borderRadius: "calc(var(--nm-radius) - 4px)",
                           fontSize: "10px",
                           fontWeight: "bold",
                           textTransform: "uppercase",
                           letterSpacing: "0.1em",
                           transition: "all 0.2s",
                           backgroundColor: formData.role === 'seller' ? "var(--nm-accent)" : "transparent",
                           color: formData.role === 'seller' ? "#fff" : "var(--nm-text-muted)",
                           boxShadow: formData.role === 'seller' ? "var(--nm-shadow-sm)" : "none",
                        }}
                      >
                        Vendedor
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                        style={{
                           flex: 1,
                           borderRadius: "calc(var(--nm-radius) - 4px)",
                           fontSize: "10px",
                           fontWeight: "bold",
                           textTransform: "uppercase",
                           letterSpacing: "0.1em",
                           transition: "all 0.2s",
                           backgroundColor: formData.role === 'admin' ? "var(--nm-accent)" : "transparent",
                           color: formData.role === 'admin' ? "#fff" : "var(--nm-text-muted)",
                           boxShadow: formData.role === 'admin' ? "var(--nm-shadow-sm)" : "none",
                        }}
                      >
                        Administrador
                      </button>
                    </div>
                  </div>

                  {/* Código App */}
                  <div className="space-y-2">
                    <label className="nm-input-group__label mb-1">
                      Código App (Mobile)
                    </label>
                    <input
                      required
                      value={formData.appCode}
                      onChange={e => setFormData({ ...formData, appCode: e.target.value })}
                      className="nm-input font-mono"
                      placeholder="Ex: 1001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone size={16} className="nm-text-accent" />
                <span className="nm-heading">Contato e Acesso Web</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="nm-input-group__label mb-1">Celular</label>
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="nm-input"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="nm-input-group__label mb-1">Email (Login Web)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="nm-input"
                    placeholder="vendedor@empresa.com"
                  />
                </div>
              </div>

              {/* Password Fields - Unified */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="nm-input-group__label mb-1" style={{ color: "var(--nm-accent)" }}>
                    Senha de Acesso <span className="text-emerald-500">*</span>
                  </label>
                  <div className="nm-input-group nm-input-group--with-icon">
                    <Key className="nm-input-group__icon" size={16} />
                    <input
                      required={!employee}
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="nm-input"
                      placeholder={employee ? "••••••••" : "Senha"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="nm-input-group__label mb-1" style={{ color: "var(--nm-accent)" }}>
                    Confirmar Senha <span className="text-emerald-500">*</span>
                  </label>
                  <div className="nm-input-group nm-input-group--with-icon">
                    <Key className="nm-input-group__icon" size={16} />
                    <input
                      required={!employee || formData.password !== ''}
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`nm-input ${
                        formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'nm-input--error' 
                          : ''
                      }`}
                      placeholder={employee ? "••••••••" : "Repita a senha"}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-zinc-600 italic px-1 -mt-2">Esta senha será usada tanto para o painel web quanto para o aplicativo móvel.</p>

              {/* Web Access Toggle */}
              <div 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  formData.webAccess 
                    ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
                onClick={() => setFormData({ ...formData, webAccess: !formData.webAccess })}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${formData.webAccess ? 'bg-purple-500/20 border-purple-500/20 text-purple-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${formData.webAccess ? 'text-purple-400' : 'text-zinc-300'}`}>Acesso Web</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Permitir login no painel administrativo</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.webAccess ? 'bg-purple-500' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.webAccess ? 'left-7' : 'left-1'}`} />
                </div>
              </div>

              </div>

              {/* Seletor de Rotas */}
              <div className="space-y-2 pt-2">
                <label className="nm-input-group__label mb-1">Rotas Designadas</label>
                <div className="relative">
                  <div 
                    className="nm-input"
                    style={{ minHeight: "38px", height: "auto", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", paddingRight: "2.5rem" }}
                    onClick={() => setIsRouteSelectOpen(!isRouteSelectOpen)}
                  >
                    {formData.routeIds.length === 0 && (
                      <span className="text-zinc-500" style={{ fontSize: "var(--nm-text-sm)" }}>Vincule rotas de venda...</span>
                    )}
                    {formData.routeIds.map(rid => {
                      const rName = routes.find(r => r.id === rid)?.name || rid;
                      const colorClass = getRouteColor(rid);
                      return (
                        <span 
                          key={rid}
                          className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 uppercase tracking-tighter shadow-sm ${colorClass}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRoute(rid);
                          }}
                        >
                          <Map size={10} />
                          {rName}
                          <X size={10} className="ml-0.5 opacity-60 hover:opacity-100" />
                        </span>
                      );
                    })}
                    <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-transform duration-300 ${isRouteSelectOpen ? 'rotate-180' : ''}`} size={16} />
                  </div>

                  {isRouteSelectOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 nm-card nm-card--sm z-[99] max-h-56 overflow-y-auto p-2 custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                      {routes.length === 0 && (
                        <div className="p-4 text-zinc-500 text-xs italic text-center">Nenhuma rota ativa cadastrada.</div>
                      )}
                      {routes.map(r => {
                        const isSelected = formData.routeIds.includes(r.id);
                        return (
                          <div 
                            key={r.id}
                            onClick={() => toggleRoute(r.id)}
                            className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all mb-1 last:mb-0 cursor-pointer ${
                              isSelected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-white/10'}`} />
                              {r.name}
                            </div>
                            {isSelected && <Check size={16} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </form>

        <footer className="nm-modal__footer">
          <button type="button" onClick={onClose} className="nm-btn nm-btn--flat" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button disabled={loading} onClick={handleSubmit} type="button" className="nm-btn nm-btn--success" style={{ flex: 1 }}>
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Finalizar Cadastro
          </button>
        </footer>
      </div>
    </div>
  );
}
