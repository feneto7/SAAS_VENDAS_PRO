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
      toast.error('As senhas não coincidem!');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />
      
      <div className="relative bg-zinc-950 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-xl h-[95vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <User className="text-emerald-400" size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight">
                {employee ? 'Editar Cadastro' : 'Novo Funcionário'}
               </h2>
               <p className="text-xs text-zinc-500 italic">Configure o acesso mobile.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-6">
               <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Identificação</span>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Nome Completo <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Perfil de Acesso
                    </label>
                    <div className="flex bg-zinc-900/50 rounded-2xl p-1 border border-white/5">
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'seller' })}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          formData.role === 'seller' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Vendedor
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          formData.role === 'admin' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Administrador
                      </button>
                    </div>
                  </div>

                  {/* Código App */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Código App (Mobile)
                    </label>
                    <input
                      required
                      value={formData.appCode}
                      onChange={e => setFormData({ ...formData, appCode: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                      placeholder="Ex: 1001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <div className="flex items-center gap-2 text-zinc-400 border-b border-white/5 pb-3">
                <Smartphone size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Contato e Acesso Web</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Celular</label>
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email (Login Web)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="vendedor@empresa.com"
                  />
                </div>
              </div>

              {/* Password Fields - Unified */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest ml-1">
                    Senha de Acesso <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                      required={!employee}
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                      placeholder={employee ? "••••••••" : "Senha"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest ml-1">
                    Confirmar Senha <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                      required={!employee || formData.password !== ''}
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full bg-zinc-900/50 border rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 transition-all shadow-inner ${
                        formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-500/50 focus:ring-red-500/20' 
                          : 'border-white/5 focus:ring-emerald-500/20'
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
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Rotas Designadas</label>
                <div className="relative">
                  <div 
                    className="min-h-[56px] bg-zinc-900/50 border border-white/5 rounded-2xl p-3 cursor-pointer flex flex-wrap gap-2 pr-10 items-center transition-all hover:bg-white/[0.04]"
                    onClick={() => setIsRouteSelectOpen(!isRouteSelectOpen)}
                  >
                    {formData.routeIds.length === 0 && (
                      <span className="text-zinc-600 text-sm pl-1">Vincule rotas de venda...</span>
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
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-20 p-2 custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                      {routes.length === 0 && (
                        <div className="p-4 text-zinc-600 text-xs italic text-center">Nenhuma rota ativa cadastrada.</div>
                      )}
                      {routes.map(r => {
                        const isSelected = formData.routeIds.includes(r.id);
                        return (
                          <div 
                            key={r.id}
                            onClick={() => toggleRoute(r.id)}
                            className={`flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all mb-1 last:mb-0 ${
                              isSelected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
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

        <footer className="relative px-6 py-6 sm:px-8 sm:py-6 bg-zinc-950 border-t border-white/5 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold py-4 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={20} /> Finalizar Cadastro</>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
