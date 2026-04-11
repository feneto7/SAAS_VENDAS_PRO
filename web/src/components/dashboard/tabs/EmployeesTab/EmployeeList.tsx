"use client";

import React from 'react';
import { Edit2, ShieldAlert, ShieldCheck, Mail, Phone, Hash, Map, Package } from 'lucide-react';
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
  employees: Employee[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (id: string) => void;
  onViewStock: (employee: Employee) => void;
}

export default function EmployeeList({ employees, loading, onEdit, onToggleStatus, onViewStock }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-32" />
                <div className="h-3 bg-white/5 rounded w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-12 text-center backdrop-blur-sm">
        <Hash size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhum funcionário encontrado</h3>
        <p className="text-gray-500">Cadastre o seu primeiro colaborador para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {employees.map((emp) => (
          <div 
            key={emp.id} 
            className={`bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all flex flex-col group ${!emp.active ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-inner ${
                  emp.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-500 border-white/10'
                }`}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                    {emp.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-md border border-white/10">
                    {emp.role === 'seller' ? 'Vendedor' : emp.role}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => onToggleStatus(emp.id)}
                className={`p-3 rounded-xl transition-all border ${
                  emp.active 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
                }`}
              >
                <Hash size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <Hash size={14} className="text-gray-600" />
                <span>Código App: <span className="text-white font-mono">{emp.appCode || '---'}</span></span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <Phone size={14} className="text-gray-600" />
                <span>{emp.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <Mail size={14} className="text-gray-600" />
                <span className="truncate">{emp.email}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {emp.routeIds?.length > 0 ? (
                emp.routeIds.map((rid, idx) => (
                  <span key={rid} className={`text-[9px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 uppercase tracking-widest ${getRouteColor(rid)}`}>
                     <Map size={10} /> Rota {idx + 1}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-600 italic font-bold uppercase tracking-widest">Nenhuma rota vinculada</span>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
              <button 
                onClick={() => onEdit(emp)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10"
              >
                <Edit2 size={16} />
                Editar
              </button>
              {emp.role === 'seller' && (
                <button 
                  onClick={() => onViewStock(emp)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-blue-500/20"
                >
                  <Package size={16} />
                  Estoque
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Colaborador</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cargo / Código</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contato</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Rotas</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {employees.map((emp) => (
              <tr key={emp.id} className={`group hover:bg-white/[0.02] transition-colors ${!emp.active ? 'opacity-50 grayscale' : ''}`}>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                      emp.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-500 border-white/10'
                    }`}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                      {emp.name}
                    </span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-0.5 w-fit bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-md border border-white/10">
                      {emp.role === 'seller' ? 'Vendedor' : emp.role}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">APP: {emp.appCode || '---'}</span>
                  </div>
                </td>
                <td className="p-5 text-xs text-gray-400">
                  <div className="flex flex-col">
                    <span className="font-bold">{emp.phone || '---'}</span>
                    <span className="text-[10px] opacity-60 truncate max-w-[150px]">{emp.email}</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex flex-wrap gap-1">
                    {emp.routeIds?.length > 0 ? (
                      emp.routeIds.slice(0, 2).map((rid) => (
                        <div key={rid} className={`w-2 h-2 rounded-full border border-white/10 ${getRouteColor(rid).split(' ')[2]}`} title="Rota ativa" />
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-600 italic">Nenhuma</span>
                    )}
                    {emp.routeIds?.length > 2 && <span className="text-[9px] text-gray-600 font-bold">+{emp.routeIds.length - 2}</span>}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {emp.role === 'seller' && (
                      <button 
                        onClick={() => onViewStock(emp)}
                        className="p-2.5 bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-xl transition-all border border-white/10"
                        title="Ver Estoque"
                      >
                        <Package size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => onEdit(emp)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/10"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(emp.id)}
                      className={`p-2.5 rounded-xl transition-all border ${
                        emp.active 
                          ? 'bg-white/5 text-gray-500 border-white/10 hover:bg-red-500/10 hover:text-red-400' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
                      }`}
                      title={emp.active ? "Desativar" : "Ativar"}
                    >
                      {emp.active ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
