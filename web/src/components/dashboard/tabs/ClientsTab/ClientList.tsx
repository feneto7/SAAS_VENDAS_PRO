"use client";

import { Edit2, Power, MapPin, Phone, User, Map } from "lucide-react";
import type { Client } from "@/types/client.types";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleStatus: (id: string) => void;
}

export function ClientList({ clients, onEdit, onToggleStatus }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center backdrop-blur-sm">
        <User size={48} className="text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
        <p className="text-gray-500 max-w-sm">
          Ajuste seus filtros ou cadastre um novo cliente para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto">
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
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono font-bold text-emerald-400 border border-white/5">
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
                          : "bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white"
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
