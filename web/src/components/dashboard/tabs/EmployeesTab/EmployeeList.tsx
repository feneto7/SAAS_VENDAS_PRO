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
          <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-3/4 mb-4" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center">
        <p className="text-zinc-500">Nenhum funcionário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((emp) => (
        <div 
          key={emp.id}
          className={`group bg-zinc-900/40 border transition-all duration-300 rounded-2xl p-6 ${
            emp.active 
              ? 'border-white/5 hover:border-emerald-500/30' 
              : 'border-red-500/20 opacity-75'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                emp.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{emp.name}</h3>
                <span className="text-emerald-500/80 text-xs font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full">
                  {emp.role === 'seller' ? 'Vendedor' : emp.role}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {emp.role === 'seller' && (
                <button 
                  onClick={() => onViewStock(emp)}
                  className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                  title="Estoque do Vendedor"
                >
                  <Package size={16} />
                </button>
              )}
              <button 
                onClick={() => onEdit(emp)}
                className="p-2 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-all"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => onToggleStatus(emp.id)}
                className={`p-2 rounded-lg transition-all ${
                  emp.active 
                    ? 'bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-400/10' 
                    : 'bg-red-400/10 text-red-400 hover:bg-emerald-400/10 hover:text-emerald-400'
                }`}
                title={emp.active ? "Desativar" : "Ativar"}
              >
                {emp.active ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Hash size={14} className="text-zinc-600" />
              <span>Código App: <span className="text-zinc-200 font-mono">{emp.appCode || '---'}</span></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Phone size={14} className="text-zinc-600" />
              <span>{emp.phone || 'Sem telefone'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Mail size={14} className="text-zinc-600" />
              <span className="truncate">{emp.email}</span>
            </div>
          </div>

            <div className="flex flex-wrap gap-2">
              {emp.routeIds?.length > 0 ? (
                emp.routeIds.map((rid, idx) => (
                  <span key={rid} className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border flex items-center gap-1.5 ${getRouteColor(rid)}`}>
                     <Map size={10} /> Rota #{idx + 1}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-600 italic">Nenhuma rota vinculada</span>
              )}
            </div>
        </div>
      ))}
    </div>
  );
}
