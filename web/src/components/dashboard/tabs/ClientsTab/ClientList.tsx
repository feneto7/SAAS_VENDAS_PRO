"use client";

import { Edit2, Power, MapPin, Phone, User, Map, ExternalLink } from "lucide-react";
import type { Client } from "@/types/client.types";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleStatus: (id: string) => void;
  onOpenClient: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onToggleStatus, onOpenClient }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center backdrop-blur-sm">
        <User size={48} className="text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
        <p className="text-gray-500 max-w-sm">
          Ajuste seus filtros ou cadastre um novo cliente para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {clients.map((client) => (
          <div 
            key={client.id} 
            className={`bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all flex flex-col group ${!client.active ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-emerald-500/10 rounded-lg text-[10px] font-mono font-black text-emerald-400 border border-emerald-500/20">
                CLIE-{String(client.code).padStart(4, '0')}
              </span>
              {client.routeName && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                  <Map size={12} />
                  {client.routeName}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">{client.name}</h3>
              {client.cpf && <p className="text-[10px] text-gray-500 font-mono mb-2">{client.cpf}</p>}
              
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <Phone size={12} className="text-gray-600" />
                  {client.phone || "Sem telefone"}
                </div>
                <div className="flex items-start gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <MapPin size={12} className="text-gray-600 mt-0.5" />
                  <span className="leading-tight">
                    {client.street ? `${client.city || ''} / ${client.state || ''}` : "Endereço não informado"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    console.log("Edit button clicked for client:", client.name);
                    onEdit(client);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all border border-white/10"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onOpenClient(client)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all border border-white/10"
                >
                  <ExternalLink size={18} />
                </button>
              </div>

              <button 
                onClick={() => onToggleStatus(client.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  client.active 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                }`}
              >
                <Power size={14} />
                {client.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">ID</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nome / Cliente</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Rota</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Telefone</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Endereço Completo</th>
              <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {clients.map((client) => (
              <tr key={client.id} className={`group hover:bg-white/[0.02] transition-all ${!client.active ? 'opacity-40 grayscale' : ''}`}>
                <td className="p-5">
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono font-black text-emerald-400 border border-white/5">
                    {String(client.code).padStart(4, '0')}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                      {client.name}
                    </span>
                    {client.cpf && <span className="text-[10px] text-gray-600 font-mono">{client.cpf}</span>}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                      <Map size={12} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {client.routeName || "Sem Rota"}
                    </span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Phone size={14} className="text-gray-600" />
                    {client.phone || "---"}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 max-w-xs">
                    <MapPin size={14} className="text-gray-600 shrink-0" />
                    <span className="text-xs text-gray-400 truncate">
                      {client.street ? `${client.street}${client.number ? `, ${client.number}` : ''} - ${client.state || ''} - ${client.city || ''}` : "Não informado"}
                    </span>
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onOpenClient(client)}
                      title="Abrir Cliente"
                      className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit(client)}
                      title="Editar"
                      className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-purple-400 transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(client.id)}
                      title={client.active ? "Desativar" : "Ativar"}
                      className={`p-2.5 rounded-xl transition-all ${
                        client.active 
                          ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400" 
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
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
