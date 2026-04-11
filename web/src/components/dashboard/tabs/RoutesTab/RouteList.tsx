"use client";

import { Edit2, ExternalLink, Power, Users, Clock, MapPin } from "lucide-react";
import type { Route } from "@/types/route.types";

interface RouteListProps {
  routes: Route[];
  onEdit: (route: Route) => void;
  onToggleStatus: (id: string) => void;
}

export function RouteList({ routes, onEdit, onToggleStatus }: RouteListProps) {
  if (routes.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
        <MapPin size={48} className="text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhuma rota encontrada</h3>
        <p className="text-gray-500 max-w-sm">
          Você ainda não cadastrou nenhuma rota de venda. Clique no botão "Nova Rota" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {routes.map((route) => (
          <div 
            key={route.id} 
            className={`bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all flex flex-col group ${!route.active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-purple-500/10 rounded-lg text-[10px] font-mono font-black text-purple-400 border border-purple-500/20">
                ROTA {String(route.code).padStart(3, '0')}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                <Users size={12} />
                {route.clientCount} Clientes
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                {route.name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <Clock size={12} className="text-gray-600" />
                Periodicidade: {route.periodicity} dias
              </div>
              {route.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{route.description}</p>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onEdit(route)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all border border-white/10"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all border border-white/10"
                >
                  <ExternalLink size={18} />
                </button>
              </div>

              <button 
                onClick={() => onToggleStatus(route.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  route.active 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                }`}
              >
                <Power size={14} />
                {route.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">ID</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Descrição / Nome</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Periodicidade</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Clientes</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {routes.map((route) => (
              <tr key={route.id} className={`group hover:bg-white/[0.02] transition-colors ${!route.active ? 'opacity-50 grayscale' : ''}`}>
                <td className="p-5">
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono font-black text-purple-400 border border-white/5">
                    {String(route.code).padStart(3, '0')}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                      {route.name}
                    </span>
                    {route.description && (
                      <span className="text-xs text-gray-500 line-clamp-1">{route.description}</span>
                    )}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                    <Clock size={14} className="text-gray-500" />
                    {route.periodicity} dias
                  </div>
                </td>
                <td className="p-5 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">
                    <Users size={12} />
                    {route.clientCount}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      title="Abrir Rota"
                      className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit(route)}
                      title="Editar"
                      className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-purple-400 transition-all shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(route.id)}
                      title={route.active ? "Desativar" : "Ativar"}
                      className={`p-2 rounded-lg transition-all shadow-sm border border-transparent ${
                        route.active 
                          ? "hover:bg-red-500/10 text-gray-400 hover:text-red-400" 
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border-emerald-500/20"
                      }`}
                    >
                      <Power size={18} />
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
