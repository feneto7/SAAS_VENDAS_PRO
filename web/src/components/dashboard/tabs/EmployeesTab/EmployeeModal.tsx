"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, User, Smartphone, Key, Hash, ChevronDown, Check, Map } from 'lucide-react';
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
    phone:    employee?.phone || '',
    email:    employee?.email || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />
      
      <div className="relative bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out will-change-transform">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <User className="text-emerald-400" size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight">
                {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
               </h2>
               <p className="text-xs text-zinc-500 italic">Configure o acesso mobile.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <User size={14} /> Nome Completo
              </label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                placeholder="Ex: João da Silva"
              />
            </div>

            {/* Código App */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Hash size={14} /> Código App (Login)
              </label>
              <input
                required
                value={formData.appCode}
                onChange={e => setFormData({ ...formData, appCode: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="Ex: 1001"
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Key size={14} /> Senha App
              </label>
              <input
                required={!employee}
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder={employee ? "Deixe em branco para manter" : "****"}
              />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Smartphone size={14} /> Celular
              </label>
              <input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="00 00000-0000"
              />
            </div>

            {/* Email (Opcional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="vendedor@empresa.com"
              />
            </div>
          </div>

          {/* Seletor de Rotas (Multi-select JIRA Style) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Rotas Vinculadas</label>
            <div 
              className="min-h-[50px] bg-zinc-900 border border-white/5 rounded-xl p-2 cursor-pointer relative"
              onClick={() => setIsRouteSelectOpen(!isRouteSelectOpen)}
            >
              <div className="flex flex-wrap gap-2 pr-8">
                {formData.routeIds.length === 0 && (
                  <span className="text-zinc-600 text-sm py-1.5 px-2">Clique para selecionar as rotas...</span>
                )}
                {formData.routeIds.map(rid => {
                  const rName = routes.find(r => r.id === rid)?.name || rid;
                  const colorClass = getRouteColor(rid);
                  return (
                    <span 
                      key={rid}
                      className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border flex items-center gap-1.5 group/tag transition-all hover:brightness-110 ${colorClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRoute(rid);
                      }}
                    >
                      <Map size={12} />
                      {rName}
                      <X size={12} className="cursor-pointer hover:text-white ml-0.5" />
                    </span>
                  );
                })}
              </div>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />

              {isRouteSelectOpen && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-10 p-2"
                  onClick={e => e.stopPropagation()}
                >
                  {routes.length === 0 && (
                    <div className="p-3 text-zinc-500 text-sm italic">Nenhuma rota cadastrada.</div>
                  )}
                  {routes.map(r => {
                    const isSelected = formData.routeIds.includes(r.id);
                    return (
                      <div 
                        key={r.id}
                        onClick={() => toggleRoute(r.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                          isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {r.name}
                        {isSelected && <Check size={14} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 font-inter">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : <><Save size={20} /> Salvar Funcionário</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
